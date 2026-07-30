(function(){
  'use strict';

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
      if(!validEmail(value)){
        event.preventDefault();
        if(input){
          input.setCustomValidity('Informe um e-mail valido.');
          input.reportValidity();
          input.setCustomValidity('');
        }
        return;
      }

      setTimeout(function(){
        var gate=document.getElementById('accessGate');
        var stillBlocked=gate&&!gate.hidden&&document.body.classList.contains('access-pending');
        if(stillBlocked)releaseAccess(value);
      },150);
    },false);
  }

  function boot(){
    bind();
    var attempts=0;
    var timer=setInterval(function(){
      bind();
      attempts++;
      if(attempts>=40||document.getElementById('accessForm'))clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
