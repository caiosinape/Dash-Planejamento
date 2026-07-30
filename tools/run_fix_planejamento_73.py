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

MONTH_ALIASES = {
    "jan": 0, "janeiro": 0, "feb": 1, "fev": 1, "fevereiro": 1,
    "mar": 2, "marco": 2, "março": 2, "apr": 3, "abr": 3, "abril": 3,
    "may": 4, "mai": 4, "maio": 4, "jun": 5, "junho": 5,
    "jul": 6, "julho": 6, "aug": 7, "ago": 7, "agosto": 7,
    "sep": 8, "set": 8, "setembro": 8, "oct": 9, "out": 9, "outubro": 9,
    "nov": 10, "novembro": 10, "dec": 11, "dez": 11, "dezembro": 11,
}


def _month_index(key):
    text = str(key).strip().lower()
    if text in MONTH_ALIASES:
        return MONTH_ALIASES[text]
    try:
        number = int(text)
    except ValueError:
        return None
    if 0 <= number <= 11:
        return number
    if 1 <= number <= 12:
        return number - 1
    return None


def _compact_months(values, field, contract, name):
    """Retorna 12 posições; None significa preservar o valor histórico existente."""
    if isinstance(values, str):
        text = values.strip()
        if text.startswith("[") or text.startswith("{"):
            try:
                values = json.loads(text)
            except json.JSONDecodeError as error:
                raise RuntimeError(
                    f"Campo {field} inválido em {contract}, item {name}: JSON inválido"
                ) from error
        elif "|" in text or ";" in text or "," in text:
            separator = "|" if "|" in text else ";" if ";" in text else ","
            values = [part.strip() for part in text.split(separator)]
        else:
            result = [None] * 12
            result[6] = values
            return result

    if isinstance(values, dict):
        result = [None] * 12
        for key, value in values.items():
            index = _month_index(key)
            if index is None:
                raise RuntimeError(
                    f"Campo {field} inválido em {contract}, item {name}: chave mensal {key!r}"
                )
            result[index] = value
        return result

    if isinstance(values, (list, tuple)):
        if len(values) > 12:
            raise RuntimeError(
                f"Campo {field} inválido em {contract}, item {name}: recebidos {len(values)} meses"
            )
        return list(values) + [None] * (12 - len(values))

    if values is None or isinstance(values, (int, float, bool)):
        result = [None] * 12
        result[6] = values
        return result

    raise RuntimeError(
        f"Campo {field} inválido em {contract}, item {name}: "
        f"tipo={type(values).__name__}, amostra={repr(values)[:160]}"
    )


def _decode_compact_matrix(payload):
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
                    f"Linha compactada inválida em {contract}, posição {row_index}: esperados 10 campos"
                )
            name, occurrence, price, balance, base, plan, plan_value, executed, executed_value, orders = compact
            rows.append({
                "contract": contract,
                "name": name,
                "occurrence": int(occurrence),
                "price": float(price or 0),
                "balance": float(balance or 0),
                "base": float(base or 0),
                "plan": _compact_months(plan, "plan", contract, name),
                "planValue": _compact_months(plan_value, "planValue", contract, name),
                "exec": _compact_months(executed, "exec", contract, name),
                "execValue": _compact_months(executed_value, "execValue", contract, name),
                "orders": _compact_months(orders, "orders", contract, name),
            })

    if int(metadata.get("contracts", 0)) != 15 or len(contracts) != 15:
        raise RuntimeError("Quantidade de contratos divergente; esperado 15")
    if int(metadata.get("items", 0)) != 650 or len(rows) != 650:
        raise RuntimeError("Quantidade de itens divergente; esperado 650")
    return rows, metadata


def _find_override_rows(value):
    compact = _decode_compact_matrix(value)
    if compact is not None:
        return compact[0]
    if isinstance(value, list):
        if len(value) == 650 and all(isinstance(row, dict) and "contract" in row and "name" in row for row in value):
            return value
        for child in value:
            found = _find_override_rows(child)
            if found is not None:
                return found
    if isinstance(value, dict):
        for key in ("overrides", "rows", "items", "records", "data", "payload", "values"):
            if key in value:
                found = _find_override_rows(value[key])
                if found is not None:
                    return found
        for child in value.values():
            found = _find_override_rows(child)
            if found is not None:
                return found
    return None


def _load_payload():
    encoded_parts = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        encoded_parts.append(subprocess.check_output(["git", "show", f"origin/main:{path}"], text=True).strip())
    return json.loads(gzip.decompress(base64.b64decode("".join(encoded_parts))).decode("utf-8"))


def load_overrides_compatible():
    rows = _find_override_rows(_load_payload())
    if rows is None or len(rows) != 650:
        raise RuntimeError("Carga do Modelo v2 sem os 650 registros esperados")
    return rows


def _merge_series(existing, incoming, fill_value):
    base = list(existing) if isinstance(existing, list) else []
    base = (base + [fill_value] * 12)[:12]
    for index, value in enumerate(incoming or []):
        if index >= 12:
            break
        if value is not None:
            base[index] = value
    return base


def merge_model_preserving_history(structural):
    contracts = fix.extract_js_value(structural, "contractData")
    overrides = load_overrides_compatible()
    lookup = {}
    occurrences = {}
    for contract, rows in contracts.items():
        for row_index, row in enumerate(rows):
            row.setdefault("sourceId", f"{contract}|{row_index + 1:04d}")
            lookup.setdefault((contract, fix.normalize(row.get("name"))), []).append(row)

    for incoming in overrides:
        key = (incoming["contract"], fix.normalize(incoming.get("name")))
        occurrence = occurrences.get(key, 0)
        candidates = lookup.get(key, [])
        if occurrence >= len(candidates):
            raise RuntimeError(f"Item sem vínculo: {incoming['contract']} | {incoming.get('name')}")
        target = candidates[occurrence]
        occurrences[key] = occurrence + 1
        target["price"] = float(incoming.get("price") or 0)
        target["balance"] = float(incoming.get("balance") or 0)
        target["base"] = float(incoming.get("base") or 0)
        target["contractual"] = target["base"] + target["balance"]
        target["plan"] = _merge_series(target.get("plan"), incoming.get("plan"), 0)
        target["planValue"] = _merge_series(target.get("planValue"), incoming.get("planValue"), 0)
        target["exec"] = _merge_series(target.get("exec"), incoming.get("exec"), 0)
        target["execValue"] = _merge_series(target.get("execValue"), incoming.get("execValue"), 0)
        target["orders"] = _merge_series(target.get("orders"), incoming.get("orders"), "")

    contract_count = len(contracts)
    item_count = sum(len(rows) for rows in contracts.values())
    if contract_count != 15 or item_count != 650 or len(overrides) != 650:
        raise RuntimeError(
            f"Validação estrutural divergente: {contract_count} contratos, {item_count} itens, {len(overrides)} vínculos"
        )

    structural = fix.replace_js_value(structural, "contractData", contracts)
    structural = fix.replace_js_value(structural, "rdoData", [])
    metadata = {
        "source": "Modelo Cronograma Base de Dados v2",
        "sheet": "Planilha1",
        "contracts": contract_count,
        "items": item_count,
        "years": [2026],
        "monthsLoaded": [0, 1, 2, 3, 4, 5, 6],
        "rdo": "aguardando vínculo definitivo",
    }
    structural = structural.replace(
        "var rdoData=[];",
        "var rdoData=[];var modelV2Metadata=" + json.dumps(metadata, ensure_ascii=False, separators=(",", ":")) + ";",
        1,
    )
    return structural, contract_count, item_count, len(overrides)


def validate_decoded_rows(rows):
    totals = []
    for month in range(6):
        actual = [
            sum(float(row["plan"][month] or 0) for row in rows if row["plan"][month] is not None),
            sum(float(row["planValue"][month] or 0) for row in rows if row["planValue"][month] is not None),
            sum(float(row["exec"][month] or 0) for row in rows if row["exec"][month] is not None),
            sum(float(row["execValue"][month] or 0) for row in rows if row["execValue"][month] is not None),
        ]
        totals.append({
            "month": month + 1,
            "plannedQuantity": actual[0],
            "plannedValue": actual[1],
            "executedQuantity": actual[2],
            "executedValue": actual[3],
        })
    return totals


fix.load_overrides = load_overrides_compatible
fix.merge_model = merge_model_preserving_history
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
