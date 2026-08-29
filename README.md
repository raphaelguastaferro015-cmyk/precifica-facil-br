# 💰 Precifica Fácil

O **Precifica Fácil** é uma aplicação web desenvolvida para auxiliar empreendedores e pequenos negócios na organização de seus produtos, precificação e gestão financeira.

A proposta do sistema é facilitar a tomada de decisões relacionadas aos preços dos produtos, permitindo uma visão mais organizada das informações financeiras do negócio.

🌐 **Aplicação:** https://precifica-facil-br-app.netlify.app/

---

## 🎯 Objetivo do projeto

O principal objetivo do Precifica Fácil é desenvolver uma ferramenta que facilite o processo de precificação e organização financeira de pequenos negócios.

A aplicação foi criada pensando em empreendedores que precisam controlar seus produtos, custos, preços e informações financeiras de maneira mais simples e organizada.

Além de solucionar um problema prático, o projeto teve como objetivo acadêmico aplicar conhecimentos de desenvolvimento de software, organização de código, banco de dados, testes, versionamento e desenvolvimento de aplicações web.

---

## 💡 Problema abordado

A definição do preço de venda de um produto pode ser uma dificuldade para pequenos empreendedores.

Sem uma organização adequada dos custos e das informações financeiras, existe o risco de estabelecer preços que não gerem uma margem de lucro adequada ou que não cubram corretamente os custos envolvidos.

O Precifica Fácil busca facilitar esse processo, centralizando informações importantes em uma aplicação web e permitindo que o usuário tenha uma visão mais organizada de seus produtos e finanças.

---

## 🚀 Funcionalidades

Entre as principais funcionalidades presentes no projeto estão:

- 📦 Cadastro e gerenciamento de produtos;
- 💰 Recursos relacionados à precificação;
- 📊 Dashboard para acompanhamento das informações;
- 💵 Controle de fluxo de caixa;
- 📈 Geração e visualização de relatórios;
- 📋 Planilha inteligente para organização de informações;
- 👤 Gerenciamento de perfil;
- 🤖 Assistente com recursos de inteligência artificial;
- 💳 Área relacionada aos planos e preços da aplicação;
- 🌓 Interface com suporte a diferentes temas;
- 📱 Interface desenvolvida para proporcionar uma experiência intuitiva ao usuário.

---

## 🛠️ Tecnologias utilizadas

### Front-end

- **React** — utilizado para construção da interface da aplicação;
- **TypeScript** — utilizado para desenvolvimento com tipagem estática;
- **Vite** — utilizado como ferramenta de desenvolvimento e build;
- **Tailwind CSS / componentes de interface** — utilizados na construção e estilização da interface;
- **React Router / Wouter** — utilizado para gerenciamento da navegação entre páginas.

### Back-end

- **Node.js** — utilizado na execução do servidor;
- **TypeScript** — utilizado também na implementação do back-end;
- **tRPC** — utilizado para comunicação entre front-end e back-end com segurança de tipos.

### Banco de dados

- **Drizzle ORM** — utilizado para trabalhar com o banco de dados e estruturar as operações relacionadas aos dados;
- **Drizzle Kit** — utilizado para gerenciamento do schema e migrações do banco de dados.

### Testes

- **Vitest** — utilizado para criação e execução de testes automatizados.

### Controle de versão

- **Git** — utilizado para controle de versão do código;
- **GitHub** — utilizado para armazenamento e gerenciamento do repositório do projeto.

### Hospedagem

- **Netlify** — utilizado para publicação da aplicação web.

---

## 📁 Estrutura do projeto

A aplicação está organizada em diferentes diretórios, separando responsabilidades entre as partes do sistema.

```text
precifica-facil/
│
├── client/          # Aplicação front-end
│
├── server/          # Aplicação back-end
│
├── shared/          # Código compartilhado entre front-end e back-end
│
├── drizzle/         # Schema e migrações do banco de dados
│
├── patches/         # Correções e ajustes de dependências
│
├── package.json     # Dependências e scripts do projeto
├── tsconfig.json    # Configurações do TypeScript
├── vite.config.ts   # Configurações do Vite
├── vitest.config.ts # Configurações dos testes
└── README.md        # Documentação do projeto
