(async()=>{
  try{
    const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s)});
    await load('./dados-sharepoint-20260727-v15/exec-data-v15.js?v=20260727-v15');
    if(!window.__EXEC15) throw new Error('Base quantitativa v15 ausente');
    const bytes=Uint8Array.from(atob(window.__EXEC15),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const payload=JSON.parse(await new Response(stream).text());
    const EXECV15=Array.isArray(payload.records)?payload.records:[];
    delete window.__EXEC15;
    if(!EXECV15.length) throw new Error('Base quantitativa v15 vazia');

    const validationTotal=EXECV15
      .filter(x=>String(x.contrato)==='465'&&(x.rodovias||[]).map(String).includes('SP-253')&&String(x.servico)==='Sinalização horizontal base água mecânica')
      .reduce((t,x)=>t+Number(x.quantidade||0),0);
    if(Math.abs(validationTotal-1500)>.001) throw new Error('Validação SP-253 inválida: '+validationTotal);

    globalThis.EXECV15=EXECV15;
    globalThis.QTY=EXECV15;

    filteredQty=function(){
      const s=selections();
      return EXECV15.filter(q=>(s.contract==='Todos'||String(q.contrato)===s.contract)
        &&(s.road==='Todas'||(q.rodovias||[]).map(String).includes(s.road))
        &&(s.service==='Todos'||String(q.servico)===s.service)
        &&(s.period==='Todos'||String(q.periodo)===s.period));
    };

    refreshFacets=function(){
      if(updating)return;updating=true;
      const current=selections();
      const contracts=uniq(MALHA.filter(m=>current.road==='Todas'||String(m.rodovia)===current.road).map(m=>String(m.contrato))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.contract,contracts,'Todos','Todos os contratos',current.contract);
      const c=els.contract.value||'Todos';
      const roads=uniq(MALHA.filter(m=>c==='Todos'||String(m.contrato)===c).map(m=>String(m.rodovia))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
      setOptions(els.road,roads,'Todas','Todas as rodovias',current.road);
      const r=els.road.value||'Todas';
      const services=uniq(EXECV15.filter(q=>(c==='Todos'||String(q.contrato)===c)
        &&(r==='Todas'||(q.rodovias||[]).map(String).includes(r))
        &&(current.period==='Todos'||String(q.periodo)===current.period))
        .map(q=>String(q.servico))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      setOptions(els.service,services,'Todos','Todas as famílias',current.service);
      const s=els.service.value||'Todos';
      const periods=uniq(EXECV15.filter(q=>(c==='Todos'||String(q.contrato)===c)
        &&(r==='Todas'||(q.rodovias||[]).map(String).includes(r))
        &&(s==='Todos'||String(q.servico)===s))
        .map(q=>String(q.periodo||'')).filter(Boolean)).sort().reverse();
      setOptions(els.period,periods,'Todos','Todos os períodos',current.period);
      updating=false;
    };

    refreshFacets();page=1;render();
    console.info('Quantitativos v15 validados',{registros:EXECV15.length,sp253BaseAgua:validationTotal,meta:payload.meta});
  }catch(err){
    console.error('Erro quantitativos v15:',err);
    const list=document.getElementById('list');
    if(list)list.innerHTML='<div class="empty">Não foi possível validar os quantitativos atualizados.</div>';
  }
})();
