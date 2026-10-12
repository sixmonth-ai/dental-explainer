#!/usr/bin/env python3
"""Render a figure page built with --mode image or --mode video to a file (needs Python Playwright + Chromium).

usage: python3 render.py figure.html -o figure.png [--width 1600] [--dark]
       python3 render.py figure.html -o figure.mp4 [--width 1920] [--fps 30] [--dark]

PNG: the page's final story frame at 2x. MP4: steps the story frame by frame (deterministic, no dropped frames)
and encodes with ffmpeg; without ffmpeg it records in the page instead and writes .webm.
If Playwright or three.js is unavailable it prints "SKIP: ..." and exits 2: deliver the HTML page, which has its own
Download button.
"""
import argparse, base64, pathlib, shutil, subprocess, sys, tempfile

CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--width", type=int); ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--dark", action="store_true"); ap.add_argument("--three-local")
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("SKIP: Playwright is not installed. Deliver the HTML page; it has a Download button."); sys.exit(2)
    out = pathlib.Path(a.out); video = out.suffix.lower() in (".mp4", ".webm")
    width = a.width or (1920 if video else 1600)
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        # the frame is width x width/aspect; the page adds ~60px for the action row
        pg = b.new_page(viewport={"width": width + 32, "height": 1400}, device_scale_factor=1, color_scheme="dark" if a.dark else "light")
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        if a.three_local:
            pg.route(CDN, lambda r: r.fulfill(path=a.three_local, content_type="application/javascript"))
        pg.goto(pathlib.Path(a.page).resolve().as_uri())
        if not pg.evaluate("typeof THREE !== 'undefined'"):
            print("SKIP: three.js did not load (no access to cdnjs?). Deliver the HTML page instead."); b.close(); sys.exit(2)
        try:
            pg.wait_for_function("window.__dkReady === true", timeout=20000)
        except Exception:
            print("FAIL: the figure never finished starting.\n" + ("\n".join(errors) or "(no JS error was reported)")); b.close(); sys.exit(1)
        pg.evaluate("document.fonts.ready")
        mode = pg.evaluate("window.__dkFig.mode")
        if mode == "interactive":
            print("note: page was built as interactive; rendering it anyway. Rebuild with --mode image/video for the framed layout.")
        if not video:
            pg.wait_for_timeout(600)  # let labels fade in
            data = pg.evaluate("window.__dkFig.exportPNG(2)")
            out.write_bytes(base64.b64decode(data.split(",", 1)[1]))
        else:
            dur = pg.evaluate("window.__dkFig.duration")
            if not dur:
                print("FAIL: video needs fig.story([...]) in the figure script."); b.close(); sys.exit(1)
            ff = shutil.which("ffmpeg")
            if ff and out.suffix.lower() == ".mp4":
                n = int(round(dur * a.fps))
                scale = 1920 / pg.evaluate("window.__dkFig.stage.clientWidth")
                with tempfile.TemporaryDirectory() as tmp:
                    for i in range(n):
                        pg.evaluate(f"window.__dkFig.seek({i / a.fps})")
                        data = pg.evaluate(f"window.__dkFig.composite({scale}).toDataURL('image/png')")
                        pathlib.Path(tmp, f"f{i:05d}.png").write_bytes(base64.b64decode(data.split(",", 1)[1]))
                    subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(a.fps), "-i", str(pathlib.Path(tmp, "f%05d.png")),
                                    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", str(out)], check=True)
            else:
                data = pg.evaluate("""async () => { const b = await window.__dkFig.recordVideo();
                    return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); }""")
                if out.suffix.lower() == ".mp4" and "video/webm" in data[:30]:
                    out = out.with_suffix(".webm"); print("note: no ffmpeg, wrote WebM instead of MP4")
                out.write_bytes(base64.b64decode(data.split(",", 1)[1]))
        b.close()
    if errors:
        print("\n".join(errors)); sys.exit(1)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
