(function(){
  'use strict';

  var nativeFetch=window.fetch.bind(window);
  var dataPromise=null;

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,' ')
      .trim()
      .replace(/\s+/g,' ');
  }

  function findVarRange(source,name){
    var marker='var '+name+'=';
    var start=source.indexOf(marker);
    if(start<0)throw new Error('Base '+name+' não encontrada');
    var valueStart=start+marker.length;
    var opening=source[valueStart];
    var closing=opening==='{'?'}':']';
    var depth=0,quoted=false,escaped=false;
    for(var i=valueStart;i<source.length;i++){
      var ch=source[i];
      if(quoted){
        if(escaped)escaped=false;
        else if(ch==='\\')escaped=true;
        else if(ch==='"')quoted=false;
      }else if(ch==='"')quoted=true;
      else if(ch===opening)depth++;
      else if(ch===closing&&--depth===0){
        return {start:start,valueStart:valueStart,end:i+1};
      }
    }
    throw new Error('Base '+name+' incompleta');
  }

  function extractVar(source,name){
    var range=findVarRange(source,name);
    return JSON.parse(source.slice(range.valueStart,range.end));
  }

  function replaceVar(source,name,value){
    var range=findVarRange(source,name);
    return source.slice(0,range.start)+'var '+name+'='+JSON.stringify(value)+source.slice(range.end);
  }

  function loadOverrides(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/direct-overrides.part'+i+'?v=resilient20260730',{cache:'no-store'})
        .then(function(response){
          if(!response.ok)throw new Error('Bloco de dados '+i+' indisponível ('+response.status+')');
          return response.text();
        });
    })).then(function(parts){
      var joined=parts.join('').replace(/\s/g,'');
      var binary=atob(joined);
      var bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof DecompressionStream==='undefined')throw new Error('Navegador sem suporte à descompactação da base');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    }).then(function(rows){
      if(!Array.isArray(rows)||rows.length!==650)throw new Error('Pacote de dados divergente: '+(rows&&rows.length));
      return rows;
    });
    return dataPromise;
  }

  function mergeSource(source,rows){
    var contracts=extractVar(source,'contractData');
    var lookup={},occurrence={},matched=0;

    Object.keys(contracts).forEach(function(contract){
      (contracts[contract]||[]).forEach(function(item){
        var key=contract+'|'+normalize(item.name);
        (lookup[key]||(lookup[key]=[])).push(item);
      });
    });

    rows.forEach(function(row){
      var key=row.contract+'|'+normalize(row.name);
      var index=occurrence[key]||0;
      var target=(lookup[key]||[])[index];
      occurrence[key]=index+1;
      if(!target)throw new Error('Item sem vínculo no HTML: '+row.contract+' | '+row.name);

      target.sourceId=row.sourceId;
      target.unit=row.unit;
      target.price=Number(row.price||0);
      target.base=Number(row.base||0);
      target.balance=Number(row.balance||0);
      target.contractual=Number(row.base||0)+Number(row.balance||0);
      target.plan=(row.plan||[]).slice();
      target.planValue=(row.planValue||[]).slice();
      target.exec=(row.exec||[]).slice();
      target.execValue=(row.execValue||[]).slice();
      target.orders=(row.orders||[]).slice();
      matched++;
    });

    if(matched!==650)throw new Error('Itens vinculados divergentes: '+matched);
    return replaceVar(source,'contractData',contracts);
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return nativeFetch(input,Object.assign({},options||{},{cache:'no-store'})).then(function(response){
        if(!response.ok)throw new Error('Estrutura-base indisponível ('+response.status+')');
        return response.text();
      }).then(function(source){
        return loadOverrides().then(function(rows){
          var merged=mergeSource(source,rows);
          return new Response(merged,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
        }).catch(function(error){
          console.error('[SINAPE] Falha ao aplicar base atualizada:',error);
          window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
          return new Response(source,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
        });
      });
    }
    return nativeFetch(input,options);
  };

  loadOverrides().catch(function(error){
    console.error('[SINAPE] Falha no pré-carregamento da base:',error);
  });
})();
