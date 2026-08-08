from __future__ import annotations

import base64
import gzip
import hashlib
import json
import subprocess
from pathlib import Path

OUTPUT = Path("Planejamento-Colaborativo/direct-overrides-shape.json")


def compact_sample(value, depth=0):
    if depth >= 3:
        return {"type": type(value).__name__}
    if isinstance(value, dict):
        keys = list(value.keys())
        return {
            "type": "dict",
            "length": len(value),
            "keys": keys[:30],
            "values": {
                str(key): compact_sample(value[key], depth + 1)
                for key in keys[:8]
            },
        }
    if isinstance(value, list):
        return {
            "type": "list",
            "length": len(value),
            "sample": [compact_sample(item, depth + 1) for item in value[:5]],
        }
    if isinstance(value, str):
        return {
            "type": "str",
            "length": len(value),
            "sample": value[:180],
        }
    return {"type": type(value).__name__, "value": value}


def main():
    parts = []
    part_metadata = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        raw = subprocess.check_output(
            ["git", "show", f"origin/main:{path}"], text=True
        ).strip()
        parts.append(raw)
        part_metadata.append(
            {
                "index": index,
                "length": len(raw),
                "sha256": hashlib.sha256(raw.encode("ascii")).hexdigest(),
            }
        )

    packed = "".join(parts)
    decoded = gzip.decompress(base64.b64decode(packed)).decode("utf-8")
    payload = json.loads(decoded)

    report = {
        "status": "diagnostic-only",
        "htmlModified": False,
        "packedLength": len(packed),
        "decodedLength": len(decoded),
        "decodedSha256": hashlib.sha256(decoded.encode("utf-8")).hexdigest(),
        "parts": part_metadata,
        "topLevel": compact_sample(payload),
        "inference": {},
    }

    if isinstance(payload, dict) and "c" in payload and "m" in payload:
        columns = payload["c"]
        matrix = payload["m"]
        report["inference"] = {
            "format": "compact-column-matrix",
            "columnsType": type(columns).__name__,
            "matrixType": type(matrix).__name__,
            "columnsLength": len(columns) if hasattr(columns, "__len__") else None,
            "matrixLength": len(matrix) if hasattr(matrix, "__len__") else None,
            "columnsPreview": columns[:30] if isinstance(columns, list) else compact_sample(columns),
            "firstMatrixRows": matrix[:5] if isinstance(matrix, list) else compact_sample(matrix),
        }

    OUTPUT.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report["inference"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
