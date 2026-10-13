#!/usr/bin/env python3
"""Render a figure page built with --mode image to a PNG (needs Python Playwright + Chromium).

usage: python3 render.py figure.html -o figure.png [--width 1600] [--dark]

PNG: the page's final story frame (a numbered storyboard for procedures) at 2x.
Video (MP4, --sheet, --preview) is coming soon and switched off. Maintainers can still try it with DK_ENABLE_VIDEO=1.
Uses the GPU when there is one (falls back to software GL; --soft forces it). three.js is cached after the first run.
If Playwright or three.js is unavailable it prints "SKIP: ..." and exits 2: deliver the HTML page, which has its own
Download button.
"""
import argparse, base64, os, pathlib, shutil, subprocess, sys, tempfile, time


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--width", type=int); ap.add_argument("--fps", type=int)
    ap.add_argument("--dark", action="store_true"); ap.add_argument("--three-local")
    ap.add_argument("--preview", action="store_true", help="draft video: 960 px wide, 12 fps")
    ap.add_argument("--sheet", type=int, metavar="N", help="video page: write a contact sheet of N frames (PNG) instead")
    ap.add_argument("--soft", action="store_true", help="force software GL")
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("SKIP: Playwright is not installed. Deliver the HTML page; it has a Download button."); sys.exit(2)
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import _browser
    out = pathlib.Path(a.out); video = out.suffix.lower() in (".mp4", ".webm")
    sheet = a.sheet
    unreleased = os.environ.get("DK_ENABLE_VIDEO") == "1"   # video is in the kit but not shipped yet
    if (video or sheet or a.preview) and not unreleased:
        print("Video is coming soon and isn't available yet. Render a PNG (-o figure.png) or deliver the interactive page."); sys.exit(2)
    width = a.width or (960 if a.preview else 1920 if video else 1600)
    fps = a.fps or (12 if a.preview else 30)
    errors = []; t_start = time.time()
    with sync_playwright() as p:
        b, gl = _browser.launch(p, a.soft)
        print(f"renderer: {gl}", flush=True)
        # the frame is width x width/aspect; the page adds ~60px for the action row
        pg = b.new_page(viewport={"width": width + 32, "height": 1400}, device_scale_factor=1, color_scheme="dark" if a.dark else "light")
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        if "swiftshader" in gl.lower():
            pg.set_default_timeout(180000)   # software GL (CI): heavy figures load far slower than on a GPU
        _browser.route_three(pg, _browser.three_path(a.three_local))
        if unreleased:
            pg.add_init_script("window.DK_ENABLE_VIDEO = true;")
        pg.goto(pathlib.Path(a.page).resolve().as_uri())
        if not pg.evaluate("typeof THREE !== 'undefined'"):
            print("SKIP: three.js did not load (no access to cdnjs?). Deliver the HTML page instead."); b.close(); sys.exit(2)
        try:
            pg.wait_for_function("window.__dkReady === true", timeout=90000)   # software GL compiles every shader on the first frame
        except Exception:
            print("FAIL: the figure never finished starting.\n" + ("\n".join(errors) or "(no JS error was reported)")); b.close(); sys.exit(1)
        pg.evaluate("document.fonts.ready")
        print(f"ready in {time.time() - t_start:.1f}s", flush=True)
        mode = pg.evaluate("window.__dkFig.mode")
        if mode == "interactive":
            print("note: page was built as interactive; rendering it anyway. Rebuild with --mode image for the framed layout.")
        dur = pg.evaluate("window.__dkFig.duration")
        if sheet:
            if not dur:
                print("FAIL: --sheet needs fig.story([...]) or fig.procedure([...])."); b.close(); sys.exit(1)
            # contact sheet: N evenly spaced frames (procedures: also every step's key frame), each stamped with its time
            data = pg.evaluate("""([n, dur]) => { const f = window.__dkFig, W = f.stage.clientWidth, H = f.stage.clientHeight;
                const ts = [...new Set([...Array(n)].map((_, i) => +(dur * (i + 0.5) / n).toFixed(2)).concat(f.steps.map(s => +s.t.toFixed(2))))].sort((a, b) => a - b);
                const cols = Math.ceil(Math.sqrt(ts.length * 1.2)), rows = Math.ceil(ts.length / cols), s = 640 / W, pw = 640, ph = Math.round(H * s);
                const cv = document.createElement('canvas'); cv.width = cols * pw; cv.height = rows * ph; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
                ts.forEach((t, i) => { f.seek(t); const x = (i % cols) * pw, y = Math.floor(i / cols) * ph; g.drawImage(f.composite(s), x, y, pw, ph);
                  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + pw - 66, y + ph - 24, 64, 22); g.fillStyle = '#fff'; g.font = '600 13px sans-serif'; g.fillText(t.toFixed(1) + ' s', x + pw - 58, y + ph - 9);   // bottom right: clear of the title
                  g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(x + .5, y + .5, pw - 1, ph - 1); });
                f.restoreScale(); return cv.toDataURL('image/png'); }""", [sheet, dur])
            out.write_bytes(base64.b64decode(data.split(",", 1)[1]))
        elif not video:
            pg.wait_for_timeout(600)  # let labels fade in
            data = pg.evaluate("window.__dkFig.exportPNG(2)")
            out.write_bytes(base64.b64decode(data.split(",", 1)[1]))
        else:
            if not dur:
                print("FAIL: video needs fig.story([...]) in the figure script."); b.close(); sys.exit(1)
            ff = shutil.which("ffmpeg")
            if ff and out.suffix.lower() == ".mp4":
                n = int(round(dur * fps))
                scale = width / pg.evaluate("window.__dkFig.stage.clientWidth")
                print(f"rendering {n} frames ({dur:.1f}s at {fps} fps, {width} px wide)", flush=True)
                t0 = time.time()
                with tempfile.TemporaryDirectory() as tmp:
                    for i in range(n):
                        # JPEG frames: the MP4 is lossy anyway, and PNG encoding costs more than the render on a GPU
                        data = pg.evaluate(f"(window.__dkFig.seek({i / fps}), window.__dkFig.composite({scale}).toDataURL('image/jpeg', 0.95))")
                        pathlib.Path(tmp, f"f{i:05d}.jpg").write_bytes(base64.b64decode(data.split(",", 1)[1]))
                        _browser.progress(i, n, t0)
                    subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(fps), "-i", str(pathlib.Path(tmp, "f%05d.jpg")),
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
    print(f"wrote {out} ({out.stat().st_size // 1024} KB) in {time.time() - t_start:.1f}s")

if __name__ == "__main__":
    main()
