# Cronogramas Planejamento

Código-fonte do Dashboard Cronograma 2456.

## Funcionalidades

- filtros por mês e Ordem de Serviço;
- planejamento físico-financeiro mensal;
- gráfico de Gantt com janela de três meses;
- lançamentos semanais de quantidade executada;
- fluxo Salvar, Cravar e Editar;
- histórico persistente dos lançamentos;
- consolidação mensal e Planejado × Executado semanal;
- saldo contratual por item após planejamento e após medição;
- visão executiva e operacional.

## Execução local

Requisitos: Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

## Validação

```bash
npm test
```

O planejamento é carregado na aplicação. Os lançamentos executados e seu histórico usam o banco D1 configurado no ambiente de hospedagem. Uma publicação estática no GitHub Pages não oferece as funções de salvar, cravar, editar ou consultar o histórico sem uma infraestrutura de banco e API equivalente.

## Dashboard operacional

A versão operacional permanece hospedada no ChatGPT Sites:

https://dashboard-cronograma-2456.sinape-sinal-4663.chatgpt.site
