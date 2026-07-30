from __future__ import annotations

import base64
import gzip
import json
import os
import subprocess
from pathlib import Path

import fix_planejamento_73 as fix

MONTH_ALIASES = {
    "jan": 0, "janeiro": 0, "fev": 1, "fevereiro": 1, "mar": 2,
    "marco": 2, "março": 2, "abr": 3, "abril": 3, "mai": 4,
    "maio": 4, "jun": 5, "junho": 5, "jul": 6, "julho": 6,
    "ago": 7, "agosto": 7, "set": 8, "setembro": 8, "out": 9,
    "outubro": 9, "nov": 10, "novembro": 10, "dez": 11, "dezembro": 11,
}


def month_index(key):
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


def compact_months(values, field, contract, name):
    """None preserva o histórico; escalares representam julho."""
    if isinstance(values, str):
        text = values.strip()
        if text.startswith("[") or text.startswith("{"):
            values = json.loads(text)
        elif "|" in text or ";" in text or "," in text:
            sep = "|" if "|" in text else ";" if ";" in text else ","
            values = [part.strip() for part in text.split(sep)]
        else:
            result = [None] * 12
            result[6] = values
            return result
    if isinstance(values, dict):
        result = [None] * 12
        for key, value in values.items():
            index = month_index(key)
            if index is None:
                raise RuntimeError(f"Chave mensal inválida em {contract} | {name} | {field}: {key!r}")
            result[index] = value
        return result
    if isinstance(values, (list, tuple)):
        if len(values) > 12:
            raise RuntimeError(f"Série mensal maior que 12 em {contract} | {name} | {field}")
        return list(values) + [None] * (12 - len(values))
    if values is None or isinstance(values, (int, float, bool)):
        result = [None] * 12
        result[6] = values
        return result
    raise RuntimeError(
        f"Formato mensal inválido em {contract} | {name} | {field}: {type(values).__name__}"
    )


def load_payload():
    parts = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        parts.append(subprocess.check_output(["git", "show", f"origin/main:{path}"], text=True).strip())
    return json.loads(gzip.decompress(base64.b64decode("".join(parts))).decode("utf-8"))


def load_overrides_compatible():
    payload = load_payload()
    contracts = payload.get("c") if isinstance(payload, dict) else None
    metadata = payload.get("m") if isinstance(payload, dict) else None
    if not isinstance(contracts, dict) or not isinstance(metadata, dict):
        raise RuntimeError("Formato c/m da carga não encontrado")
    rows = []
    for contract, compact_rows in contracts.items():
        if not isinstance(compact_rows, list):
            raise RuntimeError(f"Contrato sem lista de itens: {contract}")
        for row_index, compact in enumerate(compact_rows):
            if not isinstance(compact, list) or len(compact) != 10:
                raise RuntimeError(f"Linha inválida em {contract}, posição {row_index + 1}")
            name, occurrence, price, balance, base, plan, plan_value, executed, executed_value, orders = compact
            rows.append({
                "contract": contract,
                "rowIndex": row_index,
                "name": name,
                "occurrence": int(occurrence),
                "price": float(price or 0),
                "balance": float(balance or 0),
                "base": float(base or 0),
                "plan": compact_months(plan, "plan", contract, name),
                "planValue": compact_months(plan_value, "planValue", contract, name),
                "exec": compact_months(executed, "exec", contract, name),
                "execValue": compact_months(executed_value, "execValue", contract, name),
                "orders": compact_months(orders, "orders", contract, name),
            })
    if len(contracts) != 15 or len(rows) != 650:
        raise RuntimeError(f"Carga divergente: {len(contracts)} contratos e {len(rows)} itens")
    return rows


def merge_series(existing, incoming, fill_value):
    base = list(existing) if isinstance(existing, list) else []
    base = (base + [fill_value] * 12)[:12]
    for index, value in enumerate(incoming):
        if value is not None:
            base[index] = value
    return base


def merge_model_by_order(structural):
    contracts = fix.extract_js_value(structural, "contractData")
    overrides = load_overrides_compatible()
    grouped = {}
    for row in overrides:
        grouped.setdefault(row["contract"], []).append(row)

    if set(grouped) != set(contracts):
        raise RuntimeError("Contratos da carga e do HTML-base são diferentes")

    for contract, incoming_rows in grouped.items():
        target_rows = contracts[contract]
        if len(target_rows) != len(incoming_rows):
            raise RuntimeError(
                f"Quantidade de itens divergente em {contract}: HTML={len(target_rows)}, carga={len(incoming_rows)}"
            )
        for incoming in incoming_rows:
            index = incoming["rowIndex"]
            target = target_rows[index]
            target.setdefault("sourceId", f"{contract}|{index + 1:04d}")
            target["price"] = incoming["price"]
            target["balance"] = incoming["balance"]
            target["base"] = incoming["base"]
            target["contractual"] = incoming["base"] + incoming["balance"]
            target["plan"] = merge_series(target.get("plan"), incoming["plan"], 0)
            target["planValue"] = merge_series(target.get("planValue"), incoming["planValue"], 0)
            target["exec"] = merge_series(target.get("exec"), incoming["exec"], 0)
            target["execValue"] = merge_series(target.get("execValue"), incoming["execValue"], 0)
            target["orders"] = merge_series(target.get("orders"), incoming["orders"], "")

    contract_count = len(contracts)
    item_count = sum(len(rows) for rows in contracts.values())
    if contract_count != 15 or item_count != 650:
        raise RuntimeError(f"Validação estrutural divergente: {contract_count} contratos, {item_count} itens")

    structural = fix.replace_js_value(structural, "contractData", contracts)
    structural = fix.replace_js_value(structural, "rdoData", [])
    metadata = {
        "source": "Modelo Cronograma Base de Dados v2",
        "sheet": "Planilha1",
        "contracts": 15,
        "items": 650,
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


fix.load_overrides = load_overrides_compatible
fix.merge_model = merge_model_by_order
rows = load_overrides_compatible()

if os.environ.get("DECODE_ONLY") == "1":
    audit = {
        "status": "decoded-and-validated",
        "contracts": len({row["contract"] for row in rows}),
        "items": len(rows),
        "monthsPerSeries": 12,
        "htmlModified": False,
    }
    Path("Planejamento-Colaborativo/direct-overrides-decoded-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(audit, ensure_ascii=False, indent=2))
else:
    fix.main()
