(function(){
  'use strict';

  var plannedTotals=[4288589.97,3721958.32,8551985.44,7007453.64,11338463.85,6771368,0,0,0,0,0,0];
  var executedTotals=[2505164.99,5600261.94,9272194.70,7991701.96,10776812.48,2778985.85,0,0,0,0,0,0];
  var initialMonthApplied=false;
  var updateScheduled=false;

  function fallbackLogo(){
    var logo=document.getElementById('accessLogo');
    if(!logo)return;
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90" viewBox="0 0 180 90"><rect width="180" height="90" rx="12" fill="white"/><text x="90" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#0b5870">SINAPE</text><text x="90" y="61" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#315c70">Sinalizacao</text></svg>';
    logo.onerror=null;
    logo.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }

  function validEmail(value){return /^\S+@\S+\.\S+$/.test(value);}

  function roleFor(value){
    var editors=['caio.garcia@sinape.com.br','lucas.oliveira@sinape.com.br','jaqueline.ramalho@sinape.com.br'];
    if(editors.indexOf(value)>=0)return 'Edicao mensal e causas/acoes';
    if(value==='davi.braz@sinape.com.br')return 'Edicao do planejamento semanal';
    return 'Somente visualizacao';
  }

  function releaseAccess(value){
    try{sessionStorage.setItem('sinape:planning:access-email:v1',value);}catch(error){}
    var gate=document.getElementById('accessGate');
    if(gate)gate.hidden=true;
    document.body.classList.remove('access-pending');
    var session=document.getElementById('accessSession');
    if(session)session.hidden=false;
    var output=document.getElementById('accessSessionEmail');
    if(output)output.textContent=value;
    var role=document.getElementById('accessSessionRole');
    if(role)role.textContent=roleFor(value);
    document.documentElement.setAttribute('data-sinape-access','ready');
  }

  function compactCurrency(value){
    var formatter=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
    if(Math.abs(value)>=1000000)return 'R$ '+formatter.format(value/1000000)+' mi';
    if(Math.abs(value)>=1000)return 'R$ '+formatter.format(value/1000)+' mil';
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(value);
  }

  function isGeneralView(){
    var contract=document.getElementById('contractFilter');
    var item=document.getElementById('itemFilter');
    var status=document.getElementById('statusFilter');
    var order=document.getElementById('osFilter');
    return !!contract&&contract.value==='__ALL_CONTRACTS__'&&(!item||!item.value)&&(!status||!status.value)&&(!order||order.value==='Todas');
  }

  function applyInitialMonth(){
    if(initialMonthApplied)return;
    var month=document.getElementById('monthFilter');
    if(!month||!month.options.length)return;
    initialMonthApplied=true;
    month.value='5';
    month.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function updateCards(){
    if(!isGeneralView())return;
    var month=document.getElementById('monthFilter');
    var cards=document.querySelectorAll('#cards .card');
    if(!month||cards.length<2)return;
    var index=Number(month.value);
    if(index<0)return;
    var planned=plannedTotals[index]||0;
    var executed=executedTotals[index]||0;
    var plannedValue=cards[0].querySelector('strong');
    var executedValue=cards[1].querySelector('strong');
    if(plannedValue&&plannedValue.textContent!==compactCurrency(planned))plannedValue.textContent=compactCurrency(planned);
    if(executedValue&&executedValue.textContent!==compactCurrency(executed))executedValue.textContent=compactCurrency(executed);
  }

  function updateAnnualChart(){
    if(!isGeneralView())return;
    var groups=document.querySelectorAll('#monthChart .bar-group');
    if(groups.length!==12)return;
    var max=Math.max.apply(null,plannedTotals.concat(executedTotals).concat([1]));
    groups.forEach(function(group,index){
      var plan=group.querySelector('.bar.plan');
      var done=group.querySelector('.bar.done');
      var small=group.querySelector('small');
      if(plan)plan.style.height=(plannedTotals[index]/max*100)+'%';
      if(done)done.style.height=(executedTotals[index]/max*100)+'%';
      if(small)small.textContent=plannedTotals[index]?compactCurrency(plannedTotals[index]).replace('R$ ',''):'—';
    });
  }

  function updateWeeklyChart(){
    if(!isGeneralView())return;
    var month=document.getElementById('monthFilter');
    var weeks=document.querySelectorAll('#weeklyChart .week');
    if(!month||!weeks.length)return;
    var index=Number(month.value);
    if(index<0)return;
    var planned=plannedTotals[index]||0;
    var executed=executedTotals[index]||0;
    var totalDays=0;
    var days=[];
    weeks.forEach(function(week){
      var title=week.querySelector('strong');
      var match=title&&title.textContent.match(/(\d+)–(\d+)/);
      var count=match?Math.max(1,Number(match[2])-Number(match[1])+1):1;
      days.push(count);totalDays+=count;
    });
    var max=Math.max(planned,executed,1)/Math.max(totalDays,1);
    weeks.forEach(function(week,i){
      var share=days[i]/Math.max(totalDays,1);
      var p=planned*share,e=executed*share;
      var planBar=week.querySelector('.wp');
      var doneBar=week.querySelector('.we');
      var labels=week.querySelectorAll('small');
      if(planBar)planBar.style.height=(p/max*100)+'%';
      if(doneBar)doneBar.style.height=(e/max*100)+'%';
      if(labels[0])labels[0].textContent='Plan. '+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(p);
      if(labels[1])labels[1].textContent='Exec. '+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(e);
    });
  }

  function refreshFinancialView(){
    applyInitialMonth();
    updateCards();
    updateAnnualChart();
    updateWeeklyChart();
  }

  function scheduleRefresh(){
    if(updateScheduled)return;
    updateScheduled=true;
    requestAnimationFrame(function(){updateScheduled=false;refreshFinancialView();});
  }

  function bind(){
    var logo=document.getElementById('accessLogo');
    if(logo){
      logo.addEventListener('error',fallbackLogo,{once:true});
      if(!logo.getAttribute('src')||(logo.complete&&logo.naturalWidth===0))fallbackLogo();
    }

    var form=document.getElementById('accessForm');
    if(!form||form.dataset.failsafeBound==='1')return;
    form.dataset.failsafeBound='1';

    form.addEventListener('submit',function(event){
      var input=document.getElementById('accessEmail');
      var value=String(input&&input.value||'').trim().toLowerCase();
      event.preventDefault();
      event.stopImmediatePropagation();

      if(!validEmail(value)){
        if(input){
          input.setCustomValidity('Informe um e-mail valido.');
          input.reportValidity();
          input.setCustomValidity('');
        }
        return;
      }

      releaseAccess(value);

      var primary=form.onsubmit;
      if(typeof primary==='function'){
        try{
          primary.call(form,{preventDefault:function(){},currentTarget:form,target:form});
        }catch(error){
          console.error('[SINAPE] Falha no manipulador principal de acesso:',error);
        }
      }
      scheduleRefresh();
    },true);
  }

  function boot(){
    bind();
    var stored='';
    try{stored=String(sessionStorage.getItem('sinape:planning:access-email:v1')||'').trim().toLowerCase();}catch(error){}
    if(validEmail(stored))releaseAccess(stored);
    var attempts=0;
    var timer=setInterval(function(){
      bind();
      scheduleRefresh();
      attempts++;
      if(attempts>=80)clearInterval(timer);
    },250);
    new MutationObserver(scheduleRefresh).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('change',scheduleRefresh,true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
