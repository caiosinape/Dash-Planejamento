(function(){
  var nativeFetch=window.fetch.bind(window);
  var dataPromise=null;
  function normalize(value){return String(value||'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ')}
  function extract(text,name){
    var marker='var '+name+'=',start=text.indexOf(marker);
    if(start<0)throw new Error('Base '+name+' não encontrada');
    start+=marker.length;
    var opening=text[start],closing=opening==='{'?'}':']',depth=0,quoted=false,escaped=false;
    for(var i=start;i<text.length;i++){
      var ch=text[i];
      if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false}
      else if(ch==='"')quoted=true;
      else if(ch===opening)depth++;
      else if(ch===closing&&--depth===0)return JSON.parse(text.slice(start,i+1));
    }
    throw new Error('Base '+name+' incompleta');
  }
  function loadOverrides(){
    if(!dataPromise)dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/direct-overrides.part'+i+'?v=direct20260729',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Falha no bloco '+i);return r.text()})
    })).then(function(parts){
      var binary=atob(parts.join('').trim()),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    });
    return dataPromise;
  }
  function merge(source,overrides){
    var contracts=extract(source,'contractData'),lookup={},occ={};
    Object.keys(contracts).forEach(function(contract){(contracts[contract]||[]).forEach(function(row){var key=contract+'|'+normalize(row.name);(lookup[key]||(lookup[key]=[])).push(row)})});
    overrides.forEach(function(row){
      var key=row.contract+'|'+normalize(row.name),index=occ[key]||0,target=(lookup[key]||[])[index];occ[key]=index+1;
      if(!target)throw new Error('Item sem vínculo: '+row.contract+' | '+row.name);
      target.price=Number(row.price||0);target.balance=Number(row.balance||0);target.base=Number(row.base||0);target.contractual=target.base+target.balance;
      target.plan=row.plan;target.planValue=row.planValue;target.exec=row.exec;target.execValue=row.execValue;if(row.orders)target.orders=row.orders;
    });
    var count=Object.keys(contracts).reduce(function(total,key){return total+contracts[key].length},0);
    if(Object.keys(contracts).length!==15||count!==650||overrides.length!==650)throw new Error('Validação estrutural divergente');
    return 'var contractData='+JSON.stringify(contracts)+';\nvar rdoData=[];\nvar modelV2Metadata='+JSON.stringify({source:'Modelo Cronograma Base de Dados  v2.xlsx enviada diretamente',sheet:'Planilha1',contracts:15,items:650,rdoRecords:0,externalExecutedSource:false})+';\n'+source;
  }
  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return Promise.all([nativeFetch(input,options).then(function(r){if(!r.ok)throw new Error('Falha ao carregar estrutura do painel');return r.text()}),loadOverrides()]).then(function(values){return new Response(merge(values[0],values[1]),{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})})
    }
    return nativeFetch(input,options)
  };
  function installAccess(){
    var form=document.getElementById('accessForm'),gate=document.getElementById('accessGate'),email=document.getElementById('accessEmail'),session=document.getElementById('accessSession');
    if(!form||form.dataset.directAccessReady)return;
    form.dataset.directAccessReady='1';
    form.addEventListener('submit',function(event){
      event.preventDefault();var value=String(email.value||'').trim().toLowerCase();if(!value||value.indexOf('@')<1)return;
      try{sessionStorage.setItem('sinape:planning:access-email:v1',value)}catch(error){}
      gate.hidden=true;document.body.classList.remove('access-pending');
      if(session){session.hidden=false;var output=document.getElementById('accessSessionEmail');if(output)output.textContent=value}
    });
    setTimeout(function(){if(gate&&!gate.hidden&&email)email.focus()},0)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installAccess);else installAccess();
  loadOverrides().catch(function(error){var help=document.querySelector('.access-help');if(help)help.textContent='Não foi possível carregar os dados. Atualize a página. Detalhe: '+error.message});
})();
