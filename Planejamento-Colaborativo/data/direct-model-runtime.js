(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var dataPromise;
  function normalize(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  }
  function extract(text,name){
    var marker='var '+name+'=',start=text.indexOf(marker);
    if(start<0)throw new Error('Base '+name+' não encontrada');
    start+=marker.length;
    var opening=text[start],closing=opening==='{'?'}':']',depth=0,quoted=false,escaped=false;
    for(var i=start;i<text.length;i++){
      var ch=text[i];
      if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}
      else if(ch==='"')quoted=true;
      else if(ch===opening)depth++;
      else if(ch===closing&&--depth===0)return JSON.parse(text.slice(start,i+1));
    }
    throw new Error('Base '+name+' incompleta');
  }
  function loadData(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/validated-data.part'+i+'?v=validated20260730',{cache:'no-store'}).then(function(response){
        if(!response.ok)throw new Error('Bloco de dados '+i+' indisponível ('+response.status+')');
        return response.text();
      });
    })).then(function(parts){
      var binary=atob(parts.join('').replace(/\s/g,'')),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof DecompressionStream==='undefined')throw new Error('Navegador sem suporte à descompactação da base');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    }).then(function(payload){
      if(!payload||!Array.isArray(payload.overrides)||payload.overrides.length!==650)throw new Error('Pacote de itens divergente');
      if(!Array.isArray(payload.rdoData)||payload.rdoData.length!==18)throw new Error('Pacote de RDO divergente');
      return payload;
    }).catch(function(error){
      window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
      var help=document.querySelector('.access-help');
      if(help)help.textContent='Falha ao carregar os dados vinculados. Atualize a página. Detalhe: '+window.__SINAPE_DATA_ERROR__;
      throw error;
    });
    return dataPromise;
  }
  function mergeSource(source,payload){
    var contracts=extract(source,'contractData'),lookup={},occ={},matched=0;
    Object.keys(contracts).forEach(function(contract){
      (contracts[contract]||[]).forEach(function(item){
        var key=contract+'|'+normalize(item.name);
        (lookup[key]||(lookup[key]=[])).push(item);
      });
    });
    payload.overrides.forEach(function(row){
      var key=row.contract+'|'+normalize(row.name),index=occ[key]||0,target=(lookup[key]||[])[index];
      occ[key]=index+1;
      if(!target)throw new Error('Item sem vínculo no HTML: '+row.contract+' | '+row.name);
      target.sourceId=row.sourceId;
      target.unit=row.unit;
      target.price=Number(row.price||0);
      target.base=Number(row.base||0);
      target.balance=Number(row.balance||0);
      target.contractual=target.base+target.balance;
      target.plan=row.plan.slice();
      target.planValue=row.planValue.slice();
      target.exec=row.exec.slice();
      target.execValue=row.execValue.slice();
      target.orders=row.orders.slice();
      matched++;
    });
    var count=Object.keys(contracts).reduce(function(total,key){return total+(contracts[key]||[]).length;},0);
    if(Object.keys(contracts).length!==15||count!==650||matched!==650)throw new Error('Validação estrutural divergente');
    return 'var contractData='+JSON.stringify(contracts)+';\nvar rdoData='+JSON.stringify(payload.rdoData)+';\nvar modelV2Metadata='+JSON.stringify(payload.metadata)+';\n'+source;
  }
  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return Promise.all([
        nativeFetch(input,Object.assign({},options||{},{cache:'no-store'})).then(function(response){
          if(!response.ok)throw new Error('Estrutura-base indisponível ('+response.status+')');
          return response.text();
        }),
        loadData()
      ]).then(function(values){
        return new Response(mergeSource(values[0],values[1]),{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
      });
    }
    return nativeFetch(input,options);
  };
  loadData();
})();
