(()=>{
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const segmentStyle=(a,b,start,end,minWidth=.35)=>{
    const range=Math.max(end-start,.0001);
    const aa=clamp(Math.min(a,b),start,end);
    const bb=clamp(Math.max(a,b),start,end);
    if(bb<start||aa>end)return null;
    const left=clamp((aa-start)/range*100,0,100);
    const right=clamp((bb-start)/range*100,0,100);
    const width=clamp(Math.max(right-left,minWidth),0,100-left);
    return {left,width};
  };

  refreshFacets=function(){
    if(updating)return;
    updating=true;
    try{
      const current=selections();
      const contracts=uniq(MALHA
        .filter(m=>current.road==='Todas'||m.rodovia===current.road)
        .map(m=>m.contrato)).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.contract,contracts,'Todos','Todos os contratos',current.contract);

      const selectedContract=els.contract.value||'Todos';
      const roads=uniq(MALHA
        .filter(m=>selectedContract==='Todos'||m.contrato===selectedContract)
        .map(m=>m.rodovia))
        .sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.road,roads,'Todas','Todas as rodovias',current.road);

      const s2=selections();
      const services=uniq(QTY.filter(q=>(s2.contract==='Todos'||q.contrato===s2.contract)
        &&(s2.road==='Todas'||(q.rodovias||[]).includes(s2.road))
        &&(s2.period==='Todos'||q.periodo===s2.period))
        .map(q=>q.servico)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      setOptions(els.service,services,'Todos','Todas as famílias',current.service);

      const s3=selections();
      const periods=uniq(QTY.filter(q=>(s3.contract==='Todos'||q.contrato===s3.contract)
        &&(s3.road==='Todas'||(q.rodovias||[]).includes(s3.road))
        &&(s3.service==='Todos'||q.servico===s3.service))
        .map(q=>q.periodo).filter(Boolean)).sort().reverse();
      setOptions(els.period,periods,'Todos','Todos os períodos',current.period);
    } finally {
      updating=false;
    }
  };

  contractSegments=function(g,range){
    return g.intervals.map(([a,b])=>{
      const p=segmentStyle(a,b,g.start,g.end,.25);
      return p?`<i class="contract-seg" style="left:${p.left}%;width:${p.width}%"></i>`:'';
    }).join('');
  };

  executionSegments=function(g,service,details,range){
    const ds=details.filter(d=>d.contrato===g.contrato&&d.rodovia===g.rodovia&&(service==='__ALL__'||d.servico===service));
    const intervals=merge(ds.filter(d=>Number(d.kmf)>Number(d.kmi)).map(d=>[Number(d.kmi),Number(d.kmf)]));
    const points=ds.filter(d=>Number(d.kmf)===Number(d.kmi)).map(d=>Number(d.kmi));
    let html=intervals.map(([a,b])=>{
      const p=segmentStyle(a,b,g.start,g.end,.45);
      if(!p)return '';
      const matches=ds.filter(d=>Number(d.kmi)<=b&&Number(d.kmf)>=a);
      const obs=uniq(matches.map(d=>d.observacao).filter(Boolean)).slice(0,2).join(' | ');
      return `<i class="done-seg" title="${esc(service)} | Km ${fmt(a)} ao Km ${fmt(b)}${obs?' | '+esc(obs):''}" style="left:${p.left}%;width:${p.width}%"></i>`;
    }).join('');
    html+=points.map(point=>{
      const p=segmentStyle(point,point,g.start,g.end,.6);
      return p?`<i class="done-seg" title="${esc(service)} | ponto no Km ${fmt(point)}" style="left:${p.left}%;width:${p.width}%"></i>`:'';
    }).join('');
    return html;
  };

  function groupExecuted(details){
    const map=new Map();
    for(const d of details){
      const a=Number(d.kmi),b=Number(d.kmf);
      if(!Number.isFinite(a)||!Number.isFinite(b))continue;
      const key=d.contrato+'|'+d.rodovia;
      if(!map.has(key))map.set(key,{contrato:d.contrato,rodovia:d.rodovia,intervals:[],points:[]});
      if(b>a)map.get(key).intervals.push([a,b]);else map.get(key).points.push(a);
    }
    return [...map.values()].map(g=>{
      g.intervals=merge(g.intervals);
      const values=[...g.intervals.flat(),...g.points];
      g.start=Math.min(...values);
      g.end=Math.max(...values);
      if(g.end===g.start)g.end=g.start+.01;
      g.ext=unionLen(g.intervals);
      return g;
    });
  }

  function pendingSegments(g,details){
    const executed=merge(details.filter(d=>d.contrato===g.contrato&&d.rodovia===g.rodovia&&Number(d.kmf)>Number(d.kmi)).map(d=>[Number(d.kmi),Number(d.kmf)]));
    const pending=[];
    for(const [start,end] of g.intervals){
      let cursor=start;
      for(const [a,b] of executed){
        if(b<=cursor||a>=end)continue;
        if(a>cursor)pending.push([cursor,Math.min(a,end)]);
        cursor=Math.max(cursor,b);
        if(cursor>=end)break;
      }
      if(cursor<end)pending.push([cursor,end]);
    }
    return pending;
  }

  function pendingHtml(g,details){
    return pendingSegments(g,details).map(([a,b])=>{
      const p=segmentStyle(a,b,g.start,g.end,.25);
      return p?`<i class="pending-only-seg" title="Não executado | Km ${fmt(a)} ao Km ${fmt(b)}" style="left:${p.left}%;width:${p.width}%"></i>`:'';
    }).join('');
  }

  renderRoad=function(g,details,qtyRows){
    const status=selections().status;
    const range=Math.max(g.end-g.start,.0001);
    const executed=groupHasExecution(g,details);
    const showExecutedOnly=status==='Executado';
    const showPendingOnly=status==='Não executado';
    const base=showExecutedOnly?'':(showPendingOnly?pendingHtml(g,details):contractSegments(g,range));
    const allExecution=showPendingOnly?'':executionSegments(g,selections().service==='Todos'?'__ALL__':selections().service,details,range);
    const lanes=relevantLanes(g,details,qtyRows);
    let laneHtml='';

    if(showPendingOnly){
      laneHtml='<div class="no-exec">Exibindo somente a extensão contratual ainda não executada.</div>';
    } else if(!lanes.length){
      laneHtml='<div class="no-exec">Sem família/serviço com execução localizada nesta rodovia para os filtros selecionados.</div>';
    } else {
      laneHtml=lanes.map(service=>{
        const total=serviceTotal(qtyRows.filter(q=>q.contrato===g.contrato&&(q.rodovias||[]).includes(g.rodovia)),service);
        const where=serviceLocationText(g,service,details);
        const laneBase=showExecutedOnly?'':contractSegments(g,range);
        return `<div class="lane"><div class="lane-name" title="${esc(service)}">${esc(service)}</div><div class="lane-track ${showExecutedOnly?'status-executed':''}">${laneBase}${executionSegments(g,service,details,range)}</div><div class="lane-total"><strong>Qtd. ${short(total)}</strong><span title="${esc(where)}">${esc(where||'Sem KM localizado')}</span></div></div>`;
      }).join('');
    }

    const more=!showPendingOnly&&selections().service==='Todos'?uniq(details.filter(d=>d.contrato===g.contrato&&d.rodovia===g.rodovia).map(d=>d.servico)).length-lanes.length:0;
    const code=g.rodovia.replace('-','<br>');
    const statusLabel=showPendingOnly?'Não executado':(executed?'Executado':'Não executado');
    const statusClass=statusLabel==='Executado'?'executed':'not-executed';
    const extensionLabel=showExecutedOnly?'executados':'de extensão';
    return `<article class="road"><div class="road-top"><div class="road-id"><div class="shield">${code}</div><div><div class="road-name">${g.rodovia}</div><div class="road-chips"><span class="chip">Contrato ${g.contrato}</span><span class="status-chip ${statusClass}">${statusLabel}</span></div></div></div><div class="ext">${kmFmt(g.ext)}<span>${extensionLabel}</span></div></div><div class="road-scale"><span class="km">Km ${fmt(g.start)}</span><div class="scale-track ${showExecutedOnly?'status-executed':showPendingOnly?'status-pending':''}">${base}${allExecution}</div><span class="km end">Km ${fmt(g.end)}</span></div><div class="lane-wrap">${laneHtml}${more>0?`<div class="more-lanes">+ ${more} família(s) com execução; selecione no filtro para detalhar.</div>`:''}</div></article>`;
  };

  render=function(){
    const rows=filteredMalha();
    const qtyRows=filteredQty();
    const details=filteredDetail();
    const status=selections().status;
    let groups;

    if(status==='Executado'){
      groups=groupExecuted(details);
    } else {
      groups=groupMalha(rows);
      if(status==='Não executado')groups=groups.filter(g=>pendingSegments(g,details).length>0);
    }

    const sort=els.sort.value;
    if(sort==='road')groups.sort((a,b)=>a.rodovia.localeCompare(b.rodovia,'pt-BR',{numeric:true})||a.contrato.localeCompare(b.contrato));
    if(sort==='extDesc')groups.sort((a,b)=>b.ext-a.ext);
    if(sort==='extAsc')groups.sort((a,b)=>a.ext-b.ext);
    if(sort==='start')groups.sort((a,b)=>a.start-b.start);

    const groupKeys=new Set(groups.map(g=>g.contrato+'|'+g.rodovia));
    let visibleDetails=details.filter(d=>groupKeys.has(d.contrato+'|'+d.rodovia));
    let visibleRows;
    if(status==='Executado'){
      visibleRows=groups.flatMap(g=>g.intervals.map(([kmi,kmf])=>({contrato:g.contrato,rodovia:g.rodovia,kmi,kmf})));
    } else if(status==='Não executado'){
      visibleRows=groups.flatMap(g=>pendingSegments(g,visibleDetails).map(([kmi,kmf])=>({contrato:g.contrato,rodovia:g.rodovia,kmi,kmf})));
    } else {
      visibleRows=rows.filter(r=>groupKeys.has(r.contrato+'|'+r.rodovia));
    }

    const pages=Math.max(1,Math.ceil(groups.length/PAGE_SIZE));
    page=Math.min(page,pages);
    const shown=groups.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    $('meta').textContent=`${groups.length} rodovia(s) • ${visibleRows.length} trecho(s) • ${visibleDetails.length} registro(s) quilométrico(s) localizado(s)`;
    $('list').innerHTML=shown.length?shown.map(g=>renderRoad(g,visibleDetails,qtyRows)).join(''):'<div class="empty">Nenhuma rodovia encontrada para os filtros selecionados.</div>';
    renderPages(pages,groups.length);
    updateTopKpis(status==='Não executado'?[]:qtyRows);
    updateSummary(visibleRows,groups,status==='Não executado'?[]:visibleDetails);
  };

  const hero=document.querySelector('.hero-road');
  if(hero){
    hero.innerHTML=`<svg viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Rodovia em perspectiva">
      <defs>
        <linearGradient id="v9sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#087a98"/><stop offset=".52" stop-color="#075676"/><stop offset="1" stop-color="#052b49"/></linearGradient>
        <linearGradient id="v9road" x1="0" y1="0" x2=".75" y2="1"><stop offset="0" stop-color="#2b7187"/><stop offset=".48" stop-color="#164d68"/><stop offset="1" stop-color="#082b47"/></linearGradient>
        <linearGradient id="v9shoulder" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#91c7d4"/><stop offset="1" stop-color="#d9f3f7"/></linearGradient>
        <filter id="v9glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="900" height="260" fill="url(#v9sky)"/>
      <path d="M-70 260C120 214 267 177 425 146C581 116 734 94 970 79L970 260Z" fill="url(#v9road)"/>
      <path d="M-70 251C128 205 278 169 431 140C590 110 748 89 970 75" fill="none" stroke="url(#v9shoulder)" stroke-width="7" opacity=".95"/>
      <path d="M-40 270C155 222 302 187 454 160C615 131 766 113 950 102" fill="none" stroke="#f1fcff" stroke-width="3.4" opacity=".98"/>
      <path d="M90 268C245 223 376 193 514 169C660 144 790 129 935 120" fill="none" stroke="#f8fdff" stroke-width="2.5" stroke-dasharray="24 18" opacity=".95"/>
      <path d="M255 268C379 226 492 199 608 180C724 160 825 149 925 143" fill="none" stroke="#f8fdff" stroke-width="2.3" stroke-dasharray="22 17" opacity=".88"/>
      <path d="M-20 218C174 171 337 135 507 109C666 85 790 71 920 63" fill="none" stroke="#5fa5b8" stroke-width="2" opacity=".55"/>
      <g stroke="#a6dae5" fill="none" opacity=".8">
        <path d="M566 28V103M754 26V84" stroke-width="4"/>
        <path d="M548 30H774V68H548Z" stroke-width="3"/>
        <path d="M590 30V68M713 30V68" stroke-width="2"/>
        <rect x="617" y="36" width="86" height="26" rx="4" fill="#0c5d78" stroke="#80c7d7" stroke-width="2"/>
      </g>
      <g stroke="#83c8d6" stroke-width="2" opacity=".78">
        <path d="M46 191L33 232M86 180L74 221M126 169L115 210M166 159L156 199"/>
        <path d="M30 218C78 204 126 190 180 179"/>
      </g>
      <g fill="#e9fbff" filter="url(#v9glow)"><circle cx="301" cy="148" r="3.2"/><circle cx="407" cy="127" r="3"/><circle cx="521" cy="107" r="2.8"/><circle cx="631" cy="92" r="2.5"/></g>
      <g transform="translate(742 145)"><path d="M0 48 13 0l13 48z" fill="#f7fdff"/><path d="M5 29h16l3 10H2z" fill="#51c4d0"/><path d="M7 19h12" stroke="#51c4d0" stroke-width="4"/></g>
      <g transform="translate(814 128) scale(.78)"><path d="M0 48 13 0l13 48z" fill="#f7fdff"/><path d="M5 29h16l3 10H2z" fill="#51c4d0"/><path d="M7 19h12" stroke="#51c4d0" stroke-width="4"/></g>
      <path d="M0 259H900" stroke="#49bac9" stroke-width="4" opacity=".7"/>
    </svg>`;
  }

  refreshFacets();
  render();
})();
