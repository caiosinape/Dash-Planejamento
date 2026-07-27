(async()=>{
  const wait=()=>new Promise((resolve,reject)=>{const started=Date.now(),t=setInterval(()=>{if(Array.isArray(globalThis.EXECV15)&&globalThis.EXECV15.length&&Array.isArray(globalThis.MALHA)&&globalThis.MALHA.length){clearInterval(t);resolve()}else if(Date.now()-started>15000){clearInterval(t);reject(new Error('Bases não carregadas'))}},50)});
  try{
    await wait();
    const accent=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const norm=s=>accent(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
    const tax=new Map((window.__TAX16||[]).map(x=>[String(x[0]),String(x[1])]));
    const roadMap=new Map(),bounds=new Map();
    for(const m of MALHA){
      const c=String(m.contrato),raw=String(m.rodovia),hit=raw.match(/([A-Za-z]+)\s*-?\s*(\d+)/);if(!hit)continue;
      const road=`${hit[1].toUpperCase()}-${hit[2]}`,key=c+'|'+road;
      if(!roadMap.has(c))roadMap.set(c,new Map());roadMap.get(c).set(road,{uf:hit[1].toUpperCase(),num:hit[2]});
      const a=Number(m.kmi),b=Number(m.kmf),old=bounds.get(key)||[Infinity,-Infinity];bounds.set(key,[Math.min(old[0],a,b),Math.max(old[1],a,b)]);
    }
    const num=s=>{s=String(s).trim().replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const v=Number(s);return Number.isFinite(v)?v:null};
    const parseKm=(text,c,road)=>{
      if(/km\s*\.?\s*diversos/i.test(text))return null;
      let vals=[...text.matchAll(/\bkm\s*[:º°-]?\s*(\d{1,4}(?:[\.,]\d{1,3})?)/ig)].map(x=>num(x[1])).filter(Number.isFinite);
      const bd=bounds.get(c+'|'+road);if(bd){const valid=vals.filter(v=>v>=bd[0]-5&&v<=bd[1]+5);if(valid.length)vals=valid}
      if(!vals.length)return null;if(vals.length===1)return[vals[0],vals[0]];return[Math.min(vals[0],vals[1]),Math.max(vals[0],vals[1])];
    };
    const segments=(obs,c)=>{
      const text=String(obs||'').replace(/_x000D_/g,'\n').replace(/\r/g,'\n'),hits=[];
      for(const[road,p]of roadMap.get(c)||[]){const re=new RegExp('(?<![A-Z0-9])'+p.uf+'\\s*[-–—]?\\s*0*'+p.num+'(?!\\d)','ig');for(const m of text.matchAll(re))hits.push({start:m.index,end:m.index+m[0].length,road})}
      hits.sort((a,b)=>a.start-b.start);const clean=hits.filter((x,i)=>!i||x.start>=hits[i-1].end),out=[];
      clean.forEach((x,i)=>{const t=text.slice(x.start,clean[i+1]?.start??text.length).trim();out.push({road:x.road,text:t,km:parseKm(t,c,x.road)})});return out;
    };
    const macroKw={
      'Sinalização horizontal':['pintura','faixa','zebrado','legenda','lerv','sonorizador','lombada','epx','base agua','base solvente','plastico a frio','termoplast','extrud','aspersao','hot spray','fresa','fresagem','laminado'],
      'Sinalização vertical':['placa','placas','portico','suporte','poste','braco projetado','coluna conica'],
      'Dispositivos auxiliares de sinalização':['tacha','tachao','cilindro delimitador','refletivo'],
      'Dispositivos de segurança viária':['tae','atenuador','defensa','barreira'],
      'Sinalização semafórica':['semafor','controlador','modulo led','bloco semaforico'],
      'Serviços civis e complementares':['concret','escav','reaterro','pavimenta','grama','capina','vala'],
      'Administração, apoio e mobilização':['equipe','administracao','canteiro','locacao'],
      'Projetos e serviços técnicos':['projeto','as built']
    };
    const itemKw=(item,macro)=>{const n=norm(item),k=[];
      if(n.includes('tae'))k.push('tae','atenuador');if(n.includes('tacha')||n.includes('tachao'))k.push('tacha','tachao');if(n.includes('defensa'))k.push('defensa');
      if(n.includes('placa'))k.push('placa','placas');if(n.includes('suporte'))k.push('placa','placas','suporte');if(n.includes('portico'))k.push('portico');if(n.includes('poste'))k.push('poste','placa');if(n.includes('braco projetado'))k.push('braco projetado','placa');if(n.includes('coluna conica'))k.push('coluna','placa');
      if(n.includes('base agua'))k.push('base agua','agua','pintura','faixa','lombada');if(n.includes('base de solvente')||n.includes('base solvente'))k.push('base solvente','solvente');if(n.includes('plastico a frio'))k.push('plastico a frio');if(n.includes('epx'))k.push('epx');if(n.includes('extrusao'))k.push('extrusao','extrudado','extrud');if(n.includes('aspersao'))k.push('aspersao');if(n.includes('hot spray'))k.push('hot spray');if(n.includes('laminado'))k.push('laminado');if(n.includes('remocao de sinalizacao horizontal'))k.push('fresa','fresagem','remocao');if(n.includes('equipe por administracao'))k.push('equipe dia','equipe','administracao');
      return[...new Set([...k,...(macroKw[macro]||[])])]
    };
    const score=(item,macro,text)=>{const t=norm(text),keys=itemKw(item,macro);let s=0;keys.forEach((k,i)=>{if(t.includes(k))s+=i<3?8:2});for(const[m,ks]of Object.entries(macroKw))if(m!==macro&&ks.some(k=>t.includes(k)))s--;return s};
    const weight=s=>s.km&&s.km[1]>s.km[0]?Math.max(.001,s.km[1]-s.km[0]):1;
    const corrected=[],detail=[],audit={direct:0,allocated:0,unassigned:0};
    for(const q of globalThis.EXECV15){
      const c=String(q.contrato),item=String(q.servico),macro=tax.get(item)||String(q.macrogrupo||'Não classificado'),amount=Number(q.quantidade||0),ss=segments(q.observacao,c);
      if(!amount||!ss.length){corrected.push({...q,macrogrupo:macro,itemOriginal:item});continue}
      const scores=ss.map(s=>score(item,macro,s.text)),mx=Math.max(...scores),roads=[...new Set(ss.map(s=>s.road))];let chosen=mx>0?ss.filter((s,i)=>scores[i]===mx):(roads.length===1?ss:[]);
      if(!chosen.length){corrected.push({...q,rodovias:[],macrogrupo:macro,itemOriginal:item,metodo:'sem_rodovia'});audit.unassigned++;continue}
      const by=new Map();chosen.forEach(s=>{if(!by.has(s.road))by.set(s.road,[]);by.get(s.road).push(s)});const weights=[...by].map(([r,a])=>[r,a.reduce((t,s)=>t+weight(s),0)]),tw=weights.reduce((t,x)=>t+x[1],0)||weights.length;
      for(const[r,w]of weights){const segs=by.get(r),share=amount*w/tw;corrected.push({...q,quantidade:share,rodovias:[r],macrogrupo:macro,itemOriginal:item,metodo:weights.length===1?'direto':'rateio'});for(const s of segs)if(s.km)detail.push({contrato:c,rodovia:r,periodo:q.periodo,servico:item,macrogrupo:macro,itemOriginal:item,kmi:s.km[0],kmf:s.km[1],observacao:s.text})}
      audit[weights.length===1?'direct':'allocated']++;
    }
    globalThis.EXECV15=corrected;globalThis.QTY=corrected;globalThis.DETAIL=detail;
    const sum=(road,macro)=>corrected.filter(x=>String(x.contrato)==='465'&&(x.rodovias||[]).includes(road)&&x.macrogrupo===macro).reduce((t,x)=>t+Number(x.quantidade||0),0);
    const check={horizontal:sum('SP-291','Sinalização horizontal'),vertical:sum('SP-291','Sinalização vertical'),seguranca:sum('SP-291','Dispositivos de segurança viária')};
    if(Math.abs(check.horizontal)>0.001||Math.abs(check.vertical-18.2)>0.001||Math.abs(check.seguranca-3)>0.001)throw new Error('Validação SP-291 falhou: '+JSON.stringify(check));
    refreshFacets();page=1;render();console.info('Vínculo rodovia x serviço v36 corrigido',{registros:corrected.length,detalhes:detail.length,audit,sp291:check});
  }catch(err){console.error('Erro na correção rodovia x serviço v36:',err);const list=document.getElementById('list');if(list)list.innerHTML='<div class="empty">Não foi possível validar o vínculo entre rodovias e serviços.</div>'}
})();
