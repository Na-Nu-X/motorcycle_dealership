"""Compile locale/*/LC_MESSAGES/*.po to .mo without GNU gettext.

Usage: python scripts/compile_messages.py
(`manage.py compilemessages` works too when gettext's msgfmt is installed.)
Supports the simple single-line msgid/msgstr entries used in this project.
"""

import ast
import struct
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent


def parse_po(path: Path) -> dict[str, str]:
    messages, key, current = {}, None, None
    for raw in path.read_text(encoding="utf-8").splitlines() + [""]:
        line = raw.strip()
        if line.startswith("msgid "):
            key, current = ast.literal_eval(line[6:]), "id"
        elif line.startswith("msgstr "):
            messages[key] = ast.literal_eval(line[7:])
            current = "str"
        elif line.startswith('"') and current == "str":
            messages[key] += ast.literal_eval(line)
        elif line.startswith('"') and current == "id":
            key += ast.literal_eval(line)
    return messages


def write_mo(messages: dict[str, str], path: Path) -> None:
    keys = sorted(messages)
    ids = b"".join(k.encode() + b"\0" for k in keys)
    strs = b"".join(messages[k].encode() + b"\0" for k in keys)
    n = len(keys)
    key_start = 7 * 4 + 16 * n
    value_start = key_start + len(ids)
    offsets, k_off, v_off = [], 0, 0
    for k in keys:
        kb, vb = k.encode(), messages[k].encode()
        offsets.append((len(kb), key_start + k_off, len(vb), value_start + v_off))
        k_off += len(kb) + 1
        v_off += len(vb) + 1
    header = struct.pack("Iiiiiii", 0x950412DE, 0, n, 28, 28 + 8 * n, 0, 0)
    table = b"".join(struct.pack("ii", a, b) for a, b, _, _ in offsets)
    table += b"".join(struct.pack("ii", c, d) for _, _, c, d in offsets)
    path.write_bytes(header + table + ids + strs)


if __name__ == "__main__":
    for po in BASE.glob("locale/*/LC_MESSAGES/*.po"):
        write_mo(parse_po(po), po.with_suffix(".mo"))
        print(f"compiled {po.relative_to(BASE)}")
