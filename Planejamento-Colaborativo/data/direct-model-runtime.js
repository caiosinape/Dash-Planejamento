(function(){
'use strict';

/* Entrada independente: o acesso nao depende da planilha nem da conexao. */
function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
function hideAccessGate(email){
  var normalized=normalizeEmail(email);
  if(normalized){
    try{
      localStorage.setItem('sinape_dashboard_email',normalized);
      sessionStorage.setItem('sinape_dashboard_email',normalized);
    }catch(ignore)