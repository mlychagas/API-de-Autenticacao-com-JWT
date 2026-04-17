# 🧪 Guia de Testes e Validação

Instruções passo-a-passo para testar a API de autenticação com JWT.

## Pré-requisitos

- Node.js >= 14.x instalado
- npm ou yarn
- Postman, cURL, ou VSCode REST Client

---

## 1️⃣ Configuração Inicial

### Passo 1: Instalar Dependências

```bash
npm install
```

Você verá a instalação de:

```
npm WARN read-use-caution
npm notice created a lockfile as package-lock.json
added 50 packages in 2.30s
```

### Passo 2: Verificar Variáveis de Ambiente

Abra o arquivo `.env` e confirme que contém:

```env
NODE_ENV=development
PORT=3000
JWT_ACCESS_SECRET=sua_chave_secreta_super_forte_para_access_token_123456789
JWT_REFRESH_SECRET=sua_chave_secreta_super_forte_para_refresh_token_987654321
```

---

## 2️⃣ Iniciando o Servidor

### Modo Desenvolvimento (Com Auto-Reload)

```bash
npm run dev
```

**Saída esperada:**

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         🔐 API de Autenticação com JWT - Iniciada             ║
║                                                                ║
║  Ambiente: development                                         ║
║  Porta:    3000                                                ║
║  URL:      http://localhost:3000                              ║
║                                                                ║
║  Health Check:  GET  http://localhost:3000/health        ║
║  Login:         POST http://localhost:3000/auth/login     ║
║  Refresh:       POST http://localhost:3000/auth/refresh   ║
║  Logout:        POST http://localhost:3000/auth/logout    ║
║  Listar:        GET  http://localhost:3000/usuarios     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

✅ **Servidor iniciado com sucesso!**

---

## 3️⃣ Testes Básicos (Com cURL)

### Teste 1: Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Resposta esperada:**

```json
{
  "message": "API de Autenticação com JWT - Online",
  "timestamp": "2026-04-17T10:30:00.000Z"
}
```

---

### Teste 2: Login do Admin

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "senha123"
  }'
```

**Resposta esperada (200 OK):**

```json
{
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTM0MDAwMDAsImV4cCI6MTcxMzQwMDkwMH0.XXXxxXXXx",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MTM0MDAwMDAsImV4cCI6MTcxNDAwNTAwMH0.YYYyyYYYy",
  "user": {
    "id": "1",
    "name": "Administrador",
    "role": "admin"
  }
}
```

✅ **Copie o `accessToken` e `refreshToken` para os próximos testes!**

---

### Teste 3: Listar Usuários (Protegido)

```bash
# Substitua TOKEN pelo accessToken do login anterior
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer TOKEN"
```

**Resposta esperada (200 OK):**

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
    },
    {
      "id": "2",
      "name": "João Silva",
      "role": "usuario",
      "department": "Vendas"
    },
    {
      "id": "3",
      "name": "Maria Santos",
      "role": "moderador",
      "department": "Suporte"
    }
  ]
}
```

✅ **Autenticação funcionando!**

---

### Teste 4: Erro - Token Expirado (Simulado)

```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer token_invalido"
```

**Resposta esperada (401 Unauthorized):**

```json
{
  "error": "Não autorizado",
  "message": "Access Token inválido"
}
```

✅ **Validação de token funcionando!**

---

### Teste 5: Refresh Token Rotation

```bash
# Substitua REFRESH_TOKEN pelo refreshToken do login
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN"
  }'
```

**Resposta esperada (200 OK):**

```json
{
  "message": "Tokens renovados com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTM0MDAwMDAsImV4cCI6MTcxMzQwMDkwMH0.NEW_SIGNATURE",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MTM0MDAwMDAsImV4cCI6MTcxNDAwNTAwMH0.NEW_SIGNATURE"
}
```

✅ **Token Rotation funcionando!**

---

### Teste 6: Logout

```bash
# Substitua NEW_REFRESH_TOKEN pelo refreshToken recebido no refresh anterior
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "NEW_REFRESH_TOKEN"
  }'
```

**Resposta esperada (200 OK):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### Teste 7: Tentar Reutilizar Token Revogado

```bash
# Tentar usar o mesmo refreshToken após logout (deve falhar)
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "NEW_REFRESH_TOKEN"
  }'
```

**Resposta esperada (401 Unauthorized):**

```json
{
  "error": "Não autorizado",
  "message": "Refresh Token não encontrado ou revogado"
}
```

✅ **Revogação de tokens funcionando!**

---

## 4️⃣ Testes com VSCode REST Client

### Instalação

1. Abra VSCode
2. Vá para Extensions (Ctrl+Shift+X)
3. Busque "REST Client" by Huachao Mao (humao.rest-client)
4. Instale

### Exemplos de Requisições

Crie um arquivo `testes.rest` com o conteúdo abaixo:

```http
### Configuração
@baseUrl = http://localhost:3000
@admin_email = admin@example.com
@admin_password = senha123
@user_email = user@example.com
@user_password = senha456

### 1. Health Check
GET {{baseUrl}}/health

### 2. Login - Admin
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}

### 3. Login - Usuário Comum
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{user_email}}",
  "password": "{{user_password}}"
}

### 4. Listar Usuários (substitua TOKEN)
GET {{baseUrl}}/usuarios
Authorization: Bearer TOKEN_AQUI

### 5. Obter Perfil
GET {{baseUrl}}/usuarios/me
Authorization: Bearer TOKEN_AQUI

### 6. Atualizar Perfil
PUT {{baseUrl}}/usuarios/me
Authorization: Bearer TOKEN_AQUI
Content-Type: application/json

{
  "name": "Novo Nome",
  "department": "Marketing"
}

### 7. Renovar Tokens
POST {{baseUrl}}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "REFRESH_TOKEN_AQUI"
}

### 8. Logout
POST {{baseUrl}}/auth/logout
Content-Type: application/json

{
  "refreshToken": "REFRESH_TOKEN_AQUI"
}

### 9. Erro - Token Inválido
GET {{baseUrl}}/usuarios
Authorization: Bearer token_invalido

### 10. Excluir Usuário (Admin Only)
DELETE {{baseUrl}}/usuarios/2
Authorization: Bearer TOKEN_ADMIN_AQUI
```

### Como Usar

1. Clique "Send Request" acima de cada bloco
2. Veja a resposta no painel à direita
3. Copie tokens retornados nos campos apropriados
4. Teste cada requisição sequencialmente

### Uso

1. Abra o arquivo `testes.rest`
2. Clique em "Send Request" acima de cada requisição
3. Veja a resposta à direita

---

## 5️⃣ Testes com Postman

### Importar Coleção

1. Abra Postman
2. Clique em "Import"
3. Copie/cole as requisições do arquivo `exemplos-requisicoes.rest`

### Configurar Variáveis

Clique em "Environment" e adicione:

```
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "",
  "refreshToken": ""
}
```

Use `{{baseUrl}}`, `{{accessToken}}`, etc. nas requisições.

---

## 6️⃣ Testes de Autorização (Role-Based Access Control)

### Teste: Admin vs Usuário Comum

#### 1. Login do Admin

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'
```

Copie o `accessToken_admin`.

#### 2. Login do Usuário Comum

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha456"}'
```

Copie o `accessToken_user`.

#### 3. Admin Listar Todos

```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer accessToken_admin"
```

**Resultado:** Retorna 3 usuários ✅

#### 4. Usuário Comum Listar

```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer accessToken_user"
```

**Resultado:** Retorna apenas 1 usuário (seus próprios dados) ✅

#### 5. Usuário Comum Tentar Excluir

```bash
curl -X DELETE http://localhost:3000/usuarios/1 \
  -H "Authorization: Bearer accessToken_user"
```

**Resultado:** 403 Forbidden ✅

#### 6. Admin Excluir Usuário

```bash
curl -X DELETE http://localhost:3000/usuarios/2 \
  -H "Authorization: Bearer accessToken_admin"
```

**Resultado:** 200 OK ✅

---

## 7️⃣ Testes de Validação e Tratamento de Erro

### Teste 1: Credenciais Inválidas

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha_errada"}'
```

**Resposta:** 401 Unauthorized ✅

### Teste 2: Email Faltando

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"senha123"}'
```

**Resposta:** 400 Bad Request ✅

### Teste 3: Authorization Header Faltando

```bash
curl -X GET http://localhost:3000/usuarios
```

**Resposta:** 401 Unauthorized ✅

### Teste 4: Bearer Format Incorreto

```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: bearer token"
```

**Resposta:** 401 Unauthorized ✅

### Teste 5: Rota Não Encontrada

```bash
curl -X GET http://localhost:3000/rota-inexistente
```

**Resposta:** 404 Not Found ✅

---

## 8️⃣ Testes de Payload e Dados

### Teste 1: Obter Perfil Próprio

```bash
curl -X GET http://localhost:3000/usuarios/me \
  -H "Authorization: Bearer accessToken"
```

**Resposta esperada:**

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

✅

### Teste 2: Atualizar Perfil

```bash
curl -X PUT http://localhost:3000/usuarios/me \
  -H "Authorization: Bearer accessToken" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Updated",
    "department": "Marketing"
  }'
```

**Verificação:** Obter perfil novamente e confirmar novo nome ✅

---

## 9️⃣ Testes de Segurança

### Teste 1: Payload do JWT

Use um decodificador online em [jwt.io](https://jwt.io):

1. Cole um Access Token
2. Observe o payload:

```json
{
  "sub": "1",
  "name": "Administrador",
  "role": "admin",
  "iat": 1713400000,
  "exp": 1713400900
}
```

✅ **Nenhuma informação sensível (senha, hash, etc.)**

### Teste 2: Tentar Modificar Token

1. Copie um Access Token
2. Altere um caractere
3. Use a versão modificada:

```bash
curl -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer <TOKEN_MODIFICADO>"
```

**Resposta:** 401 Unauthorized ✅ **Assinatura inválida**

### Teste 3: Token Rotation

1. Login → token1
2. POST /refresh { token1 } → token2
3. Tentar usar token1 novamente → 401 Unauthorized ✅

---

## 🔟 Fluxo Completo de Teste

```bash
#!/bin/bash

echo "=== 1. Health Check ==="
curl -s http://localhost:3000/health | json_pp
read -p "Pressione ENTER para continuar..."

echo "=== 2. Login Admin ==="
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}')
echo $RESPONSE | json_pp
ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
read -p "Pressione ENTER para continuar..."

echo "=== 3. Listar Usuários ==="
curl -s -X GET http://localhost:3000/usuarios \
  -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
read -p "Pressione ENTER para continuar..."

echo "=== 4. Obter Perfil ==="
curl -s -X GET http://localhost:3000/usuarios/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
read -p "Pressione ENTER para continuar..."

echo "=== 5. Refresh Token ==="
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
echo $REFRESH_RESPONSE | json_pp
NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Novo Access Token: $NEW_ACCESS_TOKEN"
read -p "Pressione ENTER para continuar..."

echo "=== 6. Logout ==="
curl -s -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | json_pp
read -p "Pressione ENTER para continuar..."

echo "=== 7. Tentar Usar Token Revogado ==="
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | json_pp

echo "=== Todos os testes completados! ==="
```

---

## 📋 Checklist de Validação

- [ ] Health check retorna 200
- [ ] Login retorna accessToken e refreshToken
- [ ] Token permite acessar rotas protegidas
- [ ] Token inválido retorna 401
- [ ] Refresh token gera novo par
- [ ] Token antigo é revogado após refresh
- [ ] Logout revoga refresh token
- [ ] Autorização por role funciona (admin vs user)
- [ ] Endpoints 404 retornam 404
- [ ] Erros não vazam stack trace
- [ ] Token expirado retorna 401
- [ ] Payload não contém dados sensíveis

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'express'"

```bash
npm install
```

### Erro: "Port 3000 already in use"

```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Erro: "JWT_ACCESS_SECRET not defined"

Verifique o arquivo `.env`:

```bash
cat .env
```

Deve conter:

```
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

---

## ✨ Pronto para Produção

Quando todos os testes passarem:

1. ✅ Implementação completada
2. ✅ Arquitetura validada
3. ✅ Segurança verificada
4. ✅ Pronto para integração

---

**Versão 1.0 - 15 de abril de 2026**
