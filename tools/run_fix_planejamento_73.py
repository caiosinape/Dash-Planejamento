from __future__ import annotations

import base64
import gzip
import json
import subprocess

import fix_planejamento_73 as fix


def _find_override_rows(value):
    """Localiza a lista real de registros em cargas diretas ou envelopadas."""
    if isinstance(value, list):
        if len(value) == 650 and all(
            isinstance(row, dict) and "contract" in row and "name" in row
            for row in value
        ):
            return value
        for child in value:
            found = _find_override_rows(child)
            if found is not None:
                return found
        return None

    if isinstance(value, dict):
        preferred_keys = (
            "overrides",
            "rows",
            "items",
            "records",
            "data",
            "payload",
            "values",
        )
        for key in preferred_keys:
            if key in value:
                found = _find_override_rows(value[key])
                if found is not None:
                    return found

        values = list(value.values())
        if len(values) == 650 and all(
            isinstance(row, dict) and "contract" in row and "name" in row
            for row in values
        ):
            return values

        for child in values:
            found = _find_override_rows(child)
            if found is not None:
                return found

    return None


def load_overrides_compatible():
    encoded_parts = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        encoded_parts.append(
            subprocess.check_output(
                ["git", "show", f"origin/main:{path}"], text=True
            ).strip()
        )

    payload = json.loads(
        gzip.decompress(base64.b64decode("".join(encoded_parts))).decode("utf-8")
    )
    rows = _find_override_rows(payload)
    if rows is None:
        payload_type = type(payload).__name__
        payload_keys = list(payload.keys()) if isinstance(payload, dict) else []
        raise RuntimeError(
            "Carga do Modelo v2 sem lista reconhecível de registros. "
            f"Tipo: {payload_type}; chaves: {payload_keys}"
        )
    if len(rows) != 650:
        raise RuntimeError(f"Carga do Modelo v2 contém {len(rows)} registros; esperado: 650")
    return rows


fix.load_overrides = load_overrides_compatible
fix.main()
