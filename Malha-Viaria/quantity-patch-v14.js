(async()=>{
  try{
    const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)});
    for(let i=1;i<=4;i++) await load(`./dados-sharepoint-20260727-v14/exec-${String(i).padStart(2,'0')}.js?v=20260727-v14`);
    if(!window.__EXEC14) throw new Error('Base quantitativa v14 ausente');
    const bytes=Uint8Array.from(atob(window.__EXEC14),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const d=JSON.parse(await new Response(stream).text());
    const EXECV14=d.E.map(x=>({contrato:d.C[x[0]],periodo:d.P[x[1]],rodovias:x[2].map(i=>d.R[i]),servico:d.S[x[3]],quantidade:x[4]}));
    globalThis.EXECV14=EXECV14; globalThis.EXEC_META_V14=d.M||{}; delete window.__EXEC14;

    filteredQty=function(){const s=selections();return EXECV14.filter(q=>qtyMatches(q,s))};
    refreshFacets=function(){
      if(updating)return;updating=true;
      const current=selections();
      const contracts=uniq(MALHA.filter(m=>current.road==='Todas'||String(m.rodovia)===current.road).map(m=>String(m.contrato))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.contract,contracts,'Todos','Todos os contratos',current.contract);
      const c=els.contract.value||'Todos';
      const roads=uniq(MALHA.filter(m=>c==='Todos'||String(m.contrato)===c).map(m=>String(m.rodovia))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.road,roads,'Todas','Todas as rodovias',current.road);
      const r=els.road.value||'Todas';
      const services=uniq(EXECV14.filter(q=>(c==='Todos'||String(q.contrato)===c)&&(r==='Todas'||q.rodovias.includes(r))&&(current.period==='Todos'||String(q.periodo)===current.period)).map(q=>String(q.servico))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      setOptions(els.service,services,'Todos','Todas as famílias',current.service);
      const s=els.service.value||'Todos';
      const periods=uniq(EXECV14.filter(q=>(c==='Todos'||String(q.contrato)===c)&&(r==='Todas'||q.rodovias.includes(r))&&(s==='Todos'||String(q.servico)===s)).map(q=>String(q.periodo)).filter(Boolean)).sort().reverse();
      setOptions(els.period,periods,'Todos','Todos os períodos',current.period);
      updating=false;
    };
    refreshFacets(); page=1; render();
    console.info('Quantitativos v14 carregados',EXEC_META_V14,{registros:EXECV14.length});
  }catch(err){console.error('Erro quantitativos v14:',err)}
})();
