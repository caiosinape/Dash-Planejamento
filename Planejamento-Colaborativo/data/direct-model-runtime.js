(function(){
  'use strict';

  var nativeFetch=window.fetch.bind(window);
  var dataPromise=null;
  var EXECUTION_PATCH={
    contract:'2465',
    sourceId:'2465-408',
    exec:[3997.5,0,5916.4,0,2840,1600,3524,0,0,0,0,0],
    execValue:[695746.3509013875,0,1029722.0038706614,0,494288.8396647755,278472.58572663413,613335.8700629117,0,0,0,0,0]
  };
  var RDO_DATA=[
    {contract:'2465',month:0,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1450.5,value:252452.80349780177,date:'2026-01-10'},
    {contract:'2465',month:0,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1098,value:191101.81195490266,date:'2026-01-13'},
    {contract:'2465',month:0,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:613.5,value:106776.83208955628,date:'2026-01-15'},
    {contract:'2465',month:0,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:835.5,value:145414.90335912677,date:'2026-01-16'},
    {contract:'2465',month:2,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:750,value:130534.02455935975,date:'2026-03-13'},
    {contract:'2465',month:2,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1418,value:246796.3291002295,date:'2026-03-14'},
    {contract:'2465',month:2,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1380,value:240182.60518922194,date:'2026-03-15'},
    {contract:'2465',month:2,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1178,value:205025.44124123437,date:'2026-03-16'},
    {contract:'2465',month:2,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1190.4,value:207183.6037806158,date:'2026-03-17'},
    {contract:'2465',month:4,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1200,value:208854.4392949756,date:'2026-05-09'},
    {contract:'2465',month:4,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:820,value:142717.2001849,date:'2026-05-11'},
    {contract:'2465',month:4,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:820,value:142717.2001849,date:'2026-05-12'},
    {contract:'2465',month:5,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:400,value:69618.14643165853,date:'2026-06-09'},
    {contract:'2465',month:5,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1200,value:208854.4392949756,date:'2026-06-10'},
    {contract:'2465',month:6,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:1400,value:243663.51251080487,date:'2026-07-16'},
    {contract:'2465',month:6,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:740,value:128793.57089856829,date:'2026-07-17'},
    {contract:'2465',month:6,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:600,value:104427.2196474878,date:'2026-07-20'},
    {contract:'2465',month:6,itemId:'2465-408',observation:'Base BI Executado (2)',service:'Sinal. Horiz. Plast. Frio Base de Res. Metacrílica Reativas, Disp. Estrutura',unit:'m²',quantity:784,value:136451.56700605073,date:'2026-07-21'}
  ];

  function findVarRange(source,name){
    var marker='var '+name+'=',start=source.indexOf(marker);
    if(start<0)throw new Error('Base '+name+' não encontrada');
    var valueStart=start+marker.length,opening=source[valueStart],closing=opening==='{'?'}':']';
    if(opening!=='{'&&opening!=='[')throw new Error('Início inválido da base '+name);
    var depth=0,quoted=false,escaped=false;
    for(var i=valueStart;i<source.length;i++){
      var ch=source[i];
      if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}
      else if(ch==='"')quoted=true;
      else if(ch===opening)depth++;
      else if(ch===closing&&--depth===0)return {start:start,end:i+1};
    }
    throw new Error('Base '+name+' incompleta');
  }

  function replaceVar(source,name,value){
    var range=findVarRange(source,name);
    return source.slice(0,range.start)+'var '+name+'='+JSON.stringify(value)+source.slice(range.end);
  }

  function loadRows(){
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([0,1,2,3,4,5,6,7].map(function(i){
      return nativeFetch('data/direct-overrides.part'+i+'?v=unified20260731',{cache:'no-store'}).then(function(response){
        if(!response.ok)throw new Error('Bloco de planejamento '+i+' indisponível ('+response.status+')');
        return response.text();
      });
    })).then(function(parts){
      var joined=parts.join('').replace(/\s/g,'');
      var binary=atob(joined),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof DecompressionStream==='undefined')throw new Error('Navegador sem suporte à descompactação gzip');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    }).then(function(rows){
      if(!Array.isArray(rows)||rows.length!==650)throw new Error('Base de planejamento divergente: '+(rows&&rows.length));
      return rows;
    });
    return dataPromise;
  }

  function buildContractData(rows){
    var contracts={};
    rows.forEach(function(row){
      var item=Object.assign({},row);
      item.plan=Array.isArray(row.plan)?row.plan.slice(0,12):Array(12).fill(0);
      item.planValue=Array.isArray(row.planValue)?row.planValue.slice(0,12):Array(12).fill(0);
      item.exec=Array.isArray(row.exec)?row.exec.slice(0,12):Array(12).fill(0);
      item.execValue=Array.isArray(row.execValue)?row.execValue.slice(0,12):Array(12).fill(0);
      item.orders=Array.isArray(row.orders)?row.orders.slice(0,12):Array(12).fill('Sem serviços');
      while(item.plan.length<12)item.plan.push(0);
      while(item.planValue.length<12)item.planValue.push(0);
      while(item.exec.length<12)item.exec.push(0);
      while(item.execValue.length<12)item.execValue.push(0);
      while(item.orders.length<12)item.orders.push('Sem serviços');
      if(String(item.contract).indexOf('2465')===0&&String(item.sourceId)==='2465-408'){
        item.exec=EXECUTION_PATCH.exec.slice();
        item.execValue=EXECUTION_PATCH.execValue.slice();
      }
      (contracts[item.contract]||(contracts[item.contract]=[])).push(item);
    });
    var contract2465=Object.keys(contracts).filter(function(k){return k.indexOf('2465')===0;})[0];
    if(!contract2465)throw new Error('Contrato 2465 não encontrado');
    var items2465=contracts[contract2465],plannedItems=items2465.filter(function(i){return Number(i.plan[5]||0)>0;}).length;
    var plannedValue=items2465.reduce(function(sum,i){return sum+Number(i.planValue[5]||0);},0);
    var executedValue=items2465.reduce(function(sum,i){return sum+Number(i.execValue[5]||0);},0);
    if(plannedItems!==18||plannedValue<=0||executedValue<=0)throw new Error('Validação 2465/junho falhou: '+plannedItems+' | '+plannedValue+' | '+executedValue);
    window.__SINAPE_VALIDATION_2465__={plannedItems:plannedItems,plannedValue:plannedValue,executedValue:executedValue};
    return contracts;
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return nativeFetch(input,Object.assign({},options||{},{cache:'no-store'})).then(function(response){
        if(!response.ok)throw new Error('Estrutura visual indisponível ('+response.status+')');
        return response.text();
      }).then(function(source){
        return loadRows().then(function(rows){
          var contracts=buildContractData(rows);
          var merged=replaceVar(source,'contractData',contracts);
          merged=replaceVar(merged,'rdoData',RDO_DATA);
          window.__SINAPE_DATA_READY__=true;
          window.__SINAPE_DATA_ERROR__='';
          document.documentElement.setAttribute('data-sinape-data','ready');
          return new Response(merged,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-DATA':'unified'}});
        });
      }).catch(function(error){
        console.error('[SINAPE] Falha na base unificada:',error);
        window.__SINAPE_DATA_READY__=false;
        window.__SINAPE_DATA_ERROR__=String(error&&error.message||error);
        document.documentElement.setAttribute('data-sinape-data','error');
        throw error;
      });
    }
    return nativeFetch(input,options);
  };

  loadRows().catch(function(error){console.error('[SINAPE] Falha no pré-carregamento:',error);});
})();