(async()=>{
  const waitForData=()=>new Promise((resolve,reject)=>{
    const started=Date.now();
    const timer=setInterval(()=>{
      if(Array.isArray(globalThis.EXECV15)&&globalThis.EXECV15.length){clearInterval(timer);resolve();}
      else if(Date.now()-started>15000){clearInterval(timer);reject(new Error('Quantitativos v15 não carregados'));}
    },50);
  });
  try{
    const css=document.createElement('link');css.rel='stylesheet';css.href='./taxonomy-v16.css?v=20260727-v20';document.head.appendChild(css);
    await waitForData();
    globalThis.EXECV15=globalThis.EXECV15.filter(x=>String(x.servico)!=='Total Geral');
    const TAXONOMY=(window.__TAX16||[]).map(x=>({item:x[0],macro:x[1],sub:x[2],code:x[3]}));
    const ITEM_META=new Map(TAXONOMY.map(x=>[x.item,x]));
    const MACRO_ORDER=[...new Set(TAXONOMY.map(x=>x.macro))];
    const ITEM_ORDER=new Map(TAXONOMY.map((x,i)=>[x.item,i]));
    const macroOf=item=>ITEM_META.get(String(item))?.macro||'Não classificado';
    EXECV15.forEach(x=>{x.macrogrupo=macroOf(x.servico);x.itemOriginal=String(x.servico);});
    DETAIL.forEach(x=>{x.macrogrupo=macroOf(x.servico);x.itemOriginal=String(x.servico);});
    globalThis.QTY=EXECV15;

    const serviceField=els.service.closest('.field');
    const serviceLabel=serviceField?.querySelector('label');
    if(serviceLabel)serviceLabel.textContent='Família / Serviço';
    let material=document.getElementById('material');
    if(!material){
      const field=document.createElement('div');
      field.className='field material-field';
      field.innerHTML='<label>Materiais</label><div class="control"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg><select id="material"></select></div>';
      serviceField.insertAdjacentElement('afterend',field);
      material=field.querySelector('select');
    }
    els.material=material;

    const baseSelections=selections;
    selections=function(){const s=baseSelections();s.material=els.material?.value||'Todos';return s;};

    const rowMatch=(q,s)=>(s.contract==='Todos'||String(q.contrato)===s.contract)&&(s.road==='Todas'||(q.rodovias||[]).map(String).includes(s.road))&&(s.service==='Todos'||String(q.macrogrupo)===s.service)&&(s.material==='Todos'||String(q.servico)===s.material)&&(s.period==='Todos'||String(q.periodo)===s.period);
    const detailRowMatch=(d,s)=>(s.contract==='Todos'||String(d.contrato)===s.contract)&&(s.road==='Todas'||String(d.rodovia)===s.road)&&(s.service==='Todos'||String(d.macrogrupo)===s.service)&&(s.material==='Todos'||String(d.servico)===s.material)&&(s.period==='Todos'||String(d.periodo)===s.period);
    qtyMatches=function(q,s){return rowMatch(q,s)};
    detailMatches=function(d,s){return detailRowMatch(d,s)};
    filteredQty=function(){const s=selections();return EXECV15.filter(q=>rowMatch(q,s));};
    filteredDetail=function(){const s=selections();return DETAIL.filter(d=>detailRowMatch(d,s));};

    const macroSort=(a,b)=>{const ai=MACRO_ORDER.indexOf(a),bi=MACRO_ORDER.indexOf(b);return(ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b,'pt-BR');};
    const itemSort=(a,b)=>(ITEM_ORDER.get(a)??9999)-(ITEM_ORDER.get(b)??9999)||a.localeCompare(b,'pt-BR');
    const roadSort=(a,b)=>a.localeCompare(b,'pt-BR',{numeric:true});
    const contractSort=(a,b)=>a.localeCompare(b,'pt-BR',{numeric:true});
    const ALL={contract:'Todos',road:'Todas',service:'Todos',material:'Todos',period:'Todos',status:'Todos'};

    const intersect=(base,other)=>{const out=[];for(const[a,b]of merge(base))for(const[c,d]of merge(other)){const s=Math.max(a,c),e=Math.min(b,d);if(e-s>.001)out.push([s,e]);}return merge(out);};
    const groupsFor=s=>groupMalha(MALHA.filter(m=>(s.contract==='Todos'||String(m.contrato)===s.contract)&&(s.road==='Todas'||String(m.rodovia)===s.road)));
    const detailsFor=s=>DETAIL.filter(d=>detailRowMatch(d,s));
    const executionFiltered=s=>s.service!=='Todos'||s.material!=='Todos'||s.period!=='Todos';
    const groupExecution=(g,details)=>intersect(g.intervals,merge(details.filter(d=>String(d.contrato)===g.contrato&&String(d.rodovia)===g.rodovia&&+d.kmf>+d.kmi).map(d=>[+d.kmi,+d.kmf])));
    const groupHasPoint=(g,details)=>details.some(d=>String(d.contrato)===g.contrato&&String(d.rodovia)===g.rodovia&&+d.kmf===+d.kmi&&+d.kmi>=g.start&&+d.kmi<=g.end);
    const groupHasMatchingExecution=(g,details)=>unionLen(groupExecution(g,details))>.001||groupHasPoint(g,details);
    const groupHasPending=(g,details)=>unionLen(subtractIntervals(g.intervals,groupExecution(g,details)))>.001;
    const resultGroups=s=>{
      const groups=groupsFor(s),details=detailsFor(s);
      if(s.status==='Executado')return groups.filter(g=>groupHasMatchingExecution(g,details));
      if(s.status==='Não executado')return groups.filter(g=>groupHasPending(g,details));
      if(executionFiltered(s))return groups.filter(g=>groupHasMatchingExecution(g,details));
      return groups;
    };
    const hasResults=s=>resultGroups(s).length>0;
    const stateWithout=(current,key)=>({...current,[key]:ALL[key]});
    const availableValues=(key,candidates,current)=>{
      const context=stateWithout(current,key);
      return candidates.filter(value=>hasResults({...context,[key]:String(value)}));
    };

    const allContracts=uniq(MALHA.map(m=>String(m.contrato))).sort(contractSort);
    const allRoads=uniq(MALHA.map(m=>String(m.rodovia))).sort(roadSort);
    const allMacros=uniq(EXECV15.map(q=>String(q.macrogrupo))).sort(macroSort);
    const allItems=uniq(EXECV15.map(q=>String(q.servico))).sort(itemSort);
    const allPeriods=uniq(EXECV15.map(q=>String(q.periodo||'')).filter(Boolean)).sort().reverse();
    const allStatuses=['Executado','Não executado'];

    refreshFacets=function(){
      if(updating)return;
      updating=true;
      try{
        for(let pass=0;pass<3;pass++){
          const current=selections();
          const before=JSON.stringify(current);
          setOptions(els.contract,availableValues('contract',allContracts,current),'Todos','Todos os contratos',current.contract);
          const c1=selections();
          setOptions(els.road,availableValues('road',allRoads,c1),'Todas','Todas as rodovias',c1.road);
          const c2=selections();
          setOptions(els.service,availableValues('service',allMacros,c2),'Todos','Todos os macrogrupos',c2.service);
          const c3=selections();
          setOptions(els.material,availableValues('material',allItems,c3),'Todos','Todos os materiais',c3.material);
          const c4=selections();
          setOptions(els.period,availableValues('period',allPeriods,c4),'Todos','Todos os períodos',c4.period);
          const c5=selections();
          setOptions(els.status,availableValues('status',allStatuses,c5),'Todos','Todos os status',c5.status);
          if(JSON.stringify(selections())===before)break;
        }
      }finally{updating=false;}
    };

    filteredMalha=function(){
      const s=selections();
      const term=(els.search.value||'').trim().toLowerCase();
      const keys=new Set(resultGroups(s).map(g=>g.contrato+'|'+g.rodovia));
      return MALHA.filter(m=>keys.has(String(m.contrato)+'|'+String(m.rodovia))&&(!term||String(m.rodovia).toLowerCase().includes(term)||String(m.contrato).includes(term)));
    };

    groupDetails=function(g,details,macro='__ALL__'){return details.filter(d=>String(d.contrato)===g.contrato&&String(d.rodovia)===g.rodovia&&(macro==='__ALL__'||String(d.macrogrupo)===macro));};
    executionIntervals=function(g,details,macro='__ALL__'){return merge(groupDetails(g,details,macro).filter(d=>+d.kmf>+d.kmi).map(d=>[+d.kmi,+d.kmf]));};
    serviceTotal=function(rows,macro){return rows.filter(r=>String(r.macrogrupo)===macro).reduce((t,r)=>t+Number(r.quantidade||0),0);};
    topServices=function(rows,limit=3){const mp=new Map();for(const r of rows)mp.set(String(r.macrogrupo),(mp.get(String(r.macrogrupo))||0)+Number(r.quantidade||0));return[...mp.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit);};
    relevantLanes=function(g,details,qtyRows){const s=selections();if(s.status==='Não executado')return[];if(s.service!=='Todos')return[s.service];return uniq(groupDetails(g,details).map(d=>String(d.macrogrupo))).sort((a,b)=>serviceTotal(qtyRows,b)-serviceTotal(qtyRows,a)).slice(0,4);};
    serviceLocationText=function(g,macro,details){const ds=groupDetails(g,details,macro),ints=merge(ds.filter(d=>+d.kmf>+d.kmi).map(d=>[+d.kmi,+d.kmf])),pts=uniq(ds.filter(d=>+d.kmf===+d.kmi).map(d=>+d.kmi)).sort((a,b)=>a-b);return[...ints.map(([a,b])=>`Km ${fmt(a)}–${fmt(b)}`),...pts.map(p=>`Km ${fmt(p)}`)].join(' • ');};

    const exec=(g,details,macro='__ALL__')=>intersect(g.intervals,executionIntervals(g,details,macro));
    coverageFor=function(g,details){const s=selections();return unionLen(exec(g,details,s.service==='Todos'?'__ALL__':s.service));};

    const oldRenderRoad=renderRoad;
    renderRoad=function(g,details,qtyRows){
      const html=oldRenderRoad(g,details,qtyRows);
      return html.replace(/<div class="lane-name" title="([^"]*)">([^<]*)<\/div>/g,(m,title,label)=>`<div class="lane-name macro-lane" title="${title}">${label}${selections().material!=='Todos'?`<span class="material-hint">${esc(selections().material)}</span>`:''}</div>`);
    };

    els.material.addEventListener('change',()=>{refreshFacets();page=1;render();});
    document.getElementById('clear').onclick=()=>{els.contract.value=DEFAULT_CONTRACT;els.road.value='Todas';els.service.value='Todos';els.material.value='Todos';els.period.value='Todos';els.status.value='Todos';els.sort.value='road';els.search.value='';refreshFacets();page=1;render();};
    refreshFacets();page=1;render();
    console.info('Taxonomia v20 aplicada com filtros encadeados');
  }catch(err){console.error('Erro taxonomia v20:',err);}
})();
