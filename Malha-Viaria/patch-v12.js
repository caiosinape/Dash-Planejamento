(async()=>{
  try{
    const unpack=async b=>{const x=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return await new Response(new Blob([x]).stream().pipeThrough(new DecompressionStream('gzip'))).text()};
    const hero=document.querySelector('.hero-road');
    if(hero) hero.innerHTML=await unpack('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');
  }catch(e){console.error('Falha ao atualizar a arte da rodovia',e)}

  function intersectIntervalsV12(base,other){
    const out=[];
    for(const [a,b] of merge(base)) for(const [c,d] of merge(other)){const s=Math.max(a,c),e=Math.min(b,d);if(e-s>.001)out.push([s,e])}
    return merge(out);
  }
  function executedIntervalsV12(g,details,service='__ALL__'){return intersectIntervalsV12(g.intervals,executionIntervals(g,details,service))}
  function pendingIntervalsV12(g,details,service='__ALL__'){return subtractIntervals(g.intervals,executedIntervalsV12(g,details,service))}
  function executedPointsV12(g,details,service='__ALL__'){return uniq(groupDetails(g,details,service).filter(d=>+d.kmf===+d.kmi&&+d.kmi>=g.start&&+d.kmi<=g.end).map(d=>+d.kmi)).sort((a,b)=>a-b)}

  coverageFor=function(g,details){const s=selections();return unionLen(executedIntervalsV12(g,details,s.service==='Todos'?'__ALL__':s.service))};

  function kmChipsV12(intervals,kind,empty){const list=merge(intervals);return list.length?list.map(([a,b])=>`<span class="km-range-chip ${kind}">Km ${fmt(a)}–${fmt(b)}</span>`).join(''):`<span class="km-empty">${esc(empty)}</span>`}
  function kilometerReadoutV12(g,details){
    const service=selections().service==='Todos'?'__ALL__':selections().service;
    const executed=executedIntervalsV12(g,details,service),pending=pendingIntervalsV12(g,details,service),points=executedPointsV12(g,details,service);
    return `<div class="km-readout"><div class="km-readout-head"><strong>Leitura dos quilômetros</strong><span>Intervalos conforme os filtros selecionados</span></div>
      <div class="km-readout-row executed"><div class="km-readout-label"><i></i><span>Executado</span></div><div class="km-readout-values">${kmChipsV12(executed,'executed','Nenhum intervalo executado localizado')}</div><strong>${kmFmt(unionLen(executed))}</strong></div>
      <div class="km-readout-row pending"><div class="km-readout-label"><i></i><span>Pendente</span></div><div class="km-readout-values">${kmChipsV12(pending,'pending','Nenhum quilômetro pendente')}</div><strong>${kmFmt(unionLen(pending))}</strong></div>
      <div class="km-readout-row points"><div class="km-readout-label"><i></i><span>Pontos executados</span></div><div class="km-readout-values">${points.length?points.map(p=>`<span class="km-range-chip point">Km ${fmt(p)}</span>`).join(''):'<span class="km-empty">Nenhum ponto executado localizado</span>'}</div><strong>${points.length} ponto(s)</strong></div></div>`;
  }

  renderRoad=function(g,details,qtyRows){
    const status=selections().status,executed=groupHasExecution(g,details),lanes=relevantLanes(g,details,qtyRows);
    let laneHtml='';
    if(status==='Não executado')laneHtml='<div class="no-exec">Exibindo apenas os segmentos contratuais ainda não executados.</div>';
    else if(!lanes.length)laneHtml='<div class="no-exec">Sem família/serviço com execução localizada nesta rodovia para os filtros selecionados.</div>';
    else laneHtml=lanes.map(service=>{const total=serviceTotal(qtyRows.filter(q=>String(q.contrato)===g.contrato&&(q.rodovias||[]).map(String).includes(g.rodovia)),service),where=serviceLocationText(g,service,details);return `<div class="lane"><div class="lane-name" title="${esc(service)}">${esc(service)}</div><div class="lane-track">${trackContent(g,details,service)}</div><div class="lane-total"><strong>Qtd. ${short(total)}</strong><span title="${esc(where)}">${esc(where||'Sem KM localizado')}</span></div></div>`}).join('');
    const more=status!=='Não executado'&&selections().service==='Todos'?Math.max(0,uniq(groupDetails(g,details).map(d=>String(d.servico))).length-lanes.length):0;
    const code=esc(g.rodovia).replace('-','<br>'),statusText=status==='Executado'?'Executado':status==='Não executado'?'Não executado':executed?'Executado':'Não executado';
    const displayedExt=status==='Executado'?unionLen(executedIntervalsV12(g,details)):status==='Não executado'?unionLen(pendingIntervalsV12(g,details)):g.ext;
    return `<article class="road"><div class="road-top"><div class="road-id"><div class="shield">${code}</div><div><div class="road-name">${esc(g.rodovia)}</div><div class="road-chips"><span class="chip">Contrato ${esc(g.contrato)}</span><span class="status-chip ${statusText==='Executado'?'executed':'not-executed'}">${statusText}</span></div></div></div><div class="ext">${kmFmt(displayedExt)}<span>${status==='Executado'?' executados':status==='Não executado'?' não executados':' de extensão'}</span></div></div><div class="road-scale"><span class="km">Km ${fmt(g.start)}</span><div class="scale-track">${trackContent(g,details,selections().service==='Todos'?'__ALL__':selections().service)}</div><span class="km end">Km ${fmt(g.end)}</span></div>${kilometerReadoutV12(g,details)}<div class="lane-wrap">${laneHtml}${more?`<div class="more-lanes">+ ${more} família(s) com execução; selecione no filtro para detalhar.</div>`:''}</div></article>`;
  };

  render();
})();
