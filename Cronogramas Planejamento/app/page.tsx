"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const serviceOrderText = "Serviços executados pela TGA";
const zeroes = () => Array(12).fill(0);
const orders = (active: number[]) => months.map((_, index) => active.includes(index) ? serviceOrderText : "Sem serviços");

type Item = {
  name: string; unit: string; price: number; contractual: number; baseAccumulated: number; plan: number[]; planValue: number[]; orders: string[];
};
type ExecutionState = { quantity: number; isLocked: boolean; updatedBy?: string; updatedAt?: string };
type HistoryRow = { item: string; serviceOrder: string; period: string; week: number; action: string; previousQuantity: number | null; quantity: number; changedAt: string };

const items: Item[] = [
  { name: "Fornecimento de Pórtico com vão de 12,50 m", unit: "unid", price: 157850.506572, contractual: 0, baseAccumulated: 1, plan: [0,0,0,1,2,2,0,0,0,0,0,0], planValue: [0,0,0,157850.506572,315701.013144,315701.013144,0,0,0,0,0,0], orders: orders([3,4,5]) },
  { name: "Fornecimento de Pórtico com vão de 15,90 m", unit: "unid", price: 159165.923466, contractual: 4, baseAccumulated: 0, plan: [0,0,0,0,0,0,1,0,0,0,0,0], planValue: [0,0,0,0,0,0,159165.923466,0,0,0,0,0], orders: orders([6]) },
  { name: "Fornecimento de Semipórtico simples com vão de 7,20 m", unit: "unid", price: 77544.053565, contractual: -2, baseAccumulated: 0, plan: [0,0,0,0,0,0,1,0,0,0,0,0], planValue: [0,0,0,0,0,0,77544.053565,0,0,0,0,0], orders: orders([6]) },
  { name: "Fornecimento de Semipórtico duplo com vão de 7,20 m", unit: "unid", price: 78675.324294, contractual: 16, baseAccumulated: 0, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
  { name: "Preparação de base para pórtico", unit: "unid", price: 27195.638088, contractual: 2, baseAccumulated: 1, plan: [0,0,0,1,2,3,2,0,0,0,0,0], planValue: [0,0,0,27195.638088,54391.276176,81586.914264,54391.276176,0,0,0,0,0], orders: orders([3,4,5,6]) },
  { name: "Preparação de base para semipórtico", unit: "unid", price: 13597.819044, contractual: 8, baseAccumulated: 0, plan: [0,0,0,0,0,0,1,0,0,0,0,0], planValue: [0,0,0,0,0,0,13597.819044,0,0,0,0,0], orders: orders([6]) },
  { name: "Montagem de Pórtico", unit: "unid", price: 3817.876677, contractual: 3, baseAccumulated: 1, plan: [0,0,0,1,2,3,2,0,0,0,0,0], planValue: [0,0,0,3817.876677,7635.753354,11453.630031,7635.753354,0,0,0,0,0], orders: orders([3,4,5,6]) },
  { name: "Montagem de Semipórtico", unit: "unid", price: 1908.943785, contractual: 8, baseAccumulated: 0, plan: [0,0,0,0,0,0,1,0,0,0,0,0], planValue: [0,0,0,0,0,0,1908.943785,0,0,0,0,0], orders: orders([6]) },
  { name: "Remoção de Pórtico", unit: "unid", price: 3014.114886, contractual: -4, baseAccumulated: 2, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
  { name: "Remoção de Semipórtico", unit: "unid", price: 1636.23753, contractual: -8, baseAccumulated: 1, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
  { name: "Remoção de base", unit: "unid", price: 2506.925913, contractual: 16, baseAccumulated: 3, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
  { name: "Reaterro de Fundação", unit: "unid", price: 264.220608, contractual: 448.32, baseAccumulated: 0, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
  { name: "Carregamento e Descarregamento de Pórtico", unit: "unid", price: 1051.599327, contractual: -4, baseAccumulated: 3, plan: [0,0,0,1,2,3,2,0,0,0,0,0], planValue: [0,0,0,1051.599327,2103.198654,3154.797981,2103.198654,0,0,0,0,0], orders: orders([3,4,5,6]) },
  { name: "Carregamento e Descarregamento de Semipórtico", unit: "unid", price: 525.80511, contractual: -11, baseAccumulated: 1, plan: [0,0,0,0,0,0,1,0,0,0,0,0], planValue: [0,0,0,0,0,0,525.80511,0,0,0,0,0], orders: orders([6]) },
  { name: "Transporte de Pórtico", unit: "unid", price: 8.354931, contractual: -1167.1, baseAccumulated: 1810.5, plan: [0,0,0,750,1120,1500,700,0,0,0,0,0], planValue: [0,0,0,6266.19825,9357.52272,12532.3965,5848.4517,0,0,0,0,0], orders: orders([3,4,5,6]) },
  { name: "Transporte de Semipórtico", unit: "unid", price: 7.08045, contractual: -1335.3, baseAccumulated: 12.3, plan: zeroes(), planValue: zeroes(), orders: orders([]) },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const serviceOrderTexts = Array.from(new Set(items.flatMap(item => item.orders).filter(order => order !== "Sem serviços")));
const osCode = (text: string) => text === "Sem serviços" ? "Sem OS" : `OS-${String(serviceOrderTexts.indexOf(text) + 1).padStart(2, "0")}`;
const weekRanges = (year: number, month: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return [
    { week: 1, start: 1, end: Math.min(7, lastDay) },
    { week: 2, start: 8, end: Math.min(14, lastDay) },
    { week: 3, start: 15, end: Math.min(21, lastDay) },
    { week: 4, start: 22, end: Math.min(28, lastDay) },
    { week: 5, start: 29, end: lastDay },
  ].filter(range => range.start <= lastDay);
};

export default function Home() {
  const [month, setMonth] = useState(6);
  const [os, setOs] = useState("Todas");
  const [saved, setSaved] = useState<Record<string, ExecutionState>>({});
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const ganttViewport = useRef<HTMLDivElement>(null);
  const [ganttMonthWidth, setGanttMonthWidth] = useState(220);
  const periodKey = (m: number) => `2026-${String(m + 1).padStart(2, "0")}`;
  const orderFor = (item: Item, m: number) => item.orders[m] || "Sem serviços";
  const recordKey = (item: Item, m: number, week: number) => `${item.name}|${orderFor(item, m)}|${periodKey(m)}|${week}`;
  const weeklyActual = (item: Item, m: number, week: number) => saved[recordKey(item, m, week)]?.quantity ?? 0;
  const actual = (item: Item, m: number) => Object.entries(saved).reduce((sum, [key, state]) => {
    const prefix = `${item.name}|${orderFor(item, m)}|${periodKey(m)}|`;
    return key.startsWith(prefix) ? sum + state.quantity : sum;
  }, 0);
  const lockedActual = (item: Item, m: number) => Object.entries(saved).reduce((sum, [key, state]) => {
    const prefix = `${item.name}|${orderFor(item, m)}|${periodKey(m)}|`;
    return key.startsWith(prefix) && state.isLocked ? sum + state.quantity : sum;
  }, 0);
  const closed = (m: number) => new Date() >= new Date(2026, m + 1, 1);

  useEffect(() => {
    fetch("/api/executions").then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      const next: Record<string, ExecutionState> = {};
      for (const row of data.executions ?? []) next[`${row.item}|${row.serviceOrder}|${row.period}|${Number(row.week ?? 0)}`] = { quantity: Number(row.quantity), isLocked: Boolean(row.isLocked), updatedBy: row.updatedBy, updatedAt: row.updatedAt };
      setSaved(next);
      setHistory(data.history ?? []);
    }).catch(() => setMessage("Os lançamentos salvos não puderam ser carregados."));
  }, []);

  useEffect(() => {
    const viewport = ganttViewport.current;
    if (!viewport) return;
    const updateWidth = () => {
      const itemColumn = window.innerWidth <= 560 ? 190 : window.innerWidth <= 900 ? 240 : 300;
      setGanttMonthWidth(Math.max(110, (viewport.clientWidth - itemColumn) / 3));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = ganttViewport.current;
    if (!viewport) return;
    const firstVisibleMonth = Math.min(month, months.length - 3);
    viewport.scrollTo({ left: firstVisibleMonth * ganttMonthWidth, behavior: "smooth" });
  }, [month, ganttMonthWidth]);

  async function changeExecution(item: Item, week: number, action: "save" | "lock" | "unlock") {
    const key = recordKey(item, month, week);
    const quantity = Number(drafts[key] ?? weeklyActual(item, month, week));
    if (!Number.isFinite(quantity) || quantity < 0) return setMessage("Informe uma quantidade executada válida.");
    setSaving(key); setMessage("");
    try {
      const response = await fetch("/api/executions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract: "2456", item: item.name, serviceOrder: orderFor(item, month), period: periodKey(month), week, quantity, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      setSaved(current => ({ ...current, [key]: { quantity, isLocked: Boolean(data.isLocked), updatedBy: data.updatedBy, updatedAt: new Date().toISOString() } }));
      setDrafts(current => ({ ...current, [key]: String(quantity) }));
      setMessage(action === "lock" ? `${item.name}: Semana ${week} cravada e bloqueada.` : action === "unlock" ? `${item.name}: Semana ${week} liberada para edição.` : `${item.name}: ${number.format(quantity)} ${item.unit} salvos na Semana ${week} de ${months[month]}/2026.`);
      const refreshed = await fetch("/api/executions").then(r => r.json());
      setHistory(refreshed.history ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o lançamento."); }
    finally { setSaving(null); }
  }

  const filtered = useMemo(() => items.filter(item => os === "Todas" || item.orders.includes(os)), [os]);
  const planned = months.map((_, m) => filtered.reduce((sum, item) => sum + item.planValue[m], 0));
  const executed = months.map((_, m) => filtered.reduce((sum, item) => sum + actual(item, m) * item.price, 0));
  const currentRows = filtered.filter(item => item.plan[month] > 0 || actual(item, month) > 0);
  const maxBar = Math.max(...planned, ...executed, 1);
  const monthPlan = planned[month];
  const monthDone = executed[month];
  const weekly = useMemo(() => {
    const year = 2026;
    const days = new Date(year, month + 1, 0).getDate();
    const buckets: { week: number; label: string; start: number; end: number; workdays: number; planned: number; executed: number }[] = [];
    for (const range of weekRanges(year, month)) {
      const { start, end } = range;
      let workdays = 0;
      for (let day = start; day <= end; day++) {
        const weekday = new Date(year, month, day).getDay();
        if (weekday !== 0 && weekday !== 6) workdays++;
      }
      buckets.push({ week: range.week, label: `${String(start).padStart(2,"0")}–${String(end).padStart(2,"0")}/${String(month + 1).padStart(2,"0")}`, start, end, workdays, planned: 0, executed: 0 });
    }
    const totalWorkdays = buckets.reduce((sum, bucket) => sum + bucket.workdays, 0) || 1;
    for (const bucket of buckets) bucket.planned = monthPlan * bucket.workdays / totalWorkdays;
    for (const bucket of buckets) bucket.executed = filtered.reduce((sum, item) => sum + weeklyActual(item, month, bucket.week) * item.price, 0);
    return buckets;
  }, [saved, month, monthPlan, filtered]);
  const weeklyMax = Math.max(...weekly.flatMap(row => [row.planned, row.executed]), 1);
  const balanceRows = filtered
    .filter(item => item.contractual !== 0 || item.baseAccumulated !== 0 || item.plan.some(value => value > 0))
    .map(item => {
      const contractual = item.contractual;
      const confirmedHtmlExecution = months.reduce((sum, _, m) => m >= 6 && closed(m) ? sum + lockedActual(item, m) : sum, 0);
      const confirmedConsumed = item.baseAccumulated + confirmedHtmlExecution;
      const percentage = contractual > 0 ? confirmedConsumed / contractual * 100 : null;
      const afterMeasurement = contractual - confirmedConsumed;
      const afterPlanning = afterMeasurement - item.plan[month];
      return {
        item,
        contractual,
        confirmedConsumed,
        percentage,
        afterPlanning,
        afterMeasurement,
        overConsumed: percentage !== null && percentage > 100,
      };
    });
  const balanceStats = {
    monitored: balanceRows.length,
    overConsumed: balanceRows.filter(row => row.overConsumed).length,
    planningCritical: balanceRows.filter(row => row.afterPlanning < 0).length,
    measuredAvailable: balanceRows.filter(row => row.afterMeasurement >= 0).length,
  };

  return <main>
    <header className="topbar"><div><div className="eyebrow">SINAPE · PLANEJAMENTO E GESTÃO TÉCNICA</div><h1>Cronograma Executivo</h1><p>Contrato 2456 · Visão físico-financeira consolidada</p></div><div className="headerActions"><span className="source">BASE SHAREPOINT</span><button onClick={() => window.print()}>↓ Exportar</button></div></header>

    <section className="filters">
      <label>Contrato<select><option>2456</option></select></label>
      <label>Ordem de Serviço<select value={os} onChange={e => setOs(e.target.value)}><option>Todas</option>{serviceOrderTexts.map(text => <option value={text} key={text}>{osCode(text)}</option>)}</select></label>
      <label>Período<select value={month} onChange={e => setMonth(Number(e.target.value))}>{months.map((m, i) => <option value={i} key={m}>{m}/2026</option>)}</select></label>
      <div className="updated">Fonte: Modelo Cronograma Base de Dados<br/><strong>Atualizado em 23/07/2026</strong></div>
    </section>

    <section className="cards">
      <Card label={`Valor planejado em ${months[month]}`} value={money.format(monthPlan)} note="Planejamento do período selecionado" tone="blue"/>
      <Card label={`Valor executado lançado em ${months[month]}`} value={money.format(monthDone)} note="Quantidade lançada × Preço Reaj. da linha" tone="green"/>
      <Card label={`Saldo do planejamento em ${months[month]}`} value={money.format(monthPlan - monthDone)} note="Planejado menos execução lançada no mês" tone="slate"/>
    </section>

    <section className="grid">
      <article className="panel finance"><div className="panelHead"><div><span>DESEMPENHO FINANCEIRO</span><h2>Planejado × Executado por mês</h2></div><div className="legend"><i className="plan"/>Planejado <i className="exec"/>Executado lançado</div></div><div className="chart">{months.map((m, i) => <div className="barGroup" key={m} onClick={() => setMonth(i)}><div className="barArea"><div className="bar planned" style={{height: `${planned[i] / maxBar * 100}%`}}/><div className="bar executed" style={{height: `${executed[i] / maxBar * 100}%`}}/></div><b className={month === i ? "activeMonth" : ""}>{m}</b><small>{planned[i] ? `${Math.round(planned[i] / 1000)}k` : "—"}</small></div>)}</div></article>
      <article className="panel monthSummary"><div className="panelHead"><div><span>RECORTE MENSAL</span><h2>{months[month]} / 2026</h2></div><span className="pill">{currentRows.length} itens</span></div><div className="summaryRow"><span>Planejado</span><strong>{money.format(planned[month])}</strong></div><div className="summaryRow"><span>Executado lançado</span><strong>{money.format(executed[month])}</strong></div><div className="progress"><i style={{width: `${planned[month] ? Math.min(executed[month] / planned[month] * 100, 100) : 0}%`}}/></div><div className="summaryRow"><span>Aderência do mês</span><strong>{planned[month] ? Math.round(executed[month] / planned[month] * 100) : 0}%</strong></div><div className="alert"><b>Próxima ação</b><br/>{currentRows.length ? `${currentRows.filter(i => actual(i, month) < i.plan[month]).length} itens possuem saldo para execução no mês.` : "Não há programação cadastrada para este período."}</div></article>
    </section>

    <section className="panel gantt"><div className="panelHead"><div><span>LINHA DO TEMPO</span><h2>Gantt físico por item e Ordem de Serviço</h2></div><span className="hint">3 meses visíveis · quantidade e unidade na barra · role para consultar os demais &nbsp; ■ executado &nbsp; ▨ planejado</span></div><div className="ganttViewport" ref={ganttViewport}><div className="ganttTable" style={{"--gantt-month-width": `${ganttMonthWidth}px`} as React.CSSProperties}><div className="ganttHeader"><b>Item / OS / Unidade</b>{months.map((m, index) => <b className={month === index ? "currentGanttMonth" : ""} key={m}>{m}</b>)}</div>{filtered.filter(item => item.plan.some(value => value > 0)).map(item => <div className="ganttRow" key={item.name}><div><strong>{item.name}</strong><small>{item.orders.find(order => order !== "Sem serviços") || "Sem OS"} · Unidade: {item.unit}</small></div>{months.map((_, m) => <div title={item.plan[m] ? `${number.format(item.plan[m])} ${item.unit} · ${orderFor(item, m)}` : "Sem programação"} className={`gcell ${month === m ? "selectedMonth" : ""} ${item.plan[m] ? "scheduled" : ""} ${actual(item, m) >= item.plan[m] && item.plan[m] ? "complete" : ""}`} key={m}>{item.plan[m] ? `${number.format(item.plan[m])} ${item.unit}` : ""}</div>)}</div>)}</div></div></section>

    <section className="panel serviceOrders"><div className="panelHead"><div><span>ORDENS DE SERVIÇO DO PERÍODO</span><h2>O que deve ser executado em {months[month]}/2026</h2></div><span className="hint">Numeração automática conforme a ordem das OS escritas</span></div><div className="tableWrap"><table className="osTable"><thead><tr><th>Nº da OS</th><th>Item do serviço</th><th>Quantidade prevista</th><th>Ordem de Serviço escrita</th></tr></thead><tbody>{currentRows.length ? currentRows.map(item => <tr key={`os-${item.name}`}><td><span className="osCode">{osCode(orderFor(item, month))}</span></td><td><strong>{item.name}</strong></td><td><strong>{number.format(item.plan[month])}</strong> {item.unit}</td><td className="osText">{orderFor(item, month)}</td></tr>) : <tr><td colSpan={4} className="empty">Nenhuma Ordem de Serviço prevista neste mês.</td></tr>}</tbody></table></div></section>

    <section className="panel weekly"><div className="panelHead"><div><span>ACOMPANHAMENTO SEMANAL</span><h2>Planejado × Executado em {months[month]}/2026</h2></div><span className="hint">Planejado proporcional aos dias úteis · executado conforme os lançamentos de cada semana</span></div><div className="weeklyGrid">{weekly.map(row => <div className="week" key={row.label}><div className="weekBars"><i className="weekPlan" style={{height:`${row.planned/weeklyMax*100}%`}}/><i className="weekDone" style={{height:`${row.executed/weeklyMax*100}%`}}/></div><strong>{row.label}</strong><small>Plan. {money.format(row.planned)}</small><small>Exec. {money.format(row.executed)}</small></div>)}</div></section>

    <section className="panel detail"><div className="panelHead"><div><span>PLANO DE EXECUÇÃO SEMANAL</span><h2>Lançamentos de {months[month]}/2026</h2></div><span className={`periodBadge ${closed(month) ? "closed" : "open"}`}>{closed(month) ? "Período fechado" : "Período aberto"}</span></div>{message && <div className="saveMessage" role="status">{message}</div>}<div className="tableWrap"><table className="executionTable"><thead><tr><th>Item / OS</th><th>Unid.</th><th>Planejado mês</th>{weekRanges(2026, month).map(range => <th key={range.week}>Sem. {range.week}<small>{range.start}–{range.end}</small></th>)}<th>Executado mês</th><th>Saldo mês</th></tr></thead><tbody>{currentRows.length ? currentRows.map(item => { const done = actual(item, month); const balance = item.plan[month] - done; return <tr key={item.name}><td><strong>{item.name}</strong><small>{osCode(orderFor(item, month))} — {orderFor(item, month)}</small></td><td>{item.unit}</td><td>{number.format(item.plan[month])}</td>{weekRanges(2026, month).map(range => { const key = recordKey(item, month, range.week); const state = saved[key]; const locked = Boolean(state?.isLocked); const disabled = closed(month) || locked; const value = weeklyActual(item, month, range.week); return <td key={range.week}><div className="weekEntry"><input aria-label={`${item.name}, semana ${range.week}`} type="number" min="0" step="0.01" disabled={disabled} value={drafts[key] ?? String(value)} onChange={e => setDrafts(current => ({...current, [key]: e.target.value}))}/>{locked ? <button className="editBtn" onClick={() => changeExecution(item, range.week, "unlock")} disabled={closed(month) || saving === key}>{closed(month) ? "Fechado" : "Editar"}</button> : <div><button onClick={() => changeExecution(item, range.week, "save")} disabled={closed(month) || saving === key}>{saving === key ? "…" : "Salvar"}</button><button className="lockBtn" onClick={() => changeExecution(item, range.week, "lock")} disabled={closed(month) || saving === key}>Cravar</button></div>}</div></td>})}<td><strong>{number.format(done)}</strong></td><td><strong className={balance < 0 ? "negative" : ""}>{number.format(balance)}</strong></td></tr> }) : <tr><td colSpan={9} className="empty">Nenhum item programado neste mês.</td></tr>}</tbody></table></div></section>

    <section className="panel contractBalance">
      <div className="balanceHead">
        <div>
          <span className="balanceEyebrow">CONTROLE CONTRATUAL POR ITEM</span>
          <h2>Consumo e projeção dos saldos</h2>
          <p>Compare rapidamente o saldo projetado pelo planejamento de {months[month]} com o saldo confirmado pelas medições encerradas.</p>
        </div>
        <div className="balanceLegend">
          <span><i className="legendAvailable"/>Saldo disponível</span>
          <span><i className="legendAttention"/>Saldo negativo</span>
        </div>
      </div>

      <div className="balanceSectionTitle">
        <div><span>01</span><div><b>Visão executiva</b><small>Leitura rápida da situação contratual</small></div></div>
        <em>Referência: {months[month]}/2026</em>
      </div>
      <div className="balanceSummary">
        <article>
          <span>Itens monitorados</span>
          <strong>{balanceStats.monitored}</strong>
          <small>itens com movimentação contratual</small>
        </article>
        <article className="summaryPositive">
          <span>Saldo após medição</span>
          <strong>{balanceStats.measuredAvailable}</strong>
          <small>itens ainda com saldo disponível</small>
        </article>
        <article className={balanceStats.planningCritical ? "summaryWarning" : "summaryPositive"}>
          <span>Alerta no planejamento</span>
          <strong>{balanceStats.planningCritical}</strong>
          <small>itens projetados com saldo negativo</small>
        </article>
        <article className={balanceStats.overConsumed ? "summaryDanger" : "summaryPositive"}>
          <span>Consumo acima de 100%</span>
          <strong>{balanceStats.overConsumed}</strong>
          <small>itens acima da quantidade contratual</small>
        </article>
      </div>

      <div className="balanceContext">
        <div>
          <b>Após planejamento</b>
          <span>Saldo medido até o último mês fechado, descontando o previsto para {months[month]}/2026.</span>
        </div>
        <div>
          <b>Após medição</b>
          <span>Saldo confirmado somente por períodos finalizados e lançamentos cravados.</span>
        </div>
      </div>

      <div className="balanceSectionTitle operationalTitle">
        <div><span>02</span><div><b>Visão operacional</b><small>Detalhamento para acompanhamento e tomada de ação por item</small></div></div>
        <em>{balanceRows.length} itens exibidos</em>
      </div>
      <div className="tableWrap balanceTableWrap">
        <table className="balanceTable">
          <thead>
            <tr className="balanceGroups">
              <th rowSpan={2}>Item do contrato</th>
              <th colSpan={2}>Base contratual</th>
              <th rowSpan={2}>Consumo confirmado</th>
              <th rowSpan={2} className="planningHead">Saldo Contratual<br/>- Após Planejamento</th>
              <th rowSpan={2} className="measurementHead">Saldo Contratual<br/>- Após Medição</th>
            </tr>
            <tr>
              <th>Qtd. contratual</th>
              <th>Executado confirmado</th>
            </tr>
          </thead>
          <tbody>{balanceRows.map(row => {
            const { item, contractual, confirmedConsumed, percentage, afterPlanning, afterMeasurement, overConsumed } = row;
            return <tr key={`balance-${item.name}`} className={overConsumed ? "rowOverConsumed" : ""}>
              <td className="balanceItem">
                <strong>{item.name}</strong>
                <div>
                  <span>{item.unit}</span>
                  <em className={`balanceStatus ${afterMeasurement < 0 ? "critical" : afterPlanning < 0 ? "attention" : "available"}`}>
                    {afterMeasurement < 0 ? "Saldo crítico" : afterPlanning < 0 ? "Atenção ao plano" : "Disponível"}
                  </em>
                </div>
              </td>
              <td className="metricCell">
                <strong>{number.format(contractual)}</strong>
                <small>{item.unit}</small>
              </td>
              <td className="metricCell">
                <strong>{number.format(confirmedConsumed)}</strong>
                <small>{item.unit}</small>
              </td>
              <td>
                {percentage === null
                  ? <div className="consumptionNotApplicable"><strong>—</strong><small>Base contratual não positiva</small></div>
                  : <div className={`consumptionVisual ${overConsumed ? "overConsumed" : ""}`}>
                      <div className="consumptionValue"><strong>{number.format(percentage)}%</strong><small>{overConsumed ? "Acima do contrato" : "Consumido"}</small></div>
                      <span className="consumptionTrack"><i style={{width:`${Math.max(0, Math.min(percentage,100))}%`}}/></span>
                    </div>}
              </td>
              <td className={`balanceResult planningResult ${afterPlanning < 0 ? "negativeResult" : ""}`}>
                <div><strong>{number.format(afterPlanning)}</strong><span>{item.unit}</span></div>
                <small>Após previsão de {months[month]}</small>
              </td>
              <td className={`balanceResult measurementResult ${afterMeasurement < 0 ? "negativeResult" : ""}`}>
                <div><strong>{number.format(afterMeasurement)}</strong><span>{item.unit}</span></div>
                <small>Última medição fechada</small>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>
    <footer>Dados planejados extraídos do arquivo “Modelo Cronograma Base de Dados.xlsx” · Execuções registradas no dashboard</footer>
  </main>;
}

function Card({label, value, note, tone}: {label: string; value: string; note: string; tone: string}) {
  return <article className={`card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
