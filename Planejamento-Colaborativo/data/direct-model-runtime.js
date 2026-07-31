(function(){
  'use strict';

  function textOf(el){
    return String((el && (el.textContent || el.value)) || '').trim().toLowerCase();
  }

  function findEmail(){
    return document.querySelector('input[type="email"], input[placeholder*="sinape" i], input[name*="email" i]');
  }

  function findContinue(){
    var elements=[].slice.call(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    return elements.find(function(el){ return textOf(el)==='continuar'; }) || null;
  }

  function findGate(){
    var headings=[].slice.call(document.querySelectorAll('h1,h2,h3,strong,div'));
    var heading=headings.find(function(el){ return textOf(el)==='acessar o dashboard'; });
    if(!heading) return null;
    var node=heading;
    while(node && node!==document.body){
      var style=window.getComputedStyle(node);
      if(style.position==='fixed' || (node.offsetWidth>400 && node.offsetHeight>300)){
        return node;
      }
      node=node.parentElement;
    }
    return heading.parentElement;
  }

  function enterDashboard(email){
    email=String(email||'').trim().toLowerCase();
    if(!email) return false;
    try{
      localStorage.setItem('sinape_dashboard_email',email);
      sessionStorage.setItem('sinape_dashboard_email',email);
    }catch(ignore){}

    var gate=findGate();
    if(gate){
      gate.style.setProperty('display','none','important');
      gate.setAttribute('aria-hidden','true');
    }
    document.documentElement.setAttribute('data-dashboard-access','granted');
    document.body.style.overflow='auto';
    window.dispatchEvent(new Event('resize'));
    return true;
  }

  function bindAccess(){
    var email=findEmail();
    var button=findContinue();

    if(button){
      button.type='button';
      button.onclick=function(event){
        if(event) event.preventDefault();
        enterDashboard(email && email.value);
        return false;
      };
    }

    if(email){
      email.addEventListener('keydown',function(event){
        if(event.key==='Enter'){
          event.preventDefault();
          enterDashboard(email.value);
        }
      });
    }

    var saved='';
    try{
      saved=sessionStorage.getItem('sinape_dashboard_email') || localStorage.getItem('sinape_dashboard_email') || '';
    }catch(ignore){}
    if(saved) enterDashboard(saved);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bindAccess,{once:true});
  }else{
    bindAccess();
  }

  /* A base nunca deve bloquear a interface. */
  window.__SINAPE_DATA_READY__=true;
  window.__SINAPE_DATA_ERROR__='';
  document.documentElement.setAttribute('data-sinape-data','fallback-stable');
})();
