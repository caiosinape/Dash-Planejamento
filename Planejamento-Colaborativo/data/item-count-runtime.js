(function(){
  'use strict';
  var previousFetch=window.fetch.bind(window);
  var plannedTotals=[4288589.97,3721958.32,8551985.44,7007453.64,11338463.85,6771368,0,0,0,0,0,0];
  var executedTotals=[2505164.99,5600261.94,9272194.70,7991701.96,10776812.48,2778985.85,0,0,0,0,0,0];
  var scheduled=false;

  function replaceCountFunction(source){
    var start=source.indexOf('function ce(){');
    var end=source.indexOf('function le(',start);
    if(start>=0&&end>start){
      var replacement='function ce(){var e=V();return oe(!0).filter(function(t){if(c<0)return t.plan.some(function(v){return Number(v||0)>0})||t.exec.some(function(v){return Number(v||0)>0});return Number(t.plan[e]||0)>0||Number(t.exec[e]||0)>0})}';
      source=source.slice(0,start)+replacement+source.slice(end);
    }
    source=source.replace('"Todas"!==s&&n.orders.indexOf(p)<0','"Todas"!==s&&n.orders.indexOf(s)<0');
    var xe='function xe(){';
    var pos=source.indexOf(xe);
    if(pos>=0){
      var inject='function xe(){(function(){var sel=document.getElementById("osFilter");if(!sel)return;var current=sel.value||"Todas",values=[];q.forEach(function(item){if(m&&R(item)!==m)return;var months=c<0?item.orders:[item.orders[V()]];months.forEach(function(order){order=String(order||"").trim();if(order&&order!=="Sem serviços"&&values.indexOf(order)<0)values.push(order)})});sel.innerHTML="<option value=\"Todas\">Todas</option>"+values.map(function(v){return "<option value=\""+D(v)+"\">"+D(v)+"</option>"}).join("");sel.value=values.indexOf(current)>=0?current:"Todas";s=sel.value})();';
      source=source.slice(0,pos)+inject+source.slice(pos+xe.length);
    }
    return source;
  }

  window.fetch=function(input,options){
    var url=String(input&&input.url||input);
    if(url.indexOf('Cronogramas%20Planejamento/index.html')>=0||url.indexOf('Cronogramas Planejamento/index.html')>=0){
      return previousFetch(input,options).then(function(response){
        return response.text().then(function(source){
          return new Response(replaceCountFunction(source),{status:response.status,headers:{'Content-Type':'text/html; charset=utf-8','X-SINAPE-LINKS':'items-orders'}});
        });
      });
    }
    return previousFetch(input,options);
  };

  function compact(value){var f=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});if(Math.abs(value)>=1000000)return 'R$ '+f.format(value/1000000)+' mi';if(Math.abs(value)>=1000)return 'R$ '+f.format(value/1000)+' mil';return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(value)}
  function refreshGeneral(){
    var contract=document.getElementById('contractFilter'),item=document.getElementById('itemFilter'),month=document.getElementById('monthFilter'),status=document.getElementById('statusFilter'),order=document.getElementById('osFilter');
    if(!contract||!month||contract.value!=='__ALL_CONTRACTS__'||(item&&item.value)||(status&&status.value)||(order&&order.value!=='Todas'))return;
    var index=Number(month.value),planned=index<0?plannedTotals.reduce(function(a,b){return a+b},0):(plannedTotals[index]||0),executed=index<0?executedTotals.reduce(function(a,b){return a+b},0):(executedTotals[index]||0);
    var cards=document.querySelectorAll('#cards .card');if(cards.length<2)return;
    var p=cards[0].querySelector('strong'),e=cards[1].querySelector('strong');if(p)p.textContent=compact(planned);if(e)e.textContent=compact(executed);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;refreshGeneral()})}
  function boot(){document.addEventListener('change',schedule,true);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});var n=0,t=setInterval(function(){schedule();if(++n>80)clearInterval(t)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
