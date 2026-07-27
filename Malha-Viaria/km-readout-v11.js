(()=>{
  if(typeof renderRoad!=='function'||typeof render!=='function')return;

  const originalRenderRoad=renderRoad;

  function intersectIntervals(base,executed){
    const result=[];
    for(const [a,b] of merge(base)){
      for(const [c,d] of merge(executed)){
        const start=Math.max(a,c),end=Math.min(b,d);
        if(end-start>.001)result.push([start,end]);
      }
    }
    return merge(result);
  }

  function intervalChips(intervals,emptyText){
    const merged=merge(intervals);
    if(!merged.length)return `<span class="km-empty">${esc(emptyText)}</span>`;
    return merged.map(([a,b])=>`<span class="km-range-chip">Km ${fmt(a)}–${fmt(b)}</span>`).join('');
  }

  function kilometerReadout(g,details){
    const service=selections().service==='Todos'?'__ALL__':selections().service;
    const rawExecuted=executionIntervals(g,details,service);
    const executed=intersectIntervals(g.intervals,rawExecuted);
    const pending=subtractIntervals(g.intervals,executed);
    const points=uniq(groupDetails(g,details,service)
      .filter(d=>+d.kmf===+d.kmi&&+d.kmi>=g.start&&+d.kmi<=g.end)
      .map(d=>+d.kmi)).sort((a,b)=>a-b);

    const executedKm=unionLen(executed);
    const pendingKm=unionLen(pending);
    const pointRow=points.length?`<div class="km-readout-row points"><div class="km-readout-label"><i></i><span>Pontos executados</span></div><div class="km-readout-values">${points.map(p=>`<span class="km-range-chip">Km ${fmt(p)}</span>`).join('')}</div><strong>${points.length} ponto(s)</strong></div>`:'';

    return `<div class="km-readout">
      <div class="km-readout-head"><strong>Leitura dos quilômetros</strong><span>Intervalos conforme os filtros selecionados</span></div>
      <div class="km-readout-row executed"><div class="km-readout-label"><i></i><span>Executado</span></div><div class="km-readout-values">${intervalChips(executed,'Nenhum intervalo executado localizado')}</div><strong>${kmFmt(executedKm)}</strong></div>
      <div class="km-readout-row pending"><div class="km-readout-label"><i></i><span>Pendente</span></div><div class="km-readout-values">${intervalChips(pending,'Nenhum quilômetro pendente')}</div><strong>${kmFmt(pendingKm)}</strong></div>
      ${pointRow}
    </div>`;
  }

  renderRoad=function(g,details,qtyRows){
    const html=originalRenderRoad(g,details,qtyRows);
    if(selections().status!=='Executado')return html;
    return html.replace('<div class="lane-wrap">',kilometerReadout(g,details)+'<div class="lane-wrap">');
  };

  render();
})();
