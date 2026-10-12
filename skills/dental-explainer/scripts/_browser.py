"""Shared Playwright setup for check.py and render.py.

- GPU first: headless Chromium uses the machine's GPU where it has one (Metal on a Mac): about 10-35x faster than software GL.
  Falls back to SwiftShader (software GL) when the GPU path has no WebGL (CI, containers).
- three.js r128 is cached on disk after the first download and served locally, so later runs don't wait on cdnjs.
"""
from __future__ import annotations
import os, pathlib, sys, urllib.request

CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
CACHE = pathlib.Path(os.environ.get("DK_CACHE", pathlib.Path.home() / ".cache" / "dental-explainer")) / "three-r128.min.js"
GPU_ARGS = ["--ignore-gpu-blocklist", "--enable-gpu", "--enable-webgl"]
SOFT_ARGS = ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
PROBE = "(() => { const gl = document.createElement('canvas').getContext('webgl'); if (!gl) return ''; const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl'; })()"


def three_path(local: str | None) -> str | None:
    """A local three.js file to serve instead of the CDN: --three-local, else the disk cache (downloaded once)."""
    if local:
        return local
    if CACHE.exists() and CACHE.stat().st_size > 100_000:
        return str(CACHE)
    try:
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        data = urllib.request.urlopen(CDN, timeout=10).read()
        if len(data) > 100_000:
            CACHE.write_bytes(data)
            return str(CACHE)
    except Exception:
        pass
    return None   # the page loads it from cdnjs itself


def launch(p, soft: bool = False):
    """Launch Chromium on the GPU if it gives WebGL, else on SwiftShader. Returns (browser, renderer name)."""
    if not soft and os.environ.get("DK_SOFTWARE_GL") != "1":
        b = p.chromium.launch(args=GPU_ARGS)
        pg = b.new_page(); r = pg.evaluate(PROBE); pg.close()
        if r:
            return b, r
        b.close()
    b = p.chromium.launch(args=SOFT_ARGS)
    pg = b.new_page(); r = pg.evaluate(PROBE) or "none"; pg.close()
    return b, r


def route_three(pg, path: str | None):
    if path:
        pg.route(CDN, lambda r: r.fulfill(path=path, content_type="application/javascript"))


def progress(i: int, n: int, t0: float, every: int = 10):
    """One line per ~10% so a long render is never silent."""
    import time
    step = max(1, n * every // 100)
    if i == n - 1 or (i + 1) % step == 0:
        el = time.time() - t0; eta = el / (i + 1) * (n - i - 1)
        print(f"  frame {i + 1}/{n}  {el:.0f}s elapsed, ~{eta:.0f}s left", flush=True)
