(()=>{
let appliedCount=0;
function applyItemReadout(){
  if(typeof renderRoad!=='function'||typeof selections!=='function'||typeof relevantLanes!=='function')return false;
  if(renderRoad.__itemReadoutV35)return true;

  const intersectItemIntervals=(base,other)=>{const out=[];for(const[a,b]of merge(base))for(const[c,d]of merge(other)){const s=Math.max(a,c),e=Math.min(b,d);if(e-s>.001)out.push([s,e]);}return merge(out);};
  const itemIntervals=(g,details,service)=>intersectItemIntervals(g.intervals,executionIntervals(g,details,service));
  const itemPoints=(g,details,service)=>uniq(groupDetails(g,details,service).filter(d=>+d.kmf===+d.kmi&&+d.kmi>=g.start&&+d.kmi<=g.end).map(d=>+d.kmi)).sort((a,b)=>a-b);
  const chipList=(intervals,kind,empty)=>{const list=merge(intervals);return list.length?list.map(([a,b])=>`<span class="km-range-chip ${kind}">Km ${fmt(a)}–${fmt(b)}</span>`).join(''):`<span class="km-empty">${esc(empty)}</span>`;};
  const itemReadout=(g,details,service)=>{
    const executed=itemIntervals(g,details,service);
    const pending=subtractIntervals(g.intervals,executed);
    const points=itemPoints(g,details,service);
    return `<div class="km-readout item-km-readout"><div class="km-readout-head"><strong>Leitura dos quilômetros — ${esc(service)}</strong><span>Cenário exclusivo deste item</span></div>
      <div class="km-readout-row executed"><div class="km-readout-label"><i></i><span>Executado</span></div><div class="km-readout-values">${chipList(executed,'executed','Nenhum intervalo executado localizado')}</div><strong>${kmFmt(unionLen(executed))}</strong></div>
      <div class="km-readout-row pending"><div class="km-readout-label"><i></i><span>Pendente</span></div><div class="km-readout-values">${chipList(pending,'pending','Nenhum quilômetro pendente')}</div><strong>${kmFmt(unionLen(pending))}</strong></div>
      <div class="km-readout-row points"><div class="km-readout-label"><i></i><span>Pontos executados</span></div><div class="km-readout-values">${points.length?points.map(p=>`<span class="km-range-chip point">Km ${fmt(p)}</span>`).join(''):'<span class="km-empty">Nenhum ponto executado localizado</span>'}</div><strong>${points.length} ponto(s)</strong></div></div>`;
  };

    renderRoad=function(g,details,qtyRows){
    const status=selections().status,executed=groupHasExecution(g,details),lanes=relevantLanes(g,details,qtyRows);
    let laneHtml='';
    if(status==='Não executado')laneHtml='<div class="no-exec">Exibindo apenas os segmentos contratuais ainda não executados.</div>';
    else if(!lanes.length)laneHtml='<div class="no-exec">Sem família/serviço com execução localizada nesta rodovia para os filtros selecionados.</div>';
    else laneHtml=lanes.map(service=>{
      const total=serviceTotal(qtyRows.filter(q=>String(q.contrato)===g.contrato&&(q.rodovias||[]).map(String).includes(g.rodovia)),service),where=serviceLocationText(g,service,details);
      return `<div class="lane item-lane"><div class="lane-main"><div class="lane-name macro-lane" title="${esc(service)}">${esc(service)}${selections().material&&selections().material!=='Todos'?`<span class="material-hint">${esc(selections().material)}</span>`:''}</div><div class="lane-track">${trackContent(g,details,service)}</div><div class="lane-total"><strong>Qtd. ${short(total)}</strong><span title="${esc(where)}">${esc(where||'Sem KM localizado')}</span></div></div>${itemReadout(g,details,service)}</div>`;
    }).join('');
    const more=status!=='Não executado'&&selections().service==='Todos'?Math.max(0,uniq(groupDetails(g,details).map(d=>String(d.macrogrupo||d.servico))).length-lanes.length):0;
    const code=esc(g.rodovia).replace('-','<br>'),statusText=status==='Executado'?'Executado':status==='Não executado'?'Não executado':executed?'Executado':'Não executado';
    const allExec=itemIntervals(g,details,selections().service==='Todos'?'__ALL__':selections().service);
    const displayedExt=status==='Executado'?unionLen(allExec):status==='Não executado'?unionLen(subtractIntervals(g.intervals,allExec)):g.ext;
    return `<article class="road"><div class="road-top"><div class="road-id"><div class="shield">${code}</div><div><div class="road-name">${esc(g.rodovia)}</div><div class="road-chips"><span class="chip">Contrato ${esc(g.contrato)}</span><span class="status-chip ${statusText==='Executado'?'executed':'not-executed'}">${statusText}</span></div></div></div><div class="ext">${kmFmt(displayedExt)}<span>${status==='Executado'?' executados':status==='Não executado'?' não executados':' de extensão'}</span></div></div><div class="road-scale"><span class="km">Km ${fmt(g.start)}</span><div class="scale-track">${trackContent(g,details,selections().service==='Todos'?'__ALL__':selections().service)}</div><span class="km end">Km ${fmt(g.end)}</span></div><div class="lane-wrap item-lane-wrap">${laneHtml}${more?`<div class="more-lanes">+ ${more} família(s) com execução; selecione no filtro para detalhar.</div>`:''}</div></article>`;
  };
  renderRoad.__itemReadoutV35=true;
  appliedCount++;
  if(typeof render==='function')render();
  console.info('Leitura quilométrica v35 aplicada por item',{appliedCount});
  return true;
}

let attempts=0;
const timer=setInterval(()=>{
  attempts++;
  applyItemReadout();
  if(attempts>=80)clearInterval(timer);
},100);
setTimeout(applyItemReadout,0);
setTimeout(applyItemReadout,1000);
setTimeout(applyItemReadout,3000);
})();