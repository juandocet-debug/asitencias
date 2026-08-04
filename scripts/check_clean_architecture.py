"""Valida dependencias basicas de las capas limpias del backend."""

from __future__ import annotations

import ast
from pathlib import Path
import sys


FORBIDDEN_DOMAIN_PREFIXES = (
    "academic",
    "cloudinary",
    "django",
    "rest_framework",
    "requests",
)


def imported_modules(path: Path):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            yield from (alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            yield node.module


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    domain_files = root.glob("backend/modulos/*/dominio/*.py")
    errors = []

    for path in domain_files:
        for module in imported_modules(path):
            if module.startswith(FORBIDDEN_DOMAIN_PREFIXES):
                errors.append(
                    f"{path.relative_to(root)} importa dependencia prohibida: {module}"
                )

    if errors:
        print("ERROR: el dominio depende de infraestructura:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("OK: las capas de dominio no dependen de infraestructura.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
