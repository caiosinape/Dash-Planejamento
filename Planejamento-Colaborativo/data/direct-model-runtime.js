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
    if(start<0)throw new Error('Base '+name+' nao encontrada');
    var valueStart=start+marker.length;
    var opening=source[valueStart];
    if(opening!=='{'&&opening!=='[')throw new Error('Inicio invalido da base '+name);
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

  function validateArray(row,field){
    var value=row[field];
    if(!Array.isArray(value)||value.length!==12){
      throw new Error('Array '+field+' invalido em '+row.contract+' | '+row.name);
    }
  }

  function validateRows(rows){
    if(!Array.isArray(rows)||rows.length!==650){
      throw new Error('Pacote de dados divergente: '+(rows&&rows.length));
    }
    var ids={};
    rows.forEach(function(row,index){
      if(!row||!row.contract||!row.name)throw new Error('Registro incompleto na posicao '+index);
      ['plan','planValue','exec','execValue','orders'].forEach(function(field){validateArray(row,field);});
      ['price','contractual','base','balance'].forEach(function(field){
        if(!Number.isFinite(Number(row[field]||0)))throw new Error('Valor '+field+' invalido em '+row.contract+' | '+row.name);
      });
      if(row.sourceId){
        var id=String(row.sourceId);
        if(ids[id])throw new Error('sourceId duplicado: '+id);
        ids[id]=true;
      }
    });
    return rows;
  }

  function loadOverrides(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/direct-overrides.part'+i+'?v=fullaudit20260730',{cache:'no-store'})
        .then(function(response){
          if(!response.ok)throw new Error('Bloco de dados '+i+' indisponivel ('+response.status+')');
          return response.text();
        });
    })).then(function(parts){
      var joined=parts.join('').replace(/\s/g,'');
      if(!joined)throw new Error('Pacote de dados vazio');
      var binary=atob(joined);
      var bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof DecompressionStream==='undefined')throw new Error('Navegador sem suporte a descompactacao gzip');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    }).then(validateRows).then(function(rows){
      window.__SINAPE_DATA_ROWS__=rows.length;
      return rows;
    }).catch(function(error){
      dataPromise=null;
      throw error;
    });
    return dataPromise;
  }

  function zeroFuture(values,fill){
    var result=Array.isArray(values)?values.slice(0,12):Array(12).fill(fill);
    while(result.length<12)result.push(fill);
    for(var month=6;month<12;month++)result[month]=fill;
    return result;
  }

  function mergeSource(source,rows){
    if(typeof source!=='string'||source.length<1000)throw new Error('Estrutura-base vazia ou incompleta');
    var contracts=extractVar(source,'contractData');
    var bySource={},byKey={},occurrence={},matched=0,used=[];

    Object.keys(contracts).forEach(function(contract){
      (contracts[contract]||[]).forEach(function(item){
        var entry={item:item,contract:contract};
        if(item.sourceId)bySource[String(item.sourceId)]=entry;
        var key=contract+'|'+normalize(item.name);
        (byKey[key]||(byKey[key]=[])).push(entry);
      });
    });

    rows.forEach(function(row){
      var targetEntry=null;
      if(row.sourceId)targetEntry=bySource[String(row.sourceId)]||null;
      if(!targetEntry){
        var key=row.contract+'|'+normalize(row.name);
        var index=occurrence[key]||0;
        targetEntry=(byKey[key]||[])[index]||null;
        occurrence[key]=index+1;
      }
      if(!targetEntry)throw new Error('Item sem vinculo no HTML: '+row.contract+' | '+row.name);
      if(targetEntry.contract!==row.contract)throw new Error('Contrato divergente para '+row.name);
      if(used.indexOf(targetEntry.item)>=0)throw new Error('Item vinculado mais de uma vez: '+row.contract+' | '+row.name);
      used.push(targetEntry.item);

      var target=targetEntry.item;
      target.sourceId=row.sourceId;
      target.unit=row.unit;
      target.price=Number(row.price||0);
      target.contractual=Number(row.contractual||0);
      target.base=Number(row.base||0);
      target.balance=Number(row.balance||0);
      target.plan=zeroFuture(row.plan,0);
      target.planValue=zeroFuture(row.planValue,0);
      target.exec=zeroFuture(row.exec,0);
      target.execValue=zeroFuture(row.execValue,0);
      target.orders=zeroFuture(row.orders,'Sem serviços');
      matched++;
    });

    if(matched!==650)throw new Error('Itens vinculados divergentes: '+matched);
    var merged=replaceVar(source,'contractData',contracts);
    extractVar(merged,'contractData');
    window.__SINAPE_PLANEJADO_EXECUTADO_SNAPSHOT__={items:matched,monthsWithData:6,futureMonthsZeroed:6,source:'Modelo Cronograma Base de Dados v2.xlsx'};
    return merged;
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return nativeFetch(input,Object.assign({},options||{},{cache:'no-store'})).then(function(response){
        if(!response.ok)throw new Error('Estrutura-base indisponivel ('+response.status+')');
        return response.text();
      }).then(function(source){
        return loadOverrides().then(function(rows){
          var merged=mergeSource(source,rows);
          window.__SINAPE_DATA_READY__=true;
          window.__SINAPE_DATA_ERROR__='';
          document.documentElement.setAttribute('data-sinape-data','ready');
          window.dispatchEvent(new CustomEvent('sinape:data-ready',{detail:{rows:rows.length}}));
          return new Response(merged,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-DATA':'ready','X-SINAPE-SNAPSHOT':'20260731'}});
        }).catch(function(error){
          console.error('[SINAPE] Falha ao aplicar base atualizada:',error);
          window.__SINAPE_DATA_READY__=false;
          window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
          document.documentElement.setAttribute('data-sinape-data','fallback');
          window.dispatchEvent(new CustomEvent('sinape:data-error',{detail:{message:window.__SINAPE_DATA_ERROR__}}));
          return new Response(source,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-DATA':'fallback'}});
        });
      });
    }
    return nativeFetch(input,options);
  };

  loadOverrides().catch(function(error){
    console.error('[SINAPE] Falha no pre-carregamento da base:',error);
    window.__SINAPE_DATA_READY__=false;
    window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
  });
})();
