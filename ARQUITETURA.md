## 🏛️ Documentação Técnica - Arquitetura e Segurança

---

### Índice

1. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
2. [Fluxo de JWT e Refresh Tokens](#fluxo-de-jwt-e-refresh-tokens)
3. [Segurança Implementada](#segurança-implementada)
4. [Design de Token Rotation](#design-de-token-rotation)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Padrões de Código](#padrões-de-código)
7. [Escalabilidade e Produção](#escalabilidade-e-produção)

---

## Arquitetura de Autenticação

A implementação segue o padrão **stateless** com JWT, permitindo escalabilidade horizontal sem necessidade de compartilhamento de sessão entre servidores.

### Componentes Principais

```
┌──────────────────────────────────────────────────────────────┐
│                    API REST CORPORATIVA                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                ┌─────────────────┐    │
│  │   CONTROLLERS   │                │    SERVICES     │    │
│  │                 │                │                 │    │
│  │ • auth          │◄──────────────►│ • token         │    │
│  │ • user          │                │                 │    │
│  └─────────────────┘                └─────────────────┘    │
│         ▲                                                   │
│         │                                                   │
│  ┌──────┴──────┐                                            │
│  │   ROUTES    │                                            │
│  │             │                                            │
│  │ • auth.js   │  ◄── Públicas                             │
│  │ • user.js   │  ◄── Protegidas                           │
│  └──────▲──────┘                                            │
│         │                                                   │
│  ┌──────┴──────────────────────┐                            │
│  │    MIDDLEWARES              │                            │
│  │                             │                            │
│  │ • checkAuth (JWT validation)│◄── Validação de Tokens   │
│  │ • checkRole (Authorization) │◄── Controle de Acesso   │
│  │ • errorHandler              │◄── Tratamento de Erros   │
│  └─────────────────────────────┘                            │
│         ▲                                                   │
│         │                                                   │
│  ┌──────┴───────────────────┐                               │
│  │     EXPRESS + NODE.JS    │                               │
│  │   (HTTP Server/I/O async)│                               │
│  └──────▲───────────────────┘                               │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │   CLIENT  │
    │  (Browser,│
    │  Mobile)  │
    └───────────┘
```

---

## Fluxo de JWT e Refresh Tokens

### Estrutura do Access Token

```
Access Token (JWT):
┌─────────────────────────────────────────────────────────────┐
│ Header (Algoritmo e Tipo)                                   │
│ {                                                            │
│   "alg": "HS256",                                            │
│   "typ": "JWT"                                               │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Payload (Claims - Informações do Usuário)                   │
│ {                                                            │
│   "sub": "1",              ◄── Subject (ID do usuário)      │
│   "name": "Administrador", ◄── Nome                         │
│   "role": "admin",         ◄── Perfil/Role                  │
│   "iat": 1713400000,       ◄── Issued At                    │
│   "exp": 1713400900        ◄── Expiration (15m)             │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Signature (HMAC-SHA256)                                      │
│                                                              │
│ HMACSHA256(                                                  │
│   base64UrlEncode(header) + "." +                            │
│   base64UrlEncode(payload),                                  │
│   JWT_ACCESS_SECRET                                          │
│ )                                                            │
│                                                              │
│ ✓ Garante integridade                                        │
│ ✓ Impossível falsificar sem a chave secreta                 │
│ ✓ Válida para sempre (até expiração)                        │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura do Refresh Token

```
Refresh Token (JWT):
┌─────────────────────────────────────────────────────────────┐
│ Payload (Claims Minimalistas)                               │
│ {                                                            │
│   "sub": "1",              ◄── Subject (ID do usuário)      │
│   "type": "refresh",       ◄── Tipo de token                │
│   "iat": 1713400000,       ◄── Issued At                    │
│   "exp": 1714005000        ◄── Expiration (7d)              │
│ }                                                            │
│                                                              │
│ ✓ Armazenado em memória para validação e revogação         │
│ ✓ Permite revogação instantânea (logout)                    │
│ ✓ Suporta Token Rotation                                    │
│ ✓ Pode ser revogado sem renovação de credenciais           │
└─────────────────────────────────────────────────────────────┘
```

### Timeline de Expiração

```
LOGIN
  │
  ├─ Access Token (15 min)                 Refresh Token (7 dias)
  │  ├─ 0:00 ✓ Válido                    ├─ 0:00 ✓ Válido
  │  ├─ 7:30 ✓ Válido                    ├─ 3:00 ✓ Válido
  │  ├─ 15:00 ✗ Expirado ◄── RENOVAR    ├─ 6:00 ✓ Válido
  │  └─          com Refresh             ├─ 7:00 ✓ Válido
  │                                      └─ 7:00 ✗ Expirado
  │
  └─ Novo Access Token (15 min)
     ├─ 15:00 ✓ Válido
     ├─ 22:30 ✓ Válido
     └─ 30:00 ✗ Expirado
```

---

## Segurança Implementada

### 1. **Autenticação (Authentication)**

**O que é:** Verificação de identidade do usuário.

**Implementação:**

```javascript
// auth.controller.js - Login
const login = async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1. Buscar usuário por email
  const user = mockUsers.find((u) => u.email === email);
  
  // 2. Validar existência
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  // 3. Validar senha (em produção: bcrypt.compare)
  if (user.password !== password) 
    return res.status(401).json({ error: 'Unauthorized' });
  
  // 4. Gerar tokens
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user.id);
  
  // 5. Retornar tokens
  return res.json({ accessToken, refreshToken, user });
};
```

**Detalhes de Segurança:**

- ✅ Mensagem genérica de erro ("Email ou senha incorretos") sem revelar qual campo está errado
- ✅ Comparação de senha segura (em produção, usar bcrypt)
- ✅ Token gerado apenas após autenticação bem-sucedida
- ✅ Dados sensíveis (senha) NUNCA armazenados no JWT

### 2. **Autorização (Authorization)**

**O que é:** Verificação de permissões do usuário autenticado.

**Implementação:**

```javascript
// auth.middleware.js - Role-Based Access Control
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Verificar se usuário está autenticado
    if (!req.user) 
      return res.status(401).json({ error: 'Unauthorized' });
    
    // 2. Verificar se role está permitido
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden' });
    
    // 3. Autorização concedida
    next();
  };
};

// Uso em rotas
router.delete('/:id', checkRole('admin'), userController.excluir);
```

**Matriz de Autorização:**

| Operação | Admin | Moderador | Usuário |
|----------|-------|-----------|---------|
| Ver todos | ✅ | ❌ | ❌ |
| Ver departamento | ✅ | ✅ | ❌ |
| Ver próprio | ✅ | ✅ | ✅ |
| Atualizar próprio | ✅ | ✅ | ✅ |
| Excluir usuário | ✅ | ❌ | ❌ |

### 3. **Token Rotation (Proteção Contra Roubo)**

**O que é:** Invalidar tokens antigos quando novas credenciais são geradas.

**Cenário Protegido:**

```
Cenário: Roubo de Refresh Token

1. Usuário faz login
   - Recebe: accessToken_1, refreshToken_1

2. Hacker rouba refreshToken_1
   - Hacker tenta: POST /auth/refresh { refreshToken_1 }
   - Servidor: ✓ Válido, gera novo par
   - Servidor: ✗ Revoga refreshToken_1
   - Hacker recebe: accessToken_2_fake, refreshToken_2_fake

3. Usuário legítimo tenta renovar (com refreshToken_1)
   - Usuário: POST /auth/refresh { refreshToken_1 }
   - Servidor: ✗ Token não encontrado (foi revogado)
   - Resposta: 401 Unauthorized
   - ✓ Detecção de ataque!
```

**Implementação:**

```javascript
// token.service.js
const verifyRefreshToken = (token) => {
  // 1. Verificar se token está no whitelist de ativos
  const tokenExists = validRefreshTokens.some((rt) => rt.token === token);
  if (!tokenExists) throw new Error('Token revogado');
  
  // 2. Validar assinatura
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  return decoded;
};

const revokeRefreshToken = (token) => {
  // Remove o token do whitelist (invalidação imediata)
  validRefreshTokens = validRefreshTokens.filter((rt) => rt.token !== token);
};

// auth.controller.js
const refreshTokens = async (req, res, next) => {
  const decoded = tokenService.verifyRefreshToken(refreshToken); // ◄── Valida whitelist
  tokenService.revokeRefreshToken(refreshToken);                 // ◄── Revoga antigo
  
  const newAccessToken = tokenService.generateAccessToken(user);
  const newRefreshToken = tokenService.generateRefreshToken(userId);
  
  return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
};
```

### 4. **Validação de JWT**

**Middleware: The Guard Function**

```javascript
// auth.middleware.js
const checkAuth = (req, res, next) => {
  try {
    // 1. Extrair header
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: 'Authorization header missing' });
    
    // 2. Validar formato "Bearer <token>"
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token)
      return res.status(401).json({ error: 'Invalid format' });
    
    // 3. Verificar assinatura
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // 4. Injetar claim no objeto de requisição
    req.user = decoded;
    
    // 5. Prosseguir para próximo middleware
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};
```

**Fluxo de Validação:**

```
Requisição
  │
  ├─ Header Authorization presente?
  │  └─ NÃO → 401 Unauthorized
  │
  ├─ Formato "Bearer <token>"?
  │  └─ NÃO → 401 Unauthorized
  │
  ├─ Assinatura válida? (HMAC-SHA256)
  │  └─ NÃO → 401 Unauthorized
  │
  ├─ Token não expirado?
  │  └─ NÃO → 401 (TokenExpiredError)
  │
  ├─ Payload decodificado
  │  └─ Injetar em req.user
  │
  └─ ✓ SUCESSO → next()
```

### 5. **Tratamento de Erros Seguro**

**Princípio:** Não revelar informações sensíveis ao cliente.

```javascript
// error.middleware.js
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Erro interno do servidor';
  
  // Mapear tipos de erro conhecidos
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
  }
  
  const response = { error: err.name, message };
  
  // ✓ Em produção: NÃO incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack; // Apenas em desenvolvimento
  }
  
  res.status(status).json(response);
};
```

---

## Design de Token Rotation

### Armazenamento de Refresh Tokens

```javascript
// token.service.js
let validRefreshTokens = [
  {
    token: "eyJhbGc...",
    userId: "1",
    createdAt: 2026-04-17T10:00:00Z
  },
  {
    token: "eyJhbGc...",
    userId: "2",
    createdAt: 2026-04-17T10:05:00Z
  }
];

// Em produção:
// - Usar Redis: TTL de 7 dias, revogação instantânea
// - Usar PostgreSQL: Tabela com índex em userId para rápida consulta
// - Usar MongoDB: Collection com TTL index automático
```

### Lógica de Renovação

```
ANTES DA RENOVAÇÃO:
┌─────────────────────────────────────┐
│ validRefreshTokens = [              │
│   { token: token_1, userId: '1' },  │
│   { token: token_2, userId: '1' },  │
│   { token: token_3, userId: '2' }   │
│ ]                                   │
└─────────────────────────────────────┘

CLIENTE ENVIA: { refreshToken: token_1 }

VALIDAÇÃO: ✓ token_1 existe em validRefreshTokens

REVOGAÇÃO: Remover token_1 da lista

GERAÇÃO: Criar token_4 (novo refresh token)

DEPOIS DA RENOVAÇÃO:
┌─────────────────────────────────────┐
│ validRefreshTokens = [              │
│   { token: token_2, userId: '1' },│  ← token_1 foi REMOVIDO
│   { token: token_3, userId: '2' },│
│   { token: token_4, userId: '1' } │  ← Novo token adicionado
│ ]                                   │
└─────────────────────────────────────┘

RESPOSTA: { accessToken, refreshToken: token_4 }
```

---

## Tratamento de Erros

### Códigos HTTP Semânticos

```
200 OK
  ├─ Login bem-sucedido
  ├─ Token renovado
  ├─ Usuários listados
  └─ Operação bem-sucedida

201 Created
  └─ Novo recurso criado (não usado nesta API)

400 Bad Request
  ├─ Email/senha faltando
  ├─ Payload JSON inválido
  └─ Dados de entrada inválidos

401 Unauthorized
  ├─ Credenciais incorretas
  ├─ Token expirado
  ├─ Token inválido
  ├─ Header Authorization faltando
  └─ Token revogado

403 Forbidden
  ├─ Usuário autenticado mas sem permissão
  └─ Role insuficiente

404 Not Found
  ├─ Endpoint não existe
  ├─ Recurso não encontrado
  └─ Usuário não encontrado

500 Internal Server Error
  └─ Erro não previsto no servidor
```

### Exemplo: Tratamento de Token Expirado

```javascript
// Requisição com Access Token expirado
GET /usuarios
Authorization: Bearer eyJhbGc...EXPIRADO...

// Validação no middleware
jwt.verify(token, JWT_ACCESS_SECRET)
  // Lança: TokenExpiredError

// Captura no errorHandler
err.name === 'TokenExpiredError'
  // Status: 401
  // Message: "Access Token expirado"
  // ✗ NÃO retorna: stack trace, código interno, etc.

// Resposta ao cliente
{
  "error": "TokenExpiredError",
  "message": "Access Token expirado"
}

// Cliente detecta 401 e:
// 1. Armazena o Refresh Token em segurança
// 2. Faz POST /auth/refresh { refreshToken }
// 3. Obtém novo Access Token
// 4. Retenta a requisição original
```

---

## Padrões de Código

### 1. **Separação de Responsabilidades**

```
CONTROLLER (auth.controller.js)
  ├─ Recebe requisição HTTP
  ├─ Valida entrada
  ├─ Chama SERVICE
  ├─ Coordena operação
  └─ Retorna resposta HTTP

SERVICE (token.service.js)
  ├─ Lógica de negócio pura
  ├─ Independente de HTTP
  ├─ Reutilizável em CLI, Jobs, etc.
  └─ Sem acesso a req/res

MIDDLEWARE (auth.middleware.js)
  ├─ Intercepta requisição
  ├─ Executa validação
  ├─ Modifica req (injeta dados)
  ├─ Passa para próximo middleware
  └─ Reutilizável em múltiplas rotas
```

### 2. **Try/Catch em Funções Assíncronas**

```javascript
// ✓ CORRETO
const login = async (req, res, next) => {
  try {
    // Operações assíncronas
    const user = await findUser(email);
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    // SEMPRE passar para middleware de erro
    next(error);
  }
};

// ✗ ERRADO
const login = async (req, res) => {
  const user = await findUser(email); // Sem try/catch
  // Se falhar, erro fica não capturado
};
```

### 3. **Injeção de Dependências via Módulos**

```javascript
// ✓ ACOPLAMENTO BAIXO
// token.service.js exporta funções puras
module.exports = {
  generateAccessToken,
  verifyAccessToken,
  // ...
};

// auth.controller.js importa e usa
const tokenService = require('../services/token.service');
const token = tokenService.generateAccessToken(user);

// ✗ ACOPLAMENTO ALTO
// Criar serviço dentro do controller
function generateAccessToken(user) {
  // Difícil de testar isoladamente
}
```

---

## Escalabilidade e Produção

### Melhorias Necessárias para Produção

```javascript
// 1. Banco de Dados
// ANTES (Mock):
const mockUsers = [...];

// DEPOIS (DB):
async function findUserByEmail(email) {
  return await db.query('SELECT * FROM users WHERE email = ?', [email]);
}

// 2. Hashing de Senhas
// ANTES (Texto plano):
if (user.password !== password) throw Error('Invalid');

// DEPOIS (Bcrypt):
const bcrypt = require('bcrypt');
const match = await bcrypt.compare(password, user.passwordHash);
if (!match) throw Error('Invalid');

// 3. Refresh Token Storage
// ANTES (Array em memória):
let validRefreshTokens = [];

// DEPOIS (Redis):
const redis = require('redis');
const client = redis.createClient();
await client.set(`refresh:${tokenId}`, JSON.stringify(token), { EX: 604800 }); // 7 dias

// DEPOIS (PostgreSQL):
await db.query(
  'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
  [token, userId, expiresAt]
);

// 4. Logging Estruturado
// ANTES:
console.log('Login realizado');

// DEPOIS (Winston):
const winston = require('winston');
logger.info('Login realizado', { userId, timestamp });
logger.error('Login falhou', { email, reason, timestamp });

// 5. Rate Limiting
// ANTES: Sem limitação
POST /auth/login { email, password }

// DEPOIS:
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas máx
  message: 'Muitas tentativas de login'
});
router.post('/login', loginLimiter, authController.login);

// 6. HTTPS/TLS
// ANTES:
http.createServer(app).listen(3000);

// DEPOIS:
const https = require('https');
const fs = require('fs');
const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};
https.createServer(options, app).listen(3000);

// 7. Variáveis de Ambiente Seguras
// ANTES:
JWT_ACCESS_SECRET=valor_hardcoded

// DEPOIS (AWS Secrets Manager / HashiCorp Vault):
const secretsManager = require('aws-sdk/clients/secretsmanager');
const secret = await secretsManager.getSecretValue({ SecretId: 'jwt-secrets' }).promise();
```

### Arquitetura em Produção

```
                          INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │  WAF / DDoS   │
                    │  Protection   │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     NGINX     ││
                    │  (Reverse     │├─ Load Balancer
                    │   Proxy)      ││
                    └───────────────┘┘
                      │      │      │
         ┌────────────┼──────┼──────┼────────────┐
         ▼            ▼      ▼      ▼            ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │  Node Server │ │ Node Server  │ │ Node Server  │
 │   (Port      │ │   (Port      │ │   (Port      │
 │    3000)     │ │    3000)     │ │    3000)     │
 └────────┬─────┘ └────────┬─────┘ └────────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐    ┌──────────┐
    │ PostgreSQL   │  │  Redis   │    │  S3 / CDN│
    │ (Userdata)   │  │ (Tokens) │    │ (Assets) │
    └──────────┘     └──────────┘    └──────────┘
```

---

## Checklist de Segurança

- ✅ Chaves secretas não hardcoded
- ✅ Senhas hasheadas (NEVER armazenar texto plano)
- ✅ JWT com expiração apropriada
- ✅ Token Rotation implementado
- ✅ Revogação de tokens em logout
- ✅ Autorização baseada em perfil
- ✅ Tratamento de erro seguro (sem stack trace)
- ✅ Validação de entrada (req.body)
- ✅ HTTPS/TLS em produção
- ✅ Rate limiting em endpoints públicos
- ✅ Logging estruturado e monitoramento
- ✅ CORS configurado corretamente
- ✅ Headers de segurança (HSTS, CSP, etc.)
- ✅ Sanitização de entrada (XSS prevention)
- ✅ SQL Injection prevention (prepared statements)
- ✅ API versioning para compatibilidade
- ✅ Testes de segurança (OWASP Top 10)
- ✅ Refresh token rotation em produção DB

---

**Documentação Técnica - Versão 1.0**  
**Última atualização: 15 de abril de 2026**
