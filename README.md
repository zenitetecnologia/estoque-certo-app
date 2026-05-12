# Guia de Inicialização: Front-End Estoque-certo (Zenite UI)

Este tutorial orienta a criação e configuração de um projeto React utilizando o framework visual Zenite UI via CDN.

## 1. Pré-requisitos
* Node.js (Versão LTS recomendada).
* VS Code (Visual Studio Code).

## 2. Passo a Passo

**Passo 1: Criar o Projeto**
No terminal (ou terminal do VS Code), execute o comando abaixo para criar a estrutura base do React com Vite (em JavaScript puro):

npm create vite@latest estoque-certo-web -- --template react

**Passo 2: Entrar na Pasta**
Navegue para dentro do diretório criado:

cd estoque-certo-web

**Passo 3: Instalar Dependências**
Instale os pacotes base necessários para o funcionamento do React:

npm install

**Passo 4: Configurar o Framework Zenite**
Como utilizaremos o Zenite UI via CDN, você deve editar o arquivo index.html na raiz do seu projeto. Adicione as linhas de CSS e JS dentro da tag <head>:

<link href="https://cdn.jsdelivr.net/npm/zenite-ui@1.1.4/css/zenite.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/zenite-ui@1.1.4/js/zenite.min.js"></script>

**Passo 5: Estruturar as Páginas**
Substitua o conteúdo do arquivo src/App.jsx pelo código de roteamento com as páginas de Login, Registro, Recuperação de Senha e Dashboard, integrando com os componentes nativos HTML estruturados para o Zenite UI.

**Passo 6: Executar o Projeto em Desenvolvimento**
Para visualizar as alterações em tempo real, utilize o comando:

npm run dev

O Vite disponibilizará um link (ex: http://localhost:5173). Abra-o no seu navegador. O recurso Hot Module Replacement (HMR) atualizará a tela automaticamente a cada salvamento.

**Passo 7: Gerar Build de Produção**
Quando o sistema estiver pronto para ser publicado, gere a versão otimizada:

npm run build

Este comando criará uma pasta chamada "dist", que contém os arquivos finais estáticos (HTML, CSS e JS otimizados) para hospedar no servidor.

## 3. Comandos Úteis no Terminal
* npm install <nome-do-pacote> : Adiciona uma nova biblioteca de terceiros ao projeto.
* npm run dev : Inicia o servidor local com Hot Reload.
* npm run build : Compila o projeto para produção na pasta /dist.
* npm run preview : Testa localmente o resultado exato compilado na pasta /dist.

## 4. Integração com API (Estoque.Server)
O sistema (App.jsx) já está configurado com `fetch` para se comunicar com o back-end C# nas seguintes rotas:
* Login: POST http://localhost:5120/v1/auth/login
* Esqueci Senha (Solicitar): POST http://localhost:5120/v1/auth/forgot
* Esqueci Senha (Verificar): POST http://localhost:5120/v1/auth/verify
* Esqueci Senha (Redefinir): POST http://localhost:5120/v1/auth/reset
* Listar Unidades (Combobox): GET http://localhost:5120/v1/unidades-organizacionais
* Registrar Usuário: POST http://localhost:5120/v1/usuarios