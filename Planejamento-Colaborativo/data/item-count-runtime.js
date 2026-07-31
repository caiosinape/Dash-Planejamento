(function(){
  'use strict';
  var previousFetch=window.fetch.bind(window);

  function replaceCountFunction(source){
    var start=source.indexOf('function ce(){');
    var end=source.indexOf('function le(',start);
    if(start<0||end<0)return source;
    var replacement='function ce(){var e=V();return oe(!0).filter(function(t){if(c<0)return t.plan.some(function(v){return Number(v||0)>0})||t.exec.some(function(v){return Number(v||0)>0});return Number(t.plan[e]||0)>0||Number(t.exec[e]||0)>0})}';
    return source.slice(0,start)+replacement+source.slice(end);
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return previousFetch(input,options).then(function(response){
        return response.text().then(function(source){
          return new Response(replaceCountFunction(source),{status:response.status,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-ITEM-COUNT':'planned-or-executed'}});
        });
      });
    }
    return previousFetch(input,options);
  };
})();
