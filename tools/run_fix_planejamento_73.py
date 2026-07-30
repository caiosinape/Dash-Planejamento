from __future__ import annotations

import base64
import gzip
import json
import math
import os
import subprocess
from pathlib import Path

import fix_planejamento_73 as fix

EXPECTED_TOTALS = [
    [168145.3456, 4288589.97187, 64976.036, 2505164.9864],
    [147245.3930083333, 3721958.315861, 215319.327, 5600261.937388289],
    [234767.7093416666, 8551985.440092644, 282480.636, 9272194.704632578],
    [250311.4533333334, 7007453.637268311, 293249.5193, 7991701.955549969],
    [218891.4093481354, 11338463.850920612, 309076.8495, 10776812.480089143],
    [206424.8499445629, 6771368.000511533, 81772.6059, 2778985.846480144],
]


def _decode_compact_matrix(payload):
    """Decodifica o formato oficial {c: contratos, m: metadados}."""
    if not isinstance(payload, dict):
        return None
    contracts = payload.get("c")
    metadata = payload.get("m")
    if not isinstance(contracts, dict) or not isinstance(metadata, dict):
        return None

    rows = []
    for contract, compact_rows in contracts.items():
        if not isinstance(compact_rows, list):
            raise RuntimeError(f"Contrato {contract} não contém uma lista de itens")
        for row_index, compact in enumerate(compact_rows, start=1):
            if not isinstance(compact, list) or len(compact) != 10:
                raise RuntimeError(
                    f"Linha compactada inválida em {contract}, posição {row_index}: "
                    f"esperados 10 campos"
                )
            (
                name,
                occurrence,
                price,
                balance,
                base,
                plan,
                plan_value,
                executed,
                executed_value,
                orders,
            ) = compact
            arrays = {
                "plan": plan,
                "planValue": plan_value,
                "exec": executed,
                "execValue": executed_value,
                "orders": orders,
            }
            for field, values in arrays.items():
                if not isinstance(values, list) or len(values) != 12:
                    raise RuntimeError(
                        f"Campo {field} inválido em {contract}, item {name}: "
                        "esperados 12 meses"
                    )
            rows.append(
                {
                    "contract": contract,
                    "name": name,
                    "occurrence": int(occurrence),
                    "price": float(price or 0),
                    "balance": float(balance or 0),
                    "base": float(base or 0),
                    "plan": plan,
                    "planValue": plan_value,
                    "exec": executed,
                    "execValue": executed_value,
                    "orders": orders,
                }
            )

    expected_contracts = int(metadata.get("contracts", 0))
    expected_items = int(metadata.get("items", 0))
    if expected_contracts != 15 or len(contracts) != 15:
        raise RuntimeError(
            f"Quantidade de contratos divergente: metadado={expected_contracts}, "
            f"matriz={len(contracts)}, esperado=15"
        )
    if expected_items != 650 or len(rows) != 650:
        raise RuntimeError(
            f"Quantidade de itens divergente: metadado={expected_items}, "
            f"matriz={len(rows)}, esperado=650"
        )
    return rows, metadata


def _find_override_rows(value):
    """Mantém compatibilidade com listas diretas e envelopes antigos."""
    compact = _decode_compact_matrix(value)
    if compact is not None:
        return compact[0]

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
        for key in ("overrides", "rows", "items", "records", "data", "payload", "values"):
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


def _load_payload():
    encoded_parts = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        encoded_parts.append(
            subprocess.check_output(
                ["git", "show", f"origin/main:{path}"], text=True
            ).strip()
        )
    return json.loads(
        gzip.decompress(base64.b64decode("".join(encoded_parts))).decode("utf-8")
    )


def load_overrides_compatible():
    payload = _load_payload()
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


def validate_decoded_rows(rows):
    totals = []
    for month in range(6):
        actual = [
            sum(float(row["plan"][month] or 0) for row in rows),
            sum(float(row["planValue"][month] or 0) for row in rows),
            sum(float(row["exec"][month] or 0) for row in rows),
            sum(float(row["execValue"][month] or 0) for row in rows),
        ]
        for value, expected in zip(actual, EXPECTED_TOTALS[month]):
            if not math.isclose(value, expected, rel_tol=1e-10, abs_tol=0.01):
                raise RuntimeError(
                    f"Total mensal divergente no mês {month + 1}: {actual} != "
                    f"{EXPECTED_TOTALS[month]}"
                )
        totals.append(
            {
                "month": month + 1,
                "plannedQuantity": actual[0],
                "plannedValue": actual[1],
                "executedQuantity": actual[2],
                "executedValue": actual[3],
            }
        )
    return totals


fix.load_overrides = load_overrides_compatible

rows = load_overrides_compatible()
monthly_totals = validate_decoded_rows(rows)

if os.environ.get("DECODE_ONLY") == "1":
    audit = {
        "status": "decoded-and-validated",
        "contracts": len({row["contract"] for row in rows}),
        "items": len(rows),
        "rowWidth": 10,
        "monthsPerSeries": 12,
        "monthlyTotals": monthly_totals,
        "htmlModified": False,
    }
    Path("Planejamento-Colaborativo/direct-overrides-decoded-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(audit, ensure_ascii=False, indent=2))
else:
    fix.main()
