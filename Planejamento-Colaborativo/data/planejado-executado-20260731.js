(function(){
  'use strict';
  var previousFetch=window.fetch.bind(window);

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
      else if(ch===closing&&--depth===0)return {start:start,valueStart:valueStart,end:i+1};
    }
    throw new Error('Base '+name+' incompleta');
  }

  function applySnapshot(source){
    var range=findVarRange(source,'contractData');
    var contracts=JSON.parse(source.slice(range.valueStart,range.end));
    var count=0;
    Object.keys(contracts).forEach(function(contract){
      (contracts[contract]||[]).forEach(function(item){
        ['plan','planValue','exec','execValue'].forEach(function(field){
          if(!Array.isArray(item[field]))item[field]=Array(12).fill(0);
          while(item[field].length<12)item[field].push(0);
          for(var month=6;month<12;month++)item[field][month]=0;
        });
        if(!Array.isArray(item.orders))item.orders=Array(12).fill('Sem serviços');
        while(item.orders.length<12)item.orders.push('Sem serviços');
        for(var month=6;month<12;month++)item.orders[month]='Sem serviços';
        count++;
      });
    });
    if(count!==650)throw new Error('Quantidade de itens divergente: '+count);
    window.__SINAPE_PLANEJADO_EXECUTADO_SNAPSHOT__={items:count,monthsWithData:6,futureMonthsZeroed:6,source:'Modelo Cronograma Base de Dados v2.xlsx'};
    return source.slice(0,range.start)+'var contractData='+JSON.stringify(contracts)+source.slice(range.end);
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return previousFetch(input,options).then(function(response){
        return response.text().then(function(source){
          var updated=applySnapshot(source);
          return new Response(updated,{status:response.status,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-SNAPSHOT':'20260731'}});
        });
      });
    }
    return previousFetch(input,options);
  };
})();
