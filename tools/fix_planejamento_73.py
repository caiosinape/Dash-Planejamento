from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD_PATH = ROOT / "Planejamento-Colaborativo" / "index.html"
STRUCTURAL_PATH = ROOT / "Cronogramas Planejamento" / "index.html"
AUDIT_PATH = ROOT / "Planejamento-Colaborativo" / "fix73-audit.json"


def js_value_bounds(text: str, name: str) -> tuple[int, int]:
    marker = f"var {name}="
    start = text.find(marker)
    if start < 0:
        raise RuntimeError(f"Base {name} não encontrada")
    start += len(marker)
    opening = text[start]
    closing = "}" if opening == "{" else "]"
    depth = 0
    quoted = False
    escaped = False
    for position in range(start, len(text)):
        char = text[position]
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
                return start, position + 1
    raise RuntimeError(f"Base {name} incompleta")


def extract_js_value(text: str, name: str):
    start, end = js_value_bounds(text, name)
    return json.loads(text[start:end])


def replace_js_value(text: str, name: str, value) -> str:
    start, end = js_value_bounds(text, name)
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return text[:start] + payload + text[end:]


def normalize(value: object) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    normalized = "".join(
        character for character in normalized if not unicodedata.combining(character)
    )
    return " ".join(normalized.strip().lower().split())


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: esperado 1 vínculo, encontrado {count}")
    return text.replace(old, new, 1)


def load_overrides() -> list[dict]:
    encoded_parts: list[str] = []
    for index in range(8):
        path = f"Planejamento-Colaborativo/data/direct-overrides.part{index}"
        encoded_parts.append(
            subprocess.check_output(
                ["git", "show", f"origin/main:{path}"], text=True
            ).strip()
        )
    return json.loads(gzip.decompress(base64.b64decode("".join(encoded_parts))))


def merge_model(structural: str) -> tuple[str, int, int, int]:
    contracts: dict[str, list[dict]] = extract_js_value(structural, "contractData")
    overrides = load_overrides()

    lookup: dict[tuple[str, str], list[dict]] = {}
    occurrences: dict[tuple[str, str], int] = {}
    for contract, rows in contracts.items():
        for row_index, row in enumerate(rows):
            row.setdefault("sourceId", f"{contract}|{row_index + 1:04d}")
            lookup.setdefault((contract, normalize(row.get("name"))), []).append(row)

    for incoming in overrides:
        key = (incoming["contract"], normalize(incoming.get("name")))
        occurrence = occurrences.get(key, 0)
        candidates = lookup.get(key, [])
        if occurrence >= len(candidates):
            raise RuntimeError(
                f"Item sem vínculo: {incoming['contract']} | {incoming.get('name')}"
            )
        target = candidates[occurrence]
        occurrences[key] = occurrence + 1
        target["price"] = float(incoming.get("price") or 0)
        target["balance"] = float(incoming.get("balance") or 0)
        target["base"] = float(incoming.get("base") or 0)
        target["contractual"] = target["base"] + target["balance"]
        target["plan"] = incoming.get("plan") or [0] * 12
        target["planValue"] = incoming.get("planValue") or [0] * 12
        target["exec"] = incoming.get("exec") or [0] * 12
        target["execValue"] = incoming.get("execValue") or [0] * 12
        target["orders"] = incoming.get("orders") or [""] * 12

    contract_count = len(contracts)
    item_count = sum(len(rows) for rows in contracts.values())
    if contract_count != 15 or item_count != 650 or len(overrides) != 650:
        raise RuntimeError(
            "Validação estrutural divergente: "
            f"{contract_count} contratos, {item_count} itens, {len(overrides)} vínculos"
        )

    structural = replace_js_value(structural, "contractData", contracts)
    structural = replace_js_value(structural, "rdoData", [])
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
        "var rdoData=[];var modelV2Metadata="
        + json.dumps(metadata, ensure_ascii=False, separators=(",", ":"))
        + ";",
        1,
    )
    return structural, contract_count, item_count, len(overrides)


def remove_root_dashboard_fetch(dashboard: str) -> str:
    start = dashboard.rfind(',fetch("../index.html",{cache:"no-store"})')
    if start < 0:
        return dashboard
    end = dashboard.find("}()</script>", start)
    if end < 0:
        raise RuntimeError("Fim do vínculo com o HTML principal não localizado")
    return dashboard[:start] + ",ue()" + dashboard[end:]


def apply_corrections(dashboard: str, embedded_source: str) -> str:
    original_fetch = (
        'var e=await fetch("../Cronogramas%20Planejamento/index.html",'
        '{cache:"no-store"}).then(function(e){if(!e.ok)throw new Error('
        '"Falha ao carregar a base do painel: "+e.status);return e.text()});'
    )
    dashboard = replace_once(
        dashboard,
        original_fetch,
        "var e=" + json.dumps(embedded_source, ensure_ascii=False, separators=(",", ":")) + ";",
        "Incorporação da base estrutural",
    )

    dashboard = dashboard.replace("esc(contractCode())", "D(F())")

    old_plan_value = (
        "function Z(e){return oe(!0).reduce(function(t,n){return "
        "t+Number(n.plan[e]||0)*n.price},0)}"
    )
    new_plan_value = (
        "function PV(e,t){return e.planValue&&null!=e.planValue[t]?"
        "Number(e.planValue[t]||0):Number(e.plan[t]||0)*Number(e.price||0)}"
        "function Z(e){return oe(!0).reduce(function(t,n){return t+PV(n,e)},0)}"
    )
    dashboard = replace_once(
        dashboard, old_plan_value, new_plan_value, "Cálculo do valor planejado"
    )
    dashboard = dashboard.replace("A.format(n*e.price)", "A.format(PV(e,t))")
    dashboard = dashboard.replace(
        "Math.max(0,Number(n.plan[t]||0))*n.price", "Math.max(0,PV(n,t))"
    )
    dashboard = dashboard.replace(
        "Math.max(0,Number(n.plan[t]||0))*Number(n.price||0)",
        "Math.max(0,PV(n,t))",
    )

    old_month_save = (
        "e.plan[t]=n,e.orders[t]=a,o&&(o.plan[t]=n,o.orders[t]=a),"
        "x[r]||(x[r]={})"
    )
    new_month_save = (
        "e.plan[t]=n,e.orders[t]=a,e.planValue||(e.planValue=Array(12).fill(0)),"
        "e.planValue[t]=n*Number(e.price||0),o&&(o.plan[t]=n,o.orders[t]=a,"
        "o.planValue||(o.planValue=Array(12).fill(0)),"
        "o.planValue[t]=n*Number(o.price||0)),x[r]||(x[r]={})"
    )
    dashboard = replace_once(
        dashboard, old_month_save, new_month_save, "Persistência mensal"
    )

    old_balance = re.compile(
        r"function le\(e,t\)\{for\(var n=e\.contractual-Math\.max\(0,Number\(e\.base\|\|0\)\)-function\(e,t\)\{for\(var n=0,a=6;a<=t;a\+\+\)n\+=W\(e,a\);return n\}\(e,t-1\),a=0,r=t;r<Math\.min\(t\+3,12\);r\+\+\)a\+=J\(r,e\)\?W\(e,r\):Number\(e\.plan\[r\]\|\|0\);return n-a\}"
    )
    dashboard, balance_count = old_balance.subn(
        "function le(e,t){for(var n=Number(e.balance||0),a=6;"
        "a<Math.min(t+3,12);a++)n-=J(a,e)?W(e,a):Number(e.plan[a]||0);return n}",
        dashboard,
        count=1,
    )
    if balance_count != 1:
        raise RuntimeError(f"Cálculo do saldo: esperado 1 vínculo, encontrado {balance_count}")

    marker = (
        'function R(e){return String(e.contractKey||L)+"|"+'
        'String(e.sourceId||e.name)}'
    )
    os_helpers = (
        'function OC(e,t){var n=String((e.orders||[])[t]||"").trim();'
        'return n||"Sem Ordem de Serviço"}'
        'function OM(t){var n={},a={},r=[];q.forEach(function(e){var o=H(e),i=OC(e,t),d=o+"|"+i;'
        'n[d]||(a[o]=(a[o]||0)+1,n[d]="OS-"+String(a[o]).padStart(2,"0"),'
        'r.push({contract:o,order:i,code:n[d]}))});return{codes:n,options:r}}'
        'function OCode(e,t){var n=OM(t);return n.codes[H(e)+"|"+OC(e,t)]||"OS-01"}'
        'function OF(){var e=V(),t=OM(e),n=document.getElementById("osFilter"),a=t.options;'
        'n&&(a.some(function(e){return e.order===s})||(s="Todas"),'
        'n.innerHTML=\'<option value="Todas">Todas</option>\'+a.map(function(e){'
        'return\'<option value="\'+D(e.order)+\'">\'+D((L===C?e.contract+" · ":"")+e.code)+"</option>"}).join(""),n.value=s)}'
    )
    dashboard = replace_once(
        dashboard, marker, marker + os_helpers, "Funções das Ordens de Serviço"
    )
    dashboard = replace_once(
        dashboard,
        '"Todas"!==s&&n.orders.indexOf(p)<0',
        '"Todas"!==s&&OC(n,t)!==s',
        "Filtro das Ordens de Serviço",
    )
    dashboard = replace_once(
        dashboard,
        "function xe(){var e,t,n,a,i,s,u;",
        "function xe(){var e,t,n,a,i,s,u;OF(),",
        "Atualização do filtro de OS",
    )

    planning_os = (
        '<td class="item-col"><strong>'+"'"+'+D(t.name)+"</strong><small>OS-01"+'
        '+(L===C?" · Contrato "+D(H(t)):"")+" · "+D(t.unit)+"</small></td>"'
    )
    planning_os_new = (
        '<td class="item-col"><strong>'+"'"+'+D(t.name)+"</strong><small>"+D(OCode(t,e))'
        '+(L===C?" · Contrato "+D(H(t)):"")+" · "+D(t.unit)+"</small></td>"'
    )
    dashboard = replace_once(
        dashboard, planning_os, planning_os_new, "OS na janela de três meses"
    )

    ops_os = (
        '<div class="ops-item"><div><strong>'+"'"+'+D(e.name)+"</strong><small>OS-01"+'
        '+(L===C?" · Contrato "+D(H(e)):"")+" · "+t+"</small></div>'
    )
    ops_os_new = (
        '<div class="ops-item"><div><strong>'+"'"+'+D(e.name)+"</strong><small>"+D(OCode(e,a))'
        '+(L===C?" · Contrato "+D(H(e)):"")+" · "+t+"</small></div>'
    )
    dashboard = replace_once(
        dashboard, ops_os, ops_os_new, "OS na leitura operacional"
    )

    dashboard = replace_once(
        dashboard,
        '<span class="os-code">OS-01</span>',
        '<span class="os-code">'+"'"+'+D(OCode(e,t))+"</span>"',
        "Código da OS na tabela operacional",
    )
    dashboard = replace_once(
        dashboard,
        "o=e.orders[t]||p",
        "o=OC(e,t)",
        "Texto da Ordem de Serviço",
    )

    dashboard = replace_once(
        dashboard,
        "r=t.reduce(function(t,n){return t+ne(n.start,n.end,e)},0)",
        "r=t.length",
        "Quantidade de semanas",
    )
    dashboard = replace_once(
        dashboard,
        "var o=ne(t.start,t.end,e)/Math.max(r,1);",
        "var o=1/Math.max(r,1);",
        "Divisão semanal",
    )
    dashboard = dashboard.replace(
        "rateio por dias úteis", "divisão pelo número de semanas"
    )

    dashboard = dashboard.replace(
        "sinape:planning:monthly:v2", "sinape:planning:monthly:fix73-v1"
    )
    dashboard = dashboard.replace(
        "sinape:planning:weekly:v2", "sinape:planning:weekly:fix73-v1"
    )
    dashboard = dashboard.replace(
        "sinape:planning:actions:v2", "sinape:planning:actions:fix73-v1"
    )

    month_field = '<label class="field"><span>Mês</span><select id="monthFilter"></select></label>'
    year_field = (
        '<label class="field"><span>Ano</span><select id="yearFilter">'
        '<option value="2026">2026</option></select></label>'
    )
    dashboard = replace_once(
        dashboard, month_field, year_field + month_field, "Filtro de ano"
    )
    dashboard = dashboard.replace(
        ".filters{grid-template-columns:0.7fr 1.25fr 0.85fr 1.05fr 0.85fr auto}",
        ".filters{grid-template-columns:0.7fr 1.25fr 0.62fr 0.85fr 1.05fr 0.85fr auto}",
        1,
    )

    dashboard = dashboard.replace(
        "Fonte: Modelo Cronograma + Base BI Executado (2)",
        "Fonte: Modelo Cronograma Base de Dados v2",
    )
    dashboard = dashboard.replace(
        "Planejamento: base atual · Executado/RDO: <b>Base BI Executado (2) atualizada</b>",
        "Planejado e executado: <b>Modelo Cronograma Base de Dados v2</b>",
    )
    dashboard = dashboard.replace(
        "Fonte: Base BI Executado (2)",
        "Fonte: Modelo Cronograma Base de Dados v2",
    )
    dashboard = dashboard.replace(
        "Quantitativos e valores executados provenientes da Base BI Executado (2)",
        "RDO aguardando o vínculo definitivo da aba BI Base Executado",
    )
    dashboard = dashboard.replace(
        "Planejamento: Modelo Cronograma Base de Dados · Planilha1",
        "Planejado e executado: Modelo Cronograma Base de Dados v2 · Planilha1",
    )
    dashboard = dashboard.replace(
        "Executado e RDO: Estudo Geral · Base BI Executado (2)",
        "RDO: vínculo definitivo pendente",
    )
    dashboard = dashboard.replace(
        "outros registros da Base BI Executado (2).",
        "outros registros após a ativação do vínculo definitivo.",
    )

    dashboard = remove_root_dashboard_fetch(dashboard)

    error_box = (
        '<div id="healthError" hidden style="position:fixed;left:16px;right:16px;top:16px;'
        'z-index:2000;padding:12px 16px;border-radius:9px;background:#fff0f0;color:#9b2727;'
        'border:1px solid #e0a9a9;font:700 11px Segoe UI,Arial,sans-serif"></div>'
    )
    dashboard = replace_once(
        dashboard,
        '<body class="access-pending">',
        '<body class="access-pending">' + error_box,
        "Barreira visual de erro",
    )
    health_script = (
        '<script>window.SINAPE_LINKS={rdo:null,teams:null,lastLinkPending:true};'
        'window.addEventListener("error",function(e){var n=document.getElementById("healthError");'
        'n&&(n.hidden=false,n.textContent="Falha controlada no painel: "+String(e.message||"erro desconhecido"))});'
        'window.addEventListener("unhandledrejection",function(e){var n=document.getElementById("healthError");'
        'n&&(n.hidden=false,n.textContent="Falha controlada no carregamento: "+'
        'String(e.reason&&e.reason.message||e.reason||"erro desconhecido"))});</script>'
    )
    dashboard = replace_once(
        dashboard,
        "<script>!async function(){",
        health_script + "<script>!async function(){",
        "Barreira JavaScript de erro",
    )
    return dashboard


def validate(dashboard: str, contract_count: int, item_count: int) -> dict:
    checks = {
        "visual_base_preserved": "Planejado, executado e alertas operacionais" in dashboard,
        "structural_fetch_removed": "../Cronogramas%20Planejamento/index.html" not in dashboard,
        "root_fetch_removed": 'fetch("../index.html"' not in dashboard,
        "undefined_reference_removed": "esc(contractCode())" not in dashboard,
        "plan_value_enabled": "function PV(" in dashboard,
        "dynamic_os_enabled": "function OCode(" in dashboard,
        "year_filter_enabled": 'id="yearFilter"' in dashboard,
        "weekly_equal_split": "divisão pelo número de semanas" in dashboard,
        "error_boundary_enabled": 'id="healthError"' in dashboard,
        "old_local_storage_removed": "sinape:planning:monthly:v2" not in dashboard,
        "contracts": contract_count,
        "items": item_count,
        "rdo": "vínculo definitivo pendente",
    }
    failed = [key for key, value in checks.items() if isinstance(value, bool) and not value]
    if failed:
        raise RuntimeError("Validações não atendidas: " + ", ".join(failed))
    return checks


def main() -> None:
    dashboard = DASHBOARD_PATH.read_text(encoding="utf-8")
    structural = STRUCTURAL_PATH.read_text(encoding="utf-8")
    embedded_source, contract_count, item_count, override_count = merge_model(structural)
    dashboard = apply_corrections(dashboard, embedded_source)
    checks = validate(dashboard, contract_count, item_count)
    DASHBOARD_PATH.write_text(dashboard, encoding="utf-8")
    audit = {
        "status": "corrigido e validado estruturalmente",
        "visualBase": "73c078d3780f21911bbf5a5dbb3f280bbf7f4f22",
        "source": "Modelo Cronograma Base de Dados v2 incorporado",
        "contracts": contract_count,
        "items": item_count,
        "overrides": override_count,
        "rdo": "aguardando último vínculo",
        "checks": checks,
        "sha256": hashlib.sha256(dashboard.encode("utf-8")).hexdigest(),
    }
    AUDIT_PATH.write_text(
        json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
