const $=id=>document.getElementById(id);
const els={contract:$('contract'),road:$('road'),service:$('service'),period:$('period'),status:$('status'),sort:$('sort'),search:$('search')};
const DEFAULT_CONTRACT=MALHA.some(x=>String(x.contrato)==='465')?'465':String(MALHA[0]?.contrato||'Todos');
const PAGE_SIZE=8;
let page=1,updating=false;

const uniq=a=>[...new Set(a)];
const fmt=n=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
const kmFmt=n=>fmt(n)+' km';
const short=n=>{n=Number(n||0);return Math.abs(n)>=1e6?fmt(n/1e6)+' mi':Math.abs(n)>=1e3?fmt(n/1e3)+' mil':fmt(n)};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const periodLabel=p=>p==='Todos'?'Todos os períodos':(/^\d{4}-\d{2}$/.test(p)?new Date(p+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}):p);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

function merge(ints){
  const a=ints.filter(x=>Number.isFinite(+x[0])&&Number.isFinite(+x[1])).map(x=>[Math.min(+x[0],+x[1]),Math.max(+x[0],+x[1])]).sort((x,y)=>x[0]-y[0]);
  const out=[];
  for(const x of a){
    if(!out.length||x[0]>out[out.length-1][1]+.001)out.push([...x]);
    else out[out.length-1][1]=Math.max(out[out.length-1][1],x[1]);
  }
  return out;
}
function unionLen(ints){return merge(ints).reduce((t,x)=>t+Math.max(0,x[1]-x[0]),0)}
function subtractIntervals(base,cuts){
  let result=merge(base);
  for(const [ca,cb] of merge(cuts)){
    const next=[];
    for(const [a,b] of result){
      if(cb<=a||ca>=b){next.push([a,b]);continue}
      if(ca>a)next.push([a,Math.min(ca,b)]);
      if(cb<b)next.push([Math.max(cb,a),b]);
    }
    result=next;
  }
  return result.filter(x=>x[1]-x[0]>.001);
}
function groupMalha(rows){
  const mp=new Map();
  for(const r of rows){
    const contrato=String(r.contrato),rodovia=String(r.rodovia),key=contrato+'|'+rodovia;
    if(!mp.has(key))mp.set(key,{contrato,rodovia,intervals:[]});
    mp.get(key).intervals.push([+r.kmi,+r.kmf]);
  }
  return [...mp.values()].map(g=>{g.intervals=merge(g.intervals);g.start=Math.min(...g.intervals.map(x=>x[0]));g.end=Math.max(...g.intervals.map(x=>x[1]));g.ext=unionLen(g.intervals);return g});
}
function selections(){return{contract:els.contract.value||'Todos',road:els.road.value||'Todas',service:els.service.value||'Todos',period:els.period.value||'Todos',status:els.status.value||'Todos'}}
function setOptions(el,values,allValue,allLabel,current){
  const opts=[[allValue,allLabel],...values.map(v=>[String(v),String(v)])];
  el.innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(el===els.period?periodLabel(l):l)}</option>`).join('');
  el.value=opts.some(x=>x[0]===String(current))?String(current):allValue;
}
function refreshFacets(){
  if(updating)return;updating=true;
  const current=selections();
  const contracts=uniq(MALHA.filter(m=>current.road==='Todas'||String(m.rodovia)===current.road).map(m=>String(m.contrato))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
  setOptions(els.contract,contracts,'Todos','Todos os contratos',current.contract);
  const c=els.contract.value||'Todos';
  const roads=uniq(MALHA.filter(m=>c==='Todos'||String(m.contrato)===c).map(m=>String(m.rodovia))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
  setOptions(els.road,roads,'Todas','Todas as rodovias',current.road);
  const r=els.road.value||'Todas';
  const services=uniq(QTY.filter(q=>(c==='Todos'||String(q.contrato)===c)&&(r==='Todas'||(q.rodovias||[]).map(String).includes(r))&&(current.period==='Todos'||String(q.periodo)===current.period)).map(q=>String(q.servico))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  setOptions(els.service,services,'Todos','Todas as famílias',current.service);
  const s=els.service.value||'Todos';
  const periods=uniq(QTY.filter(q=>(c==='Todos'||String(q.contrato)===c)&&(r==='Todas'||(q.rodovias||[]).map(String).includes(r))&&(s==='Todos'||String(q.servico)===s)).map(q=>String(q.periodo||'')).filter(Boolean)).sort().reverse();
  setOptions(els.period,periods,'Todos','Todos os períodos',current.period);
  updating=false;
}
function detailMatches(d,s){return(s.contract==='Todos'||String(d.contrato)===s.contract)&&(s.road==='Todas'||String(d.rodovia)===s.road)&&(s.service==='Todos'||String(d.servico)===s.service)&&(s.period==='Todos'||String(d.periodo)===s.period)}
function qtyMatches(q,s){return(s.contract==='Todos'||String(q.contrato)===s.contract)&&(s.road==='Todas'||(q.rodovias||[]).map(String).includes(s.road))&&(s.service==='Todos'||String(q.servico)===s.service)&&(s.period==='Todos'||String(q.periodo)===s.period)}
function filteredMalha(){const s=selections(),term=(els.search.value||'').trim().toLowerCase();return MALHA.filter(m=>(s.contract==='Todos'||String(m.contrato)===s.contract)&&(s.road==='Todas'||String(m.rodovia)===s.road)&&(!term||String(m.rodovia).toLowerCase().includes(term)||String(m.contrato).includes(term)))}
function filteredDetail(){const s=selections();return DETAIL.filter(d=>detailMatches(d,s))}
function filteredQty(){const s=selections();return QTY.filter(q=>qtyMatches(q,s))}
function groupDetails(g,details,service='__ALL__'){return details.filter(d=>String(d.contrato)===g.contrato&&String(d.rodovia)===g.rodovia&&(service==='__ALL__'||String(d.servico)===service))}
function executionIntervals(g,details,service='__ALL__'){return merge(groupDetails(g,details,service).filter(d=>+d.kmf>+d.kmi).map(d=>[+d.kmi,+d.kmf]))}
function groupHasExecution(g,details){return groupDetails(g,details).length>0}
function segmentStyle(a,b,g,minWidth=.35){
  const start=clamp(Math.min(a,b),g.start,g.end),end=clamp(Math.max(a,b),g.start,g.end),range=Math.max(g.end-g.start,.0001);
  if(end<g.start||start>g.end||end-start<.00001)return null;
  const left=clamp((start-g.start)/range*100,0,100),width=clamp((end-start)/range*100,0,100-left);
  return `left:${left.toFixed(4)}%;width:${Math.max(width,minWidth).toFixed(4)}%;max-width:${(100-left).toFixed(4)}%`;
}
function intervalHtml(ints,g,cls,title=''){
  return merge(ints).map(([a,b])=>{const style=segmentStyle(a,b,g);return style?`<i class="${cls}"${title?` title="${esc(title)}"`:''} style="${style}"></i>`:''}).join('');
}
function pointHtml(points,g,cls,title=''){
  const range=Math.max(g.end-g.start,.0001);
  return points.map(p=>clamp(+p,g.start,g.end)).map(p=>{const left=clamp((p-g.start)/range*100,0,99.6);return `<i class="${cls}"${title?` title="${esc(title)}"`:''} style="left:${left.toFixed(4)}%;width:.4%;max-width:${(100-left).toFixed(4)}%"></i>`}).join('');
}
function trackContent(g,details,service='__ALL__'){
  const status=selections().status,ds=groupDetails(g,details,service),exec=executionIntervals(g,details,service),points=ds.filter(d=>+d.kmf===+d.kmi).map(d=>+d.kmi);
  if(status==='Executado')return intervalHtml(exec,g,'done-seg','Trecho executado')+pointHtml(points,g,'done-seg','Ponto executado');
  if(status==='Não executado')return intervalHtml(subtractIntervals(g.intervals,exec),g,'pending-only-seg','Trecho não executado');
  return intervalHtml(g.intervals,g,'contract-seg')+intervalHtml(exec,g,'done-seg','Trecho executado')+pointHtml(points,g,'done-seg','Ponto executado');
}
function serviceTotal(rows,service){return rows.filter(r=>String(r.servico)===service).reduce((t,r)=>t+Number(r.quantidade||0),0)}
function topServices(rows,limit=3){const mp=new Map();for(const r of rows)mp.set(String(r.servico),(mp.get(String(r.servico))||0)+Number(r.quantidade||0));return[...mp.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit)}
function iconSvg(type){const icons={task:'<svg viewBox="0 0 24 24"><path d="M9 11l2 2 4-4"/><path d="M5 4h14v16H5z"/><path d="M9 4V2h6v2"/></svg>',chart:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'};return icons[type]||icons.task}
function updateTopKpis(rows){const top=topServices(rows,3);for(let i=0;i<3;i++){const el=$('topKpi'+(i+1)),item=top[i];if(!item){el.innerHTML=`<div class="icon yellow">${iconSvg('task')}</div><div class="kpi-copy"><div class="kpi-label">Sem item executado</div><div class="kpi-value">-</div><div class="kpi-note">para o filtro atual</div></div>`}else{el.title=item[0];el.innerHTML=`<div class="icon green">${iconSvg(i===0?'chart':'task')}</div><div class="kpi-copy"><div class="kpi-label">${esc(item[0])}</div><div class="kpi-value">${short(item[1])}</div><div class="kpi-note">quantidade executada</div></div>`}}}
function relevantLanes(g,details,qtyRows){const s=selections();if(s.status==='Não executado')return[];if(s.service!=='Todos')return[s.service];return uniq(groupDetails(g,details).map(d=>String(d.servico))).sort((a,b)=>serviceTotal(qtyRows,b)-serviceTotal(qtyRows,a)).slice(0,4)}
function serviceLocationText(g,service,details){const ds=groupDetails(g,details,service),ints=merge(ds.filter(d=>+d.kmf>+d.kmi).map(d=>[+d.kmi,+d.kmf])),pts=uniq(ds.filter(d=>+d.kmf===+d.kmi).map(d=>+d.kmi)).sort((a,b)=>a-b);return[...ints.map(([a,b])=>`Km ${fmt(a)}–${fmt(b)}`),...pts.map(p=>`Km ${fmt(p)}`)].join(' • ')}
function renderRoad(g,details,qtyRows){
  const status=selections().status,executed=groupHasExecution(g,details),lanes=relevantLanes(g,details,qtyRows);
  let laneHtml='';
  if(status==='Não executado')laneHtml='<div class="no-exec">Exibindo apenas os segmentos contratuais ainda não executados.</div>';
  else if(!lanes.length)laneHtml='<div class="no-exec">Sem família/serviço com execução localizada nesta rodovia para os filtros selecionados.</div>';
  else laneHtml=lanes.map(service=>{const total=serviceTotal(qtyRows.filter(q=>String(q.contrato)===g.contrato&&(q.rodovias||[]).map(String).includes(g.rodovia)),service),where=serviceLocationText(g,service,details);return `<div class="lane"><div class="lane-name" title="${esc(service)}">${esc(service)}</div><div class="lane-track">${trackContent(g,details,service)}</div><div class="lane-total"><strong>Qtd. ${short(total)}</strong><span title="${esc(where)}">${esc(where||'Sem KM localizado')}</span></div></div>`}).join('');
  const more=status!=='Não executado'&&selections().service==='Todos'?Math.max(0,uniq(groupDetails(g,details).map(d=>String(d.servico))).length-lanes.length):0;
  const code=esc(g.rodovia).replace('-','<br>'),statusText=status==='Executado'?'Executado':status==='Não executado'?'Não executado':executed?'Executado':'Não executado';
  const displayedExt=status==='Executado'?unionLen(executionIntervals(g,details)):status==='Não executado'?unionLen(subtractIntervals(g.intervals,executionIntervals(g,details))):g.ext;
  return `<article class="road"><div class="road-top"><div class="road-id"><div class="shield">${code}</div><div><div class="road-name">${esc(g.rodovia)}</div><div class="road-chips"><span class="chip">Contrato ${esc(g.contrato)}</span><span class="status-chip ${statusText==='Executado'?'executed':'not-executed'}">${statusText}</span></div></div></div><div class="ext">${kmFmt(displayedExt)}<span>${status==='Executado'?' executados':status==='Não executado'?' não executados':' de extensão'}</span></div></div><div class="road-scale"><span class="km">Km ${fmt(g.start)}</span><div class="scale-track">${trackContent(g,details,selections().service==='Todos'?'__ALL__':selections().service)}</div><span class="km end">Km ${fmt(g.end)}</span></div><div class="lane-wrap">${laneHtml}${more?`<div class="more-lanes">+ ${more} família(s) com execução; selecione no filtro para detalhar.</div>`:''}</div></article>`;
}
function coverageFor(g,details){return unionLen(executionIntervals(g,details,selections().service==='Todos'?'__ALL__':selections().service))}
function updateSummary(rows,groups,details){
  const status=selections().status;
  const contractual=groups.reduce((t,g)=>t+g.ext,0),executed=groups.reduce((t,g)=>t+coverageFor(g,details),0),pending=Math.max(0,contractual-executed);
  const shownKm=status==='Executado'?executed:status==='Não executado'?pending:contractual;
  const roads=uniq(groups.map(g=>g.rodovia)).length,pct=contractual?Math.min(100,executed/contractual*100):0;
  $('kpiKm').textContent=kmFmt(shownKm);$('kpiRoads').textContent=roads;$('sumKm').textContent=fmt(shownKm);$('sumRoads').textContent=roads;$('sumStart').textContent=rows.length?'Km '+fmt(Math.min(...rows.map(x=>+x.kmi))):'-';$('sumEnd').textContent=rows.length?'Km '+fmt(Math.max(...rows.map(x=>+x.kmf))):'-';$('pct').textContent=fmt(pct)+'%';$('donut').style.setProperty('--p',pct);
  const top=groups.map(g=>({...g,cov:coverageFor(g,details)})).filter(x=>x.cov>0).sort((a,b)=>b.cov-a.cov).slice(0,5),max=top[0]?.cov||1;
  $('topList').innerHTML=top.length?top.map(x=>`<div><div class="top-head"><strong>${esc(x.rodovia)}</strong><span>${kmFmt(x.cov)}</span></div><div class="mini-bar"><i style="width:${clamp(x.cov/max*100,0,100)}%"></i></div></div>`).join(''):'<div class="panel-meta">Sem intervalo executado localizado.</div>';
}
function render(){
  const rows=filteredMalha(),qtyRows=filteredQty(),details=filteredDetail(),status=selections().status;
  let groups=groupMalha(rows);
  if(status==='Executado')groups=groups.filter(g=>groupHasExecution(g,details));
  if(status==='Não executado')groups=groups.filter(g=>unionLen(subtractIntervals(g.intervals,executionIntervals(g,details)))>.001);
  const sort=els.sort.value;
  if(sort==='road')groups.sort((a,b)=>a.rodovia.localeCompare(b.rodovia,'pt-BR',{numeric:true})||a.contrato.localeCompare(b.contrato));
  if(sort==='extDesc')groups.sort((a,b)=>b.ext-a.ext);if(sort==='extAsc')groups.sort((a,b)=>a.ext-b.ext);if(sort==='start')groups.sort((a,b)=>a.start-b.start);
  const keys=new Set(groups.map(g=>g.contrato+'|'+g.rodovia)),visibleRows=rows.filter(r=>keys.has(String(r.contrato)+'|'+String(r.rodovia))),visibleDetails=details.filter(d=>keys.has(String(d.contrato)+'|'+String(d.rodovia)));
  const pages=Math.max(1,Math.ceil(groups.length/PAGE_SIZE));page=Math.min(page,pages);const shown=groups.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  $('meta').textContent=`${groups.length} rodovia(s) • ${visibleRows.length} trecho(s) contratuais • ${visibleDetails.length} registro(s) quilométrico(s) localizado(s)`;
  $('list').innerHTML=shown.length?shown.map(g=>renderRoad(g,visibleDetails,qtyRows)).join(''):'<div class="empty">Nenhuma rodovia encontrada para os filtros selecionados.</div>';
  renderPages(pages,groups.length);updateTopKpis(status==='Não executado'?[]:qtyRows);updateSummary(visibleRows,groups,visibleDetails);
}
function renderPages(pages,count){$('pageInfo').textContent=count?`Página ${page} de ${pages}`:'Sem resultados';let h=`<button class="page" ${page===1?'disabled':''} data-p="${page-1}">‹</button>`;for(let p=Math.max(1,page-2);p<=Math.min(pages,Math.max(1,page-2)+4);p++)h+=`<button class="page ${p===page?'active':''}" data-p="${p}">${p}</button>`;h+=`<button class="page" ${page===pages?'disabled':''} data-p="${page+1}">›</button>`;$('pages').innerHTML=h;$('pages').querySelectorAll('button:not([disabled])').forEach(b=>b.onclick=()=>{page=+b.dataset.p;render();window.scrollTo({top:0,behavior:'smooth'})})}
function initialize(){
  setOptions(els.contract,uniq(MALHA.map(x=>String(x.contrato))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true})),'Todos','Todos os contratos',DEFAULT_CONTRACT);
  els.contract.value=DEFAULT_CONTRACT;setOptions(els.road,[],'Todas','Todas as rodovias','Todas');setOptions(els.service,[],'Todos','Todas as famílias','Todos');setOptions(els.period,[],'Todos','Todos os períodos','Todos');els.status.value='Todos';refreshFacets();page=1;render();
}
[els.contract,els.road,els.service,els.period,els.status].forEach(el=>el.addEventListener('change',()=>{refreshFacets();page=1;render()}));
els.sort.addEventListener('change',()=>{page=1;render()});els.search.addEventListener('input',()=>{page=1;render()});
$('clear').onclick=()=>{els.contract.value=DEFAULT_CONTRACT;els.road.value='Todas';els.service.value='Todos';els.period.value='Todos';els.status.value='Todos';els.sort.value='road';els.search.value='';refreshFacets();page=1;render()};
initialize();
