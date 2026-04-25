"""
Long-running Python process for audio analysis.
Communicates via JSON-lines over stdin/stdout.

Startup: emits {"id": "__ready__", "status": "ok"}
Request: {"id": "uuid", "command": "analyze", "path": "/path/to/file.mp3"}
Response: {"id": "uuid", "status": "ok", "key": {...}, "bpm": {...}}
Error: {"id": "uuid", "status": "error", "error": "message"}
"""

import io
import json
import os
import sys
from pathlib import Path

# Force UTF-8 stdin/stdout for the JSON-lines protocol.
# PyInstaller may default to the system locale encoding (sometimes ascii),
# which breaks on non-ASCII file paths or error messages.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")

import torch

from key_prediction import load_model, preprocess_mp3, camelot_output
from bpm_analysis import analyze_bpm


def _resolve_model_path() -> Path:
    """Resolve the model checkpoint path for both dev and PyInstaller modes."""
    env_path = os.environ.get("MODEL_PATH", "")
    if env_path:
        return Path(env_path)

    # PyInstaller sets sys._MEIPASS to the temp dir where bundled data is extracted
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    return base / "checkpoints" / "keynet.pt"


MODEL_PATH = _resolve_model_path()
DEVICE = torch.device(os.environ.get("DEVICE", "cpu"))


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def handle_analyze(request_id: str, audio_path: str, model) -> None:
    path = Path(audio_path)
    if not path.exists():
        emit({"id": request_id, "status": "error", "error": f"File not found: {audio_path}"})
        return

    # Key prediction
    spec = preprocess_mp3(path).to(DEVICE)
    with torch.no_grad():
        outputs = model(spec.unsqueeze(0))
        pred = int(torch.argmax(outputs, dim=1).cpu().item())
    camelot_str, key_text = camelot_output(pred)

    # BPM analysis
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
    })


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
            else:
                emit({"id": request_id, "status": "error", "error": f"Unknown command: {command}"})
        except Exception as e:
            emit({"id": request_id, "status": "error", "error": str(e)})


if __name__ == "__main__":
    main()
