#!/usr/bin/env python3
"""Build the release ZIPs into dist/.

  dist/dental-explainer.zip         the skill alone: ChatGPT Skills upload, Claude "Upload a skill"
  dist/dental-explainer-plugin.zip  the OpenAI plugin: platform.openai.com/plugins submission

Checks first that both plugin manifests carry the same version and that the
listing fits OpenAI's submission limits, so a bad package fails here, not in review.
"""
import json
import struct
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "dental-explainer"
DIST = ROOT / "dist"
SKIP = {"__pycache__", ".DS_Store"}


def files_under(path):
    return sorted(p for p in path.rglob("*") if p.is_file() and not SKIP & set(p.parts))


def png_size(path):
    head = path.read_bytes()[:24]
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{path} is not a PNG")
    return struct.unpack(">II", head[16:24])


def check(manifest):
    errors = []
    claude = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text())
    if manifest["version"] != claude["version"]:
        errors.append(f"version mismatch: plugin.json {manifest['version']}, .claude-plugin/plugin.json {claude['version']}")
    ui = manifest["extensions"]["com.openai"]["interface"]
    for key, limit in [("displayName", 30), ("shortDescription", 30), ("longDescription", 4000), ("developerName", 80)]:
        if len(ui[key]) > limit:
            errors.append(f"interface.{key} is {len(ui[key])} chars (max {limit})")
    prompts = ui.get("defaultPrompt", [])
    if len(prompts) > 3 or any(len(p) > 128 for p in prompts):
        errors.append("interface.defaultPrompt: at most 3 prompts of 128 chars")
    for key in ("logo", "composerIcon"):
        icon = ROOT / ui[key]
        if not icon.is_file():
            errors.append(f"interface.{key}: {ui[key]} is missing")
            continue
        w, h = png_size(icon)
        if w != h or not 48 <= w <= 4096 or icon.stat().st_size > 5 * 2**20:
            errors.append(f"interface.{key}: must be square, 48-4096 px, at most 5 MiB (is {w}x{h})")
    if errors:
        sys.exit("\n".join(errors))


def write_zip(name, entries):
    DIST.mkdir(exist_ok=True)
    out = DIST / name
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for src, arc in entries:
            z.write(src, arc)
    print(f"{out.relative_to(ROOT)}  {len(entries)} files, {out.stat().st_size // 1024} KB")


def main():
    manifest = json.loads((ROOT / "plugin.json").read_text())
    check(manifest)
    ui = manifest["extensions"]["com.openai"]["interface"]

    skill = [(p, p.relative_to(SKILL.parent).as_posix()) for p in files_under(SKILL)]
    write_zip("dental-explainer.zip", skill)

    # Plugin root at the archive root: plugin.json, assets/, skills/. No hooks,
    # mcp.json or screenshots: skills-only submissions reject them.
    icons = {ROOT / ui["logo"], ROOT / ui["composerIcon"]}
    plugin = [(ROOT / "plugin.json", "plugin.json"), (ROOT / "LICENSE", "LICENSE")]
    plugin += [(p, p.relative_to(ROOT).as_posix()) for p in sorted(icons)]
    plugin += [(p, p.relative_to(ROOT).as_posix()) for p in files_under(SKILL)]
    write_zip("dental-explainer-plugin.zip", plugin)


if __name__ == "__main__":
    main()
