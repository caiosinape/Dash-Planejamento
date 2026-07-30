from __future__ import annotations

import base64
import copy
import gzip
import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "Planejamento-Colaborativo" / "index.html"
AUDIT_PATH = ROOT / "Planejamento-Colaborativo" / "fix73-audit.json"


def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.strip().casefold().split())


def contract_code(value):
    match = re.search(r"\b(\d{4})\b", str(value or ""))
    if not match:
        raise RuntimeError(f"Código de contrato não encontrado: {value!r}")
    return match.group(1)


def js_value_bounds(text, name):
    marker = "var " + name + "="
    start = text.find(marker)
    if start < 0:
        raise RuntimeError(f"Variável {name} não encontrada no HTML interno")
    start += len(marker)
    opening = text[start]
    if opening not in "[{":
        raise RuntimeError(f"Variável {name} não contém JSON")
    closing = "}" if opening == "{" else "]"
    depth = 0
    quoted = False
    escaped = False
    for pos in range(start, len(text)):
        char = text[pos]
        if quoted:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return start, pos + 1
    raise RuntimeError(f"Variável {name} incompleta")


def extract_js_value(text, name):
    start, end = js_value_bounds(text, name)
    return json.loads(text[start:end])


def replace_js_value(text, name, value):
    start, end = js_value_bounds(text, name)
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return text[:start] + payload + text[end:]


def extract_embedded_html(wrapper):
    suffix = ';function t(t){var n="var "+t+"="'
    suffix_pos = wrapper.find(suffix)
    if suffix_pos < 0:
        raise RuntimeError("Fim da string HTML autocontida não encontrado")
    search_start = max(0, suffix_pos - 5000000)
    marker_pos = wrapper.rfind("var e=", search_start, suffix_pos)
    if marker_pos < 0:
        raise RuntimeError("Início da string HTML autocontida não encontrado")
    value_start = marker_pos + len("var e=")
    value, consumed = json.JSONDecoder().raw_decode(wrapper[value_start:suffix_pos])
    value_end = value_start + consumed
    if value_end != suffix_pos:
        remainder = wrapper[value_end:suffix_pos].strip()
        if remainder:
            raise RuntimeError(f"Conteúdo inesperado após a string interna: {remainder[:100]!r}")
    if not isinstance(value, str) or "<html" not in value.lower():
        raise RuntimeError("Conteúdo HTML interno inválido")
    return value, value_start, value_end


def load_compact_payload():
    parts = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        parts.append(
            subprocess.check_output(
                ["git", "show", f"origin/main:{path}"], text=True
            ).strip()
        )
    return json.loads(
        gzip.decompress(base64.b64decode("".join(parts))).decode("utf-8")
    )


def compact_series(value, fill):
    """A carga compacta guarda o recorte de julho como escalar."""
    if isinstance(value, list):
        return (list(value) + [fill] * 12)[:12]
    if isinstance(value, dict):
        result = [None] * 12
        aliases = {
            "jan": 0, "fev": 1, "mar": 2, "abr": 3, "mai": 4, "jun": 5,
            "jul": 6, "ago": 7, "set": 8, "out": 9, "nov": 10, "dez": 11,
        }
        for key, item in value.items():
            text = str(key).strip().casefold()
            if text in aliases:
                index = aliases[text]
            else:
                number = int(text)
                index = number if 0 <= number <= 11 else number - 1
            if not 0 <= index <= 11:
                raise RuntimeError(f"Índice mensal inválido: {key}")
            result[index] = item
        return result
    result = [None] * 12
    result[6] = fill if value is None else value
    return result


def merge_series(existing, incoming, fill):
    result = list(existing) if isinstance(existing, list) else []
    result = (result + [fill] * 12)[:12]
    for index, value in enumerate(incoming):
        if value is not None:
            result[index] = value
    return result


def rebuild_contracts(old_contracts, payload):
    compact_contracts = payload.get("c") if isinstance(payload, dict) else None
    metadata = payload.get("m") if isinstance(payload, dict) else None
    if not isinstance(compact_contracts, dict) or not isinstance(metadata, dict):
        raise RuntimeError("Carga compactada c/m inválida")

    old_label_by_code = {contract_code(label): label for label in old_contracts}
    old_lookup = {}
    for label, rows in old_contracts.items():
        code = contract_code(label)
        for row in rows:
            old_lookup.setdefault((code, normalize(row.get("name"))), []).append(row)

    occurrence_cursor = {}
    rebuilt = {}
    total = 0
    for official_label, compact_rows in compact_contracts.items():
        code = contract_code(official_label)
        label = old_label_by_code.get(code, official_label)
        output_rows = []
        for row_index, compact in enumerate(compact_rows):
            if not isinstance(compact, list) or len(compact) != 10:
                raise RuntimeError(
                    f"Linha compactada inválida em {official_label}, posição {row_index + 1}"
                )
            name, occurrence, price, balance, base, plan, plan_value, executed, executed_value, orders = compact
            key = (code, normalize(name))
            position = occurrence_cursor.get(key, 0)
            candidates = old_lookup.get(key, [])
            source = copy.deepcopy(candidates[position]) if position < len(candidates) else {}
            occurrence_cursor[key] = position + 1

            source["name"] = str(name or "Item sem descrição")
            source["unit"] = str(source.get("unit") or "UN")
            source["contractKey"] = label
            source["sourceId"] = f"{code}|{row_index + 1:04d}"
            source["price"] = float(price or 0)
            source["balance"] = float(balance or 0)
            source["base"] = float(base or 0)
            source["contractual"] = source["base"] + source["balance"]
            source["plan"] = merge_series(source.get("plan"), compact_series(plan, 0), 0)
            source["planValue"] = merge_series(source.get("planValue"), compact_series(plan_value, 0), 0)
            source["exec"] = merge_series(source.get("exec"), compact_series(executed, 0), 0)
            source["execValue"] = merge_series(source.get("execValue"), compact_series(executed_value, 0), 0)
            source["orders"] = merge_series(source.get("orders"), compact_series(orders, ""), "")
            output_rows.append(source)
            total += 1
        rebuilt[label] = output_rows

    if len(rebuilt) != 15 or total != 650:
        raise RuntimeError(f"Base reconstruída divergente: {len(rebuilt)} contratos, {total} itens")
    if int(metadata.get("contracts", 0)) != 15 or int(metadata.get("items", 0)) != 650:
        raise RuntimeError("Metadados da carga divergentes")
    return rebuilt


def apply_safe_fixes(wrapper, embedded):
    # Filtro de ano estático, mantendo o mesmo componente visual.
    month_field = '<label class="field"><span>Mês</span><select id="monthFilter"></select></label>'
    year_field = '<label class="field"><span>Ano</span><select id="yearFilter"><option value="2026">2026</option></select></label>'
    if 'id="yearFilter"' not in embedded and month_field in embedded:
        embedded = embedded.replace(month_field, year_field + month_field, 1)

    # Corrige referência indefinida conhecida.
    wrapper = wrapper.replace("esc(contractCode())", "D(F())")
    embedded = embedded.replace("esc(contractCode())", "D(F())")

    # Corrige uma variação de concatenação inválida na célula da OS.
    wrapper = wrapper.replace(
        '+D(OCode(e,t))+"</span>"</td><td><strong>',
        '+D(OCode(e,t))+"</span></td><td><strong>',
    )
    wrapper = wrapper.replace(
        '+D(OCode(e,t))+"</span>"</td><td>',
        '+D(OCode(e,t))+"</span></td><td>',
    )
    embedded = embedded.replace(
        '+D(OCode(e,t))+"</span>"</td><td><strong>',
        '+D(OCode(e,t))+"</span></td><td><strong>',
    )

    # Garante chaves de edição versionadas e não contaminadas pela versão antiga.
    for old, new in (
        ("sinape:planning:monthly:v2", "sinape:planning:monthly:rebuild-v1"),
        ("sinape:planning:weekly:v2", "sinape:planning:weekly:rebuild-v1"),
        ("sinape:planning:actions:v2", "sinape:planning:actions:rebuild-v1"),
    ):
        wrapper = wrapper.replace(old, new)
        embedded = embedded.replace(old, new)
    return wrapper, embedded


def main():
    wrapper = HTML_PATH.read_text(encoding="utf-8")
    embedded, value_start, value_end = extract_embedded_html(wrapper)
    old_contracts = extract_js_value(embedded, "contractData")
    payload = load_compact_payload()
    contracts = rebuild_contracts(old_contracts, payload)

    embedded = replace_js_value(embedded, "contractData", contracts)
    embedded = replace_js_value(embedded, "rdoData", [])
    metadata = {
        "source": "Modelo Cronograma Base de Dados v2",
        "sheet": "Planilha1",
        "contracts": 15,
        "items": 650,
        "years": [2026],
        "monthsLoaded": [0, 1, 2, 3, 4, 5, 6],
        "rdo": "aguardando vínculo definitivo",
    }
    marker = "var rdoData=[];"
    metadata_script = marker + "var modelV2Metadata=" + json.dumps(
        metadata, ensure_ascii=False, separators=(",", ":")
    ) + ";"
    if "var modelV2Metadata=" not in embedded:
        embedded = embedded.replace(marker, metadata_script, 1)

    wrapper, embedded = apply_safe_fixes(wrapper, embedded)
    # Recalcula os limites porque correções no wrapper podem alterar posições antes da string.
    _, value_start, value_end = extract_embedded_html(wrapper)
    encoded = json.dumps(embedded, ensure_ascii=False)
    wrapper = wrapper[:value_start] + encoded + wrapper[value_end:]

    # Valida novamente a string que será efetivamente salva.
    check_embedded, _, _ = extract_embedded_html(wrapper)
    check_contracts = extract_js_value(check_embedded, "contractData")
    checks = {
        "contracts": len(check_contracts) == 15,
        "items": sum(len(rows) for rows in check_contracts.values()) == 650,
        "yearFilter": 'id="yearFilter"' in check_embedded,
        "undefinedReferenceRemoved": "esc(contractCode())" not in wrapper,
        "rdoPending": extract_js_value(check_embedded, "rdoData") == [],
        "visualReference": "Planejado, executado e alertas operacionais" in check_embedded,
        "selfContained": "var contractData=" in check_embedded,
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        raise RuntimeError("Validações não atendidas: " + ", ".join(failed))

    HTML_PATH.write_text(wrapper, encoding="utf-8")
    audit = {
        "status": "built",
        "visualReference": "73c078d3780f21911bbf5a5dbb3f280bbf7f4f22",
        "contracts": 15,
        "items": 650,
        "rdo": "último vínculo pendente",
        "checks": checks,
        "sha256": hashlib.sha256(wrapper.encode("utf-8")).hexdigest(),
    }
    AUDIT_PATH.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
