#!/usr/bin/env python3
"""
Vienreizējs palīgs: pievieno FALLBACK_PHRASES katrā atslēgā `ru: "<en vērtība>"`, ja `ru` vēl nav.
Palaiž: python scripts/add_ru_placeholders_to_fallback.py
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "i18n" / "fallback-phrases.ts"

PAIR_RE = re.compile(
    r'^\s*(lv|en|fr|de|es|pt|ru)\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*$',
    re.MULTILINE,
)


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def ts_unescape(raw: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(raw):
        if raw[i] == "\\" and i + 1 < len(raw):
            n = raw[i + 1]
            if n in '"\\':
                out.append(n)
                i += 2
                continue
            if n == "n":
                out.append("\n")
                i += 2
                continue
        out.append(raw[i])
        i += 1
    return "".join(out)


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    m = re.search(
        r"(export\s+const\s+FALLBACK_PHRASES\s*=\s*\{)([\s\S]*)(\}\s*as\s+const)",
        text,
    )
    if not m:
        sys.exit("Could not find FALLBACK_PHRASES block")
    pre, blob, post = m.group(1), m.group(2), m.group(3)

    chunks = re.findall(
        r'("[a-z0-9_.]+"\s*:\s*\{)([\s\S]*?)(\n  \},\s*)',
        blob,
    )
    new_blob = blob
    added = 0
    for key_open, inner, closing in chunks:
        if re.search(r"^\s*ru\s*:", inner, re.MULTILINE):
            continue
        locs = {}
        for loc, raw in PAIR_RE.findall(inner):
            locs[loc] = ts_unescape(raw)
        en = locs.get("en")
        if en is None:
            sys.stderr.write(f"skip (no en): {key_open[:40]}...\n")
            continue
        ru_line = f'\n    ru: "{ts_escape(en)}",'
        inner2 = inner.rstrip()
        new_inner = inner2 + ru_line + "\n  "
        old_fragment = key_open + inner + closing
        new_fragment = key_open + new_inner + closing.lstrip("\n")
        if old_fragment not in new_blob:
            sys.stderr.write(f"fragment mismatch for {key_open}\n")
            continue
        new_blob = new_blob.replace(old_fragment, new_fragment, 1)
        added += 1

    SRC.write_text(pre + new_blob + post, encoding="utf-8")
    sys.stderr.write(f"added ru placeholder on {added} keys → {SRC}\n")


if __name__ == "__main__":
    main()
