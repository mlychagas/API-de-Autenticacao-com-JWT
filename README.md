# 🔐 API de Autenticação com JWT e Refresh Tokens

Módulo de autenticação stateless para uma API REST corporativa utilizando **JSON Web Tokens (JWT)** e **Refresh Token Rotation**.

## 📋 Sumário

- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Arquitetura de Segurança](#arquitetura-de-segurança)
- [Endpoints](#endpoints)
- [Exemplo de Fluxo de Autenticação](#exemplo-de-fluxo-de-autenticação)
- [Usuários Mock Disponíveis](#usuários-mock-disponíveis)
- [Boas Práticas Implementadas](#boas-práticas-implementadas)

---

## 🛠️ Stack Tecnológico

### Dependências Principais

| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **Node.js** | >= 14.x | Plataforma assíncrona orientada a eventos (I/O não bloqueante) |
| **Express.js** | ^4.18.2 | Chassis HTTP robusto com suporte a middlewares granulares |
| **jsonwebtoken** | ^9.1.2 | Biblioteca padrão para forjar e validar tokens HMAC-SHA256 |
| **dotenv** | ^16.3.1 | Gerenciamento seguro de variáveis de ambiente (chaves criptográficas) |

### Dependências de Desenvolvimento

- **nodemon**: ^3.0.2 (auto-restart durante desenvolvimento)

---

## 📁 Estrutura do Projeto

```
autenticacaoComJWT/
├── src/
│   ├── config/
│   │   └── env.config.js          # Carregamento e validação de variáveis de ambiente
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Validação de JWT (The Guard Function)
│   │   └── error.middleware.js    # Tratamento centralizado de erros
│   ├── controllers/
│   │   ├── auth.controller.js     # Lógica de login e refresh
│   │   └── user.controller.js     # Lógica de operações em usuários
│   ├── services/
│   │   └── token.service.js       # Geração, validação e armazenamento de tokens
│   ├── routes/
│   │   ├── auth.routes.js         # Rotas públicas (/auth/login, /auth/refresh)
│   │   └── user.routes.js         # Rotas protegidas (/usuarios)
│   ├── app.js                     # Configuração do Express
│   └── server.js                  # Inicialização do servidor
├── .env                           # Variáveis de ambiente (NÃO comitar)
├── .gitignore                     # Arquivos ignorados
├── package.json                   # Dependências do projeto
├── ARQUITETURA.md                 # Documentação técnica aprofundada
├── GUIA-TESTES.md                 # Guia completo de testes
└── README.md                      # Este arquivo
```

### Responsabilidades de Cada Camada

| Arquivo | Responsabilidade |
|---------|------------------|
| **server.js** | Inicializa o servidor, trata sinais, exceções não capturadas |
| **app.js** | Configura middlewares, rotas e handlers de erro |
| **config/env.config.js** | Carrega e valida variáveis de ambiente |
| **services/token.service.js** | Gera, valida e revoga tokens JWT |
| **middlewares/auth.middleware.js** | Valida JWT e autorização por role |
| **middlewares/error.middleware.js** | Tratamento de erros globais |
| **controllers/auth.controller.js** | Implementa login, refresh, logout |
| **controllers/user.controller.js** | Implementa CRUD com RBAC |
| **routes/auth.routes.js** | Rotas públicas (/auth/*) |
| **routes/user.routes.js** | Rotas protegidas (/usuarios) |

---

## 🚀 Instalação e Configuração

### 1. Clonar ou Navegar para o Diretório

```bash
cd autenticacaoComJWT
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado com valores de exemplo. **Em produção**, gere chaves fortes:

```bash
# Gerar chaves seguras (macOS/Linux)
openssl rand -hex 32

# Gerar chaves seguras (Windows PowerShell)
$bytes = New-Object Byte[] 32; (New-Object Random).NextBytes($bytes); [Convert]::ToHexString($bytes)
```

Atualize o `.env`:

```env
NODE_ENV=development
PORT=3000
JWT_ACCESS_SECRET=<sua_chave_super_forte_64_hex_characters>
JWT_REFRESH_SECRET=<outra_chave_super_forte_64_hex_characters>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### 4. Iniciar o Servidor

**Modo Produção:**

```bash
npm start
```

**Modo Desenvolvimento (com auto-reload):**

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

---

## 🔐 Arquitetura de Segurança

### 1. **Paradigma Stateless**

- Nenhuma sessão armazenada no servidor.
- Validação de autenticação feita via **assinatura criptográfica do JWT**.
- Escalabilidade: múltiplas instâncias podem validar o mesmo token.

### 2. **JWT (JSON Web Tokens)**

- **Access Token**: Token de **curta duração** (15 minutos).
  - Payload minimalista: `{ sub, name, role }`
  - Repassado em cada requisição protegida.
  - Invalidado automaticamente após expiração.

- **Refresh Token**: Token de **longa duração** (7 dias).
  - Armazenado em memória (mock).
  - Permite renovação do Access Token sem fornecer credenciais.
  - Suporta revogação (logout).

### 3. **Token Rotation**

Quando o Refresh Token é utilizado para renovar:

1. O token antigo é **revogado imediatamente**.
2. Um novo par (Access + Refresh) é gerado.
3. **Previne roubo de tokens**: se um token for roubado e usado, gerará um novo par, invalidando o token original.

### 4. **Algoritmo HMAC-SHA256**

- Assinatura digital garante **integridade** do token.
- Impossível falsificar sem a chave secreta.
- Validação instantânea sem acesso a banco de dados.

### 5. **Armazenamento de Secrets**

- Chaves secretas **JAMAIS hardcoded** no repositório.
- Carregadas via `.env` (usar variáveis de ambiente em produção).
- Em produção: usar serviços como AWS Secrets Manager, HashiCorp Vault.

### 6. **Autorização Baseada em Perfil (Role-Based Access Control)**

Cada usuário possui um `role`:

- **admin**: Acesso total
- **moderador**: Acesso restrito a recursos específicos
- **usuario**: Acesso limitado aos próprios dados

---

## 📡 Endpoints

### Rotas Públicas (Sem Autenticação)

#### 1. Health Check

```http
GET /health
```

**Resposta (200):**

```json
{
  "message": "API de Autenticação com JWT - Online",
  "timestamp": "2026-04-17T10:30:00.000Z"
}
```

---

#### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "senha123"
}
```

**Resposta (200):**

```json
{
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "Administrador",
    "role": "admin"
  }
}
```

**Erros:**

- `400 Bad Request`: Email ou senha faltando.
- `401 Unauthorized`: Credenciais incorretas.

---

#### 3. Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**

```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros:**

- `401 Unauthorized`: Token inválido, expirado ou revogado.

---

#### 4. Logout

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### Rotas Protegidas (Requer JWT)

#### 5. Listar Usuários

```http
GET /usuarios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Comportamento por Perfil:**

- **Admin**: Retorna todos os usuários.
- **Moderador**: Retorna usuários do mesmo departamento.
- **Usuário**: Retorna apenas seus próprios dados.

**Resposta (200):**

```json
{
  "message": "Usuários recuperados com sucesso",
  "count": 3,
  "users": [
    {
      "id": "1",
      "name": "Administrador",
      "role": "admin",
      "department": "TI",
      "email": "admin@example.com"
    }
  ]
}
```

**Erros:**

- `401 Unauthorized`: Token não fornecido, inválido ou expirado.

---

#### 6. Obter Perfil Próprio

```http
GET /usuarios/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (200):**

```json
{
  "message": "Dados do usuário recuperados",
  "user": {
    "id": "2",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "usuario",
    "department": "Vendas"
  }
}
```

---

#### 7. Atualizar Perfil

```http
PUT /usuarios/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "João Silva Updated",
  "department": "Marketing"
}
```

**Resposta (200):**

```json
{
  "message": "Perfil atualizado com sucesso",
  "user": {
    "id": "2",
    "email": "user@example.com",
    "name": "João Silva Updated",
    "role": "usuario",
    "department": "Marketing"
  }
}
```

---

#### 8. Excluir Usuário (Admin Only)

```http
DELETE /usuarios/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (200):**

```json
{
  "message": "Usuário excluído com sucesso",
  "user": { ... }
}
```

**Erros:**

- `403 Forbidden`: Usuário não é admin.
- `404 Not Found`: Usuário não encontrado.

---

## 📊 Exemplo de Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE AUTENTICAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

1. Login
   ├─ POST /auth/login
   ├─ { email, password }
   └─ ✓ { accessToken, refreshToken }

2. Requisição Protegida (Access Token válido)
   ├─ GET /usuarios (Authorization: Bearer <accessToken>)
   ├─ Middleware: Validar JWT
   └─ ✓ { usuários }

3. Access Token Expira (após 15 min)
   ├─ GET /usuarios (Authorization: Bearer <expired_accessToken>)
   ├─ ✗ 401 Unauthorized
   └─ Cliente detecta: Access Token expirado

4. Renovação com Refresh Token
   ├─ POST /auth/refresh
   ├─ { refreshToken }
   ├─ Token Rotation:
   │  ├─ Revoga refreshToken antigo
   │  └─ Gera novo par (accessToken + refreshToken)
   └─ ✓ { new_accessToken, new_refreshToken }

5. Requisição com Novo Access Token
   ├─ GET /usuarios (Authorization: Bearer <new_accessToken>)
   └─ ✓ { usuários }

6. Logout
   ├─ POST /auth/logout
   ├─ { refreshToken }
   ├─ Revoga: refreshToken
   └─ ✓ Logout realizado

7. Tentativa de Reutilizar Refresh Token
   ├─ POST /auth/refresh
   ├─ { revoked_refreshToken }
   └─ ✗ 401 Unauthorized (token revogado)
```

---

## 👥 Usuários Mock Disponíveis

| Email | Senha | Role | Departamento |
|-------|-------|------|--------------|
| admin@example.com | senha123 | admin | TI |
| user@example.com | senha456 | usuario | Vendas |
| moderador@example.com | senha789 | moderador | Suporte |

---

## ✅ Boas Práticas Implementadas

### 1. **Segurança**

- ✅ Não armazenar senhas em texto plano (em produção, usar bcrypt).
- ✅ Chaves secretas em variáveis de ambiente.
- ✅ Token Rotation para prevenir roubo.
- ✅ Access Token de curta duração.
- ✅ HMAC-SHA256 para assinatura digital.

### 2. **Arquitetura**

- ✅ Paradigma **Stateless** (sem sessões no servidor).
- ✅ Separação clara: Controllers, Services, Routes.
- ✅ Middlewares reutilizáveis (`checkAuth`, `checkRole`).
- ✅ Tratamento centralizado de erros.

### 3. **Códigos HTTP**

- ✅ `200 OK`: Operação bem-sucedida.
- ✅ `201 Created`: Recurso criado (não aplicável aqui).
- ✅ `400 Bad Request`: Dados inválidos.
- ✅ `401 Unauthorized`: Autenticação falhou.
- ✅ `403 Forbidden`: Autorização falhou.
- ✅ `404 Not Found`: Recurso não encontrado.
- ✅ `500 Internal Server Error`: Erro do servidor.

### 4. **Tratamento de Exceções**

- ✅ Try/catch em todas as funções assíncronas.
- ✅ Erros repassados via `next(err)`.
- ✅ Middleware global de erro não vaza stack trace.

### 5. **Validação de Entrada**

- ✅ Verificação de campos obrigatórios.
- ✅ Formato correto de headers (Bearer <token>).
- ✅ Tipos de dados esperados.

---

## 🧪 Testando a API

### Usando cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'

# 2. Listar usuários (substituir TOKEN)
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer TOKEN"

# 3. Refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"TOKEN"}'
```

### Usando Postman

1. Importar as requisições do arquivo `exemplos-requisicoes.rest`
2. Definir variável `token` com o accessToken retornado no login.
3. Testar cada endpoint.

### Usando VSCode REST Client

Instale a extensão `REST Client`. Veja o arquivo `exemplos-requisicoes.rest`.

---

## 📝 Notas de Produção

1. **Banco de Dados**: Substituir mock de usuários por consultas reais (PostgreSQL, MongoDB, etc.).
2. **Hashing de Senhas**: Usar `bcrypt` para fazer hash de senhas.
3. **Refresh Token Storage**: Usar Redis ou banco de dados em vez de array em memória.
4. **HTTPS**: Usar certificados SSL/TLS em produção.
5. **Rate Limiting**: Implementar rate limiting para endpoints públicos.
6. **Logging**: Usar Winston ou Bunyan para logs estruturados.
7. **Monitoring**: Integrar soluções de APM (New Relic, DataDog).
8. **CORS**: Configurar CORS adequadamente.
9. **2FA**: Implementar autenticação de dois fatores.
10. **Token Blacklist**: Manter whitelist/blacklist de tokens em cache distribuído.

---

## 📚 Referências

- [JWT.io](https://jwt.io)
- [Express.js Documentation](https://expressjs.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ por um Engenheiro de Software Sênior**
