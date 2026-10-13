#!/usr/bin/env python3
"""Test the skill end to end: the same checks CI runs.

  python3 scripts/test.py            check everything (needs Playwright + Chromium for the browser checks)
  python3 scripts/test.py --fix      rebuild example pages whose kit or script is out of date, then check
  python3 scripts/test.py --fast     only the offline checks (example pages in sync, video kept off)
  python3 scripts/test.py implant    only examples whose name contains "implant"

For every examples/<name>.js:
  1. examples/<name>.html must equal a fresh build.py of it (same title, mode and aspect), so the pages never
     ship an old kit;
  2. check.py must print OK (no JS errors, every default state and procedure step shot);
  3. the figure must also build and render as an image (render.py -> PNG).
Shots and PNGs go to --out (default: a temp folder) so you can look at them.
"""
from __future__ import annotations
import argparse, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "dental-explainer"
EX = SKILL / "examples"
sys.path.insert(0, str(SKILL / "scripts"))
import build  # noqa: E402

failures: list[str] = []


def fail(msg: str):
    failures.append(msg); print("FAIL", msg, flush=True)


def page_params(html: str):
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    mode = re.search(r"window\.DK_MODE = '(\w+)'", html)
    aspect = re.search(r"window\.DK_ASPECT = '([\d:]+)'", html)
    import html as h
    return (h.unescape(title.group(1)) if title else "Dental figure", mode.group(1) if mode else "interactive", aspect.group(1) if aspect else "16:9")


def run(cmd: list[str]) -> tuple[int, str]:
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="?", default="")
    ap.add_argument("--fix", action="store_true"); ap.add_argument("--fast", action="store_true")
    ap.add_argument("--out"); ap.add_argument("--soft", action="store_true", help="force software GL (CI)")
    a = ap.parse_args()
    out = pathlib.Path(a.out or tempfile.mkdtemp(prefix="dk-test-")); out.mkdir(parents=True, exist_ok=True)
    scripts = sorted(p for p in EX.glob("*.js") if a.only in p.stem)
    if not scripts:
        sys.exit(f"no examples match {a.only!r}")

    # video stays switched off until it ships
    kit = (SKILL / "assets" / "dentkit.js").read_text()
    if "!window.DK_ENABLE_VIDEO" not in kit:
        fail("dentkit.js no longer gates video mode behind window.DK_ENABLE_VIDEO")
    if run([sys.executable, str(SKILL / "scripts" / "build.py"), str(scripts[0]), "-o", str(out / "v.html"), "--mode", "video"])[0] == 0:
        fail("build.py --mode video should refuse (video is coming soon)")

    for js in scripts:
        name = js.stem; page = js.with_suffix(".html")
        if not page.exists():
            fail(f"{name}: no examples/{name}.html (build it with build.py)"); continue
        title, mode, aspect = page_params(page.read_text())
        fresh = build.build(js.read_text(), title, None, mode, aspect)
        if page.read_text() != fresh:
            if a.fix:
                page.write_text(fresh); print(f"rebuilt {page.relative_to(ROOT)}")
            else:
                fail(f"{name}: examples/{name}.html is out of date with dentkit.js or {name}.js (run scripts/test.py --fix)")
        if a.fast:
            continue
        soft = ["--soft"] if a.soft else []
        code, log = run([sys.executable, str(SKILL / "scripts" / "check.py"), str(page), "--out", str(out / name)] + soft)
        if code == 2:
            print(log); sys.exit("SKIP: Playwright/Chromium or three.js unavailable; run with --fast or install Playwright")
        last = log.splitlines()[-1] if log else ""
        if code != 0 or not last.startswith("OK"):
            fail(f"{name}: check.py\n{log}")
        else:
            print(f"ok   {name}: {last}", flush=True)
        img = out / f"{name}-image.html"
        img.write_text(build.build(js.read_text(), title, None, "image", "16:9"))
        code, log = run([sys.executable, str(SKILL / "scripts" / "render.py"), str(img), "-o", str(out / f"{name}.png")] + soft)
        if code != 0:
            fail(f"{name}: render.py image\n{log}")
        else:
            print(f"ok   {name}: image {out / (name + '.png')}", flush=True)

    print(f"\noutput: {out}")
    if failures:
        print(f"{len(failures)} failure(s)"); sys.exit(1)
    print("all checks passed")


if __name__ == "__main__":
    main()
