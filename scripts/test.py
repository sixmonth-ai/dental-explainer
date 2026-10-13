#!/usr/bin/env python3
"""Test the skill end to end: the same checks CI runs.

  python3 scripts/test.py            check everything (needs Playwright + Chromium for the browser checks)
  python3 scripts/test.py --fix      rebuild example pages whose kit or script is out of date, then check
  python3 scripts/test.py --fast     only the offline checks (example pages in sync, video kept off)
  python3 scripts/test.py implant    only examples whose name contains "implant"
  python3 scripts/test.py --jobs 1   one example at a time (default: up to 4 side by side)

For every examples/<name>.js:
  1. examples/<name>.html must equal a fresh build.py of it (same title, mode and aspect), so the pages never
     ship an old kit;
  2. check.py must print OK (no JS errors, every default state and procedure step shot);
  3. the figure must also build and render as an image (render.py -> PNG).
Shots and PNGs go to --out (default: a temp folder) so you can look at them.
"""
from __future__ import annotations
import argparse, os, pathlib, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

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
    ap.add_argument("--jobs", type=int, default=min(4, os.cpu_count() or 1), help="examples checked in parallel (default: up to 4)")
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

    browser_jobs = []
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
        if not a.fast:
            browser_jobs.append((js, page, title))

    soft = ["--soft"] if a.soft else []

    def browser_checks(job):
        """check.py + an image render for one example; returns (name, [messages], [failures], skipped)"""
        js, page, title = job; name = js.stem; msgs, fails = [], []
        code, log = run([sys.executable, str(SKILL / "scripts" / "check.py"), str(page), "--out", str(out / name)] + soft)
        if code == 2:
            return name, [log], [], True
        last = log.splitlines()[-1] if log else ""
        if code != 0 or not last.startswith("OK"):
            fails.append(f"{name}: check.py\n{log}")
        else:
            msgs.append(f"ok   {name}: {last}")
        img = out / f"{name}-image.html"
        img.write_text(build.build(js.read_text(), title, None, "image", "16:9"))
        code, log = run([sys.executable, str(SKILL / "scripts" / "render.py"), str(img), "-o", str(out / f"{name}.png")] + soft)
        if code != 0:
            fails.append(f"{name}: render.py image\n{log}")
        else:
            msgs.append(f"ok   {name}: image {out / (name + '.png')}")
        return name, msgs, fails, False

    # each example runs its own browser, so they run side by side (on CI's software GL this is most of the time saved)
    with ThreadPoolExecutor(max_workers=max(1, a.jobs)) as pool:
        for name, msgs, fails, skipped in pool.map(browser_checks, browser_jobs):
            if skipped:
                print(msgs[0]); sys.exit("SKIP: Playwright/Chromium or three.js unavailable; run with --fast or install Playwright")
            for m in msgs:
                print(m, flush=True)
            for f in fails:
                fail(f)

    print(f"\noutput: {out}")
    if failures:
        print(f"{len(failures)} failure(s)"); sys.exit(1)
    print("all checks passed")


if __name__ == "__main__":
    main()
