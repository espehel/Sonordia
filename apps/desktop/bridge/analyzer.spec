# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the Sonordia analyzer bridge.
# Build with:  uv run pyinstaller bridge/analyzer.spec  (from apps/desktop)

from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = []

# torch/librosa/essentia all use dynamic imports + bundled native libs.
# collect_all is the safe-but-large default; trim later if size matters.
for pkg in ("torch", "librosa", "essentia"):
    pkg_datas, pkg_binaries, pkg_hidden = collect_all(pkg)
    datas += pkg_datas
    binaries += pkg_binaries
    hiddenimports += pkg_hidden

hiddenimports += collect_submodules("key_prediction")
hiddenimports += collect_submodules("bpm_analysis")

a = Analysis(
    ["analyzer.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # sklearn comes in transitively via librosa. Its test packages bundle
        # .gz fixtures (e.g. sklearn/datasets/tests/data/openml/...) that have
        # no runtime use and break macOS codesign on hardened-runtime builds.
        "sklearn.tests",
        "sklearn.datasets.tests",
    ],
    noarchive=False,
)

# excludes drops Python modules but PyInstaller's sklearn hook still copies the
# test data dirs. Strip them from the data TOC so codesign doesn't see them.
def _is_test_data(entry):
    dest = entry[0].replace("\\", "/")
    return "sklearn/datasets/tests/" in dest or "sklearn/tests/" in dest

a.datas = [d for d in a.datas if not _is_test_data(d)]

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="analyzer",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="analyzer",
)
