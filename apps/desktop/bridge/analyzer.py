"""
Long-running Python process for audio analysis.
Communicates via JSON-lines over stdin/stdout.

Startup: emits {"id": "__ready__", "status": "ok"}

Commands:
- analyze: returns key, bpm, beats
- compute-viz: writes per-feature JSON files into out_dir, returns list of features written
"""

import io
import json
import os
import sys
from pathlib import Path

# Force UTF-8 stdin/stdout for the JSON-lines protocol.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")

import numpy as np
import librosa
import torch

from key_prediction import load_model, preprocess_mp3, camelot_output
from bpm_analysis import analyze_bpm


SAMPLE_RATE = 44100
CQT_HOP = 8820  # 5 frames/sec at 44.1kHz, matches preprocess_mp3
CQT_BINS = 105
CQT_BINS_PER_OCTAVE = 24
CQT_FMIN = 65

WAVEFORM_BUCKETS = 2000
RMS_FRAMES = 2000
CHROMA_FRAMES = 1000
KEY_WINDOW_SEC = 16.0
KEY_HOP_SEC = 4.0


def _resolve_model_path() -> Path:
    env_path = os.environ.get("MODEL_PATH", "")
    if env_path:
        return Path(env_path)
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    return base / "checkpoints" / "keynet.pt"


MODEL_PATH = _resolve_model_path()
DEVICE = torch.device(os.environ.get("DEVICE", "cpu"))


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))


def handle_analyze(request_id: str, audio_path: str, model) -> None:
    path = Path(audio_path)
    if not path.exists():
        emit({"id": request_id, "status": "error", "error": f"File not found: {audio_path}"})
        return

    spec = preprocess_mp3(path).to(DEVICE)
    with torch.no_grad():
        outputs = model(spec.unsqueeze(0))
        pred = int(torch.argmax(outputs, dim=1).cpu().item())
    camelot_str, key_text = camelot_output(pred)

    bpm_result = analyze_bpm(path)

    emit({
        "id": request_id,
        "status": "ok",
        "key": {
            "camelot": camelot_str,
            "key_name": key_text,
            "key_id": pred,
        },
        "bpm": {
            "bpm": bpm_result["bpm"],
            "confidence": bpm_result["confidence"],
            "beat_count": bpm_result["beat_count"],
        },
        "beats": bpm_result["beats"],
    })


def compute_waveform(waveform: np.ndarray, sr: int, out_path: Path) -> None:
    n = len(waveform)
    if n == 0:
        write_json(out_path, {"peaks": [], "duration": 0.0})
        return
    bucket_size = max(1, n // WAVEFORM_BUCKETS)
    n_buckets = min(WAVEFORM_BUCKETS, n // bucket_size)
    trimmed = waveform[: n_buckets * bucket_size].reshape(n_buckets, bucket_size)
    mins = trimmed.min(axis=1)
    maxs = trimmed.max(axis=1)
    peaks = [[round(float(mn), 4), round(float(mx), 4)] for mn, mx in zip(mins, maxs)]
    write_json(out_path, {
        "peaks": peaks,
        "duration": float(n) / float(sr),
    })


def compute_rms(waveform: np.ndarray, sr: int, out_path: Path) -> None:
    n = len(waveform)
    if n == 0:
        write_json(out_path, {"rms": [], "duration": 0.0})
        return
    hop = max(1, n // RMS_FRAMES)
    rms = librosa.feature.rms(y=waveform, hop_length=hop, frame_length=hop * 2)[0]
    peak = float(rms.max())
    if peak > 0:
        rms = rms / peak
    write_json(out_path, {
        "rms": [round(float(v), 4) for v in rms],
        "duration": float(n) / float(sr),
    })


def compute_chroma(waveform: np.ndarray, sr: int, out_path: Path) -> None:
    n = len(waveform)
    if n == 0:
        write_json(out_path, {"chroma": [[] for _ in range(12)], "frames": 0, "duration": 0.0})
        return
    chroma = librosa.feature.chroma_cqt(y=waveform, sr=sr, hop_length=CQT_HOP)
    target = min(CHROMA_FRAMES, chroma.shape[1])
    if target < chroma.shape[1]:
        idx = np.linspace(0, chroma.shape[1] - 1, target).astype(int)
        chroma = chroma[:, idx]
    col_max = chroma.max(axis=0, keepdims=True)
    col_max[col_max == 0] = 1.0
    chroma = chroma / col_max
    write_json(out_path, {
        "chroma": [[round(float(v), 3) for v in row] for row in chroma],
        "frames": int(chroma.shape[1]),
        "duration": float(n) / float(sr),
    })


def compute_keytrack(waveform: np.ndarray, sr: int, model, out_path: Path) -> None:
    if len(waveform) == 0:
        write_json(out_path, {"segments": []})
        return
    cqt = librosa.cqt(
        waveform, sr=sr,
        hop_length=CQT_HOP, n_bins=CQT_BINS,
        bins_per_octave=CQT_BINS_PER_OCTAVE, fmin=CQT_FMIN,
    )
    spec = np.log1p(np.abs(cqt))[:, 0:-2]
    total_frames = spec.shape[1]
    frames_per_sec = float(sr) / float(CQT_HOP)
    win_frames = int(KEY_WINDOW_SEC * frames_per_sec)
    hop_frames = max(1, int(KEY_HOP_SEC * frames_per_sec))
    duration = float(len(waveform)) / float(sr)

    segments = []
    if total_frames < win_frames:
        # Song shorter than one window — single segment over whole track.
        chunk = spec
        tensor = torch.tensor(chunk, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            pred = int(torch.argmax(model(tensor), dim=1).cpu().item())
        camelot_str, _ = camelot_output(pred)
        segments.append({
            "start": 0.0, "end": round(duration, 2),
            "key_id": pred, "camelot": camelot_str,
        })
    else:
        t = 0
        while t + win_frames <= total_frames:
            chunk = spec[:, t : t + win_frames]
            tensor = torch.tensor(chunk, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                pred = int(torch.argmax(model(tensor), dim=1).cpu().item())
            camelot_str, _ = camelot_output(pred)
            segments.append({
                "start": round(t / frames_per_sec, 2),
                "end": round((t + win_frames) / frames_per_sec, 2),
                "key_id": pred,
                "camelot": camelot_str,
            })
            t += hop_frames
        # Tail window aligned to end if there's uncovered audio.
        last_end = segments[-1]["end"] if segments else 0
        if last_end < duration - 0.5:
            chunk = spec[:, total_frames - win_frames :]
            tensor = torch.tensor(chunk, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                pred = int(torch.argmax(model(tensor), dim=1).cpu().item())
            camelot_str, _ = camelot_output(pred)
            segments.append({
                "start": round((total_frames - win_frames) / frames_per_sec, 2),
                "end": round(duration, 2),
                "key_id": pred,
                "camelot": camelot_str,
            })

    write_json(out_path, {"segments": segments})


def handle_compute_viz(request_id: str, audio_path: str, out_dir: str, features: list, model) -> None:
    path = Path(audio_path)
    if not path.exists():
        emit({"id": request_id, "status": "error", "error": f"File not found: {audio_path}"})
        return

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    waveform, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    written = []

    if "waveform" in features:
        compute_waveform(waveform, sr, out / "waveform.json")
        written.append("waveform")
    if "rms" in features:
        compute_rms(waveform, sr, out / "rms.json")
        written.append("rms")
    if "chroma" in features:
        compute_chroma(waveform, sr, out / "chroma.json")
        written.append("chroma")
    if "keytrack" in features:
        compute_keytrack(waveform, sr, model, out / "keytrack.json")
        written.append("keytrack")
    if "beats" in features:
        bpm_result = analyze_bpm(path)
        write_json(out / "beats.json", {
            "bpm": bpm_result["bpm"],
            "beats": bpm_result["beats"],
        })
        written.append("beats")

    emit({"id": request_id, "status": "ok", "written": written})


def main() -> None:
    if not MODEL_PATH.exists():
        emit({"id": "__ready__", "status": "error", "error": f"Model not found: {MODEL_PATH}"})
        sys.exit(1)

    model = load_model(str(MODEL_PATH), DEVICE)
    emit({"id": "__ready__", "status": "ok"})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            emit({"id": "__unknown__", "status": "error", "error": f"Invalid JSON: {e}"})
            continue

        request_id = request.get("id", "__unknown__")
        command = request.get("command")

        try:
            if command == "analyze":
                handle_analyze(request_id, request["path"], model)
            elif command == "compute-viz":
                handle_compute_viz(
                    request_id,
                    request["path"],
                    request["out_dir"],
                    request.get("features", []),
                    model,
                )
            else:
                emit({"id": request_id, "status": "error", "error": f"Unknown command: {command}"})
        except Exception as e:
            emit({"id": request_id, "status": "error", "error": str(e)})


if __name__ == "__main__":
    main()
