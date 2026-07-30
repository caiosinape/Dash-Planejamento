(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var dataPromise;
  var RDO_DATA=[{"contract":"2465","contractKey":"2465 - DER SP","month":0,"date":"10/01/2026","observation":"10/01/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1450.5,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":0,"date":"13/01/2026","observation":"13/01/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1098,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":0,"date":"15/01/2026","observation":"15/01/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":613.5,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":0,"date":"16/01/2026","observation":"16/01/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":835.5,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":2,"date":"13/03/2026","observation":"13/03/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":750,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":2,"date":"14/03/2026","observation":"14/03/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1418,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":2,"date":"15/03/2026","observation":"15/03/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1380,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":2,"date":"16/03/2026","observation":"16/03/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1178,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":2,"date":"17/03/2026","observation":"17/03/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1190.4,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":4,"date":"09/05/2026","observation":"09/05/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1200,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":4,"date":"11/05/2026","observation":"11/05/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":820,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":4,"date":"12/05/2026","observation":"12/05/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":820,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":5,"date":"09/06/2026","observation":"09/06/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":400,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":5,"date":"10/06/2026","observation":"10/06/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1200,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":6,"date":"16/07/2026","observation":"16/07/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":1400,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":6,"date":"17/07/2026","observation":"17/07/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":740,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":6,"date":"20/07/2026","observation":"20/07/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":600,"unit":"m²"},{"contract":"2465","contractKey":"2465 - DER SP","month":6,"date":"21/07/2026","observation":"21/07/2026","service":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","itemId":"Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura","quantity":784,"unit":"m²"}];
  var EXPECTED_PLANNED=[4288589.97,3721958.32,8551985.44,7007453.64,11338463.85,6771368.00];
  var EXPECTED_EXECUTED=[2505164.99,5600261.94,9272194.70,7991701.96,10776812.48,2778985.85];
  function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
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
  function total(rows,field,month){return rows.reduce(function(sum,row){return sum+Number((row[field]||[])[month]||0);},0);}
  function assertClose(actual,expected,label){if(Math.abs(actual-expected)>0.51)throw new Error(label+' divergente: '+actual+' / '+expected);}
  function loadOverrides(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/direct-overrides.part'+i+'?v=validated20260730',{cache:'no-store'}).then(function(response){
        if(!response.ok)throw new Error('Bloco de dados '+i+' indisponível ('+response.status+')');
        return response.text();
      });
    })).then(function(parts){
      var binary=atob(parts.join('').replace(/\s/g,'')),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof DecompressionStream==='undefined')throw new Error('Navegador sem suporte à descompactação da base');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    }).then(function(rows){
      if(!Array.isArray(rows)||rows.length!==650)throw new Error('Pacote de itens divergente: '+(rows&&rows.length));
      for(var month=0;month<6;month++){
        assertClose(total(rows,'planValue',month),EXPECTED_PLANNED[month],'Planejado '+month);
        assertClose(total(rows,'execValue',month),EXPECTED_EXECUTED[month],'Executado '+month);
      }
      var balances=rows.filter(function(row){return Math.abs(Number(row.balance||0))>1e-12;}).length;
      if(balances!==557)throw new Error('Quantidade de saldos divergente: '+balances);
      return rows;
    }).catch(function(error){
      window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
      var help=document.querySelector('.access-help');
      if(help)help.textContent='Falha ao carregar os dados vinculados. Atualize a página. Detalhe: '+window.__SINAPE_DATA_ERROR__;
      throw error;
    });
    return dataPromise;
  }
  function mergeSource(source,rows){
    var contracts=extract(source,'contractData'),lookup={},occ={},matched=0;
    Object.keys(contracts).forEach(function(contract){
      (contracts[contract]||[]).forEach(function(item){
        var key=contract+'|'+normalize(item.name);
        (lookup[key]||(lookup[key]=[])).push(item);
      });
    });
    rows.forEach(function(row){
      var key=row.contract+'|'+normalize(row.name),index=occ[key]||0,target=(lookup[key]||[])[index];
      occ[key]=index+1;
      if(!target)throw new Error('Item sem vínculo no HTML: '+row.contract+' | '+row.name);
      target.sourceId=row.sourceId;
      target.unit=row.unit;
      target.price=Number(row.price||0);
      target.base=Number(row.base||0);
      target.balance=Number(row.balance||0);
      target.contractual=target.base+target.balance;
      target.plan=(row.plan||[]).slice();
      target.planValue=(row.planValue||[]).slice();
      target.exec=(row.exec||[]).slice();
      target.execValue=(row.execValue||[]).slice();
      target.orders=(row.orders||[]).slice();
      matched++;
    });
    var count=Object.keys(contracts).reduce(function(sum,key){return sum+(contracts[key]||[]).length;},0);
    if(Object.keys(contracts).length!==15||count!==650||matched!==650)throw new Error('Validação estrutural divergente');
    var metadata={source:'Modelo Cronograma Base de Dados  v2.xlsx',sheet:'Planilha1',contracts:15,items:650,rdoRecords:RDO_DATA.length,historicalPlanQuantity:'Qnt Realis.',historicalPlanValue:'R$ Realista',historicalExecQuantity:'Qtd. Executada',historicalExecValue:'R$ Executado',unitPriceColumn:'Preço Unit',balanceColumn:'Quant. Total JULHO 2026',futurePlanValueRule:'quantidade inserida no HTML × Preço Unit',rdoSource:'Estudo Geral.xlsx / Base BI Executado (2)',rdoFinancialValue:false,validatedAt:'2026-07-30T15:55:00-03:00'};
    return 'var contractData='+JSON.stringify(contracts)+';\nvar rdoData='+JSON.stringify(RDO_DATA)+';\nvar modelV2Metadata='+JSON.stringify(metadata)+';\n'+source;
  }
  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return Promise.all([
        nativeFetch(input,Object.assign({},options||{},{cache:'no-store'})).then(function(response){
          if(!response.ok)throw new Error('Estrutura-base indisponível ('+response.status+')');
          return response.text();
        }),
        loadOverrides()
      ]).then(function(values){return new Response(mergeSource(values[0],values[1]),{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});});
    }
    return nativeFetch(input,options);
  };
  loadOverrides();
})();
