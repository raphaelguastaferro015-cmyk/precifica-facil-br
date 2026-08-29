# Precifica Fácil — TODO

## Banco de Dados & Backend
- [x] Schema: tabela products (id, userId, name, category, supplier, cost, suggestedPrice, createdAt, updatedAt)
- [x] Schema: tabela priceHistory (id, productId, price, createdAt)
- [x] Schema: tabela cashFlowEntries (id, userId, type, category, description, amount, date, createdAt)
- [x] Schema: tabela smartSheetRows (id, userId, productName, cost, price, taxes, freight, ads, createdAt, updatedAt)
- [x] Migração e aplicação do schema no banco
- [x] Router: products (list, create, update, delete, priceHistory)
- [x] Router: pricing (calculate — custo, margem, impostos, frete, ads → lucro, margem%, preço ideal)
- [x] Router: cashFlow (list, create, delete, summary)
- [x] Router: smartSheet (list, create, update, delete, duplicate)
- [x] Router: reports (profitByProduct, cashFlowByMonth, marginByCategory)
- [x] Router: ai (chat com contexto dos dados do usuário via LLM)
- [x] Router: dashboard (summary — lucro total, receita, despesas, margem média)

## Frontend — Design System & Layout
- [x] Tema dark premium verde neon em index.css (variáveis CSS, paleta, fontes)
- [x] Fonte Inter/Space Grotesk via Google Fonts (index.html)
- [x] Sidebar fixa com navegação entre módulos (AppLayout.tsx)
- [x] Layout responsivo (mobile + desktop)
- [x] App.tsx com rotas protegidas e AppLayout

## Módulos de Página
- [x] Dashboard: cards KPI (lucro, receita, despesas, margem), gráfico de evolução, alertas inteligentes
- [x] Precificação: calculadora com inputs (custo, margem, impostos, frete, ads) e outputs (lucro, preço ideal, break-even)
- [x] Produtos: listagem, cadastro, edição, exclusão, detalhamento expandível
- [x] Fluxo de Caixa: lançamentos, saldo atual, tabela de entradas/saídas
- [x] Planilha Inteligente: tabela editável inline, cores automáticas (verde/vermelho), duplicar linha
- [x] Relatórios: gráficos de lucro por produto, evolução financeira, margem por categoria
- [x] Assistente IA: chat integrado com contexto dos dados do usuário
- [x] Perfil do usuário: dados da conta, logout
- [x] Landing page para usuários não autenticados

## Qualidade
- [x] Testes vitest para routers principais (9 testes passando)
- [x] Estados de loading, empty e error em todas as páginas
- [x] Responsividade validada em mobile


## Segurança & Autenticação (Melhorias)
- [x] Landing page com abas: Login e Criar Conta
- [x] Formulário de Signup com validação de email e senha forte
- [x] Formulário de Login com email/senha e opção OAuth
- [x] Integração com backend para criar conta local (email/senha)
- [x] Validação de senha (mínimo 8 caracteres, maiúscula, número, símbolo)
- [x] Feedback visual de força da senha
- [x] Testes de segurança para routers de auth
