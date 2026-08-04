"""Impide que el codigo fuente supere el limite arquitectonico acordado."""

from __future__ import annotations

from pathlib import Path
import sys


MAX_LINES = 500
SOURCE_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx", ".css"}
IGNORED_PARTS = {
    ".git",
    ".venv",
    "dist",
    "migrations",
    "node_modules",
    "staticfiles",
    "venv",
}


def source_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in SOURCE_SUFFIXES:
            continue
        if any(part in IGNORED_PARTS for part in path.parts):
            continue
        yield path


def line_count(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as source:
        return sum(1 for _ in source)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    oversized = []
    for path in source_files(root):
        lines = line_count(path)
        if lines > MAX_LINES:
            oversized.append((path.relative_to(root), lines))

    if not oversized:
        print(f"OK: ningun archivo fuente supera {MAX_LINES} lineas.")
        return 0

    print(f"ERROR: archivos que superan {MAX_LINES} lineas:", file=sys.stderr)
    for path, lines in sorted(oversized, key=lambda item: item[1], reverse=True):
        print(f"- {path}: {lines}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
