# Autenticação de Proprietários de Veículos

Este documento descreve como usar o endpoint de autenticação para proprietários de veículos, que permite que aplicações externas autentiquem usando apenas a placa do veículo.

## Visão Geral

O sistema oferece um endpoint de autenticação específico para proprietários de veículos que permite:

- Autenticação simples usando apenas a placa do veículo
- Geração de token JWT específico para o veículo
- Acesso restrito apenas aos dados do veículo autenticado
- Tokens com expiração configurável (padrão: 7 dias)

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Secret key para assinar tokens JWT de proprietários
OWNER_JWT_SECRET=sua-chave-secreta-aqui-mude-em-producao

# Tempo de expiração do token (opcional, padrão: 7d)
# Formatos aceitos: "7d", "24h", "3600s", etc.
OWNER_JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANTE:** Em produção, use uma chave secreta forte e única. Não compartilhe esta chave publicamente.

## Endpoint de Autenticação

### `POST /api/auth/owner`

Autentica um proprietário usando a placa do veículo e retorna um token JWT.

**URL Base:**
```
http://localhost:5000/api/auth/owner
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "licensePlate": "ABC1234"
}
```

**Resposta (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vehicle": {
    "id": "uuid-do-veiculo",
    "name": "Veículo 1",
    "licensePlate": "ABC1234",
    "model": "Modelo do Veículo",
    "status": "moving"
  },
  "expiresIn": 604800
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo encontrado com a placa: ABC1234"
}
```

**Resposta (400 Bad Request):**
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["licensePlate"],
      "message": "Placa do veículo é obrigatória"
    }
  ]
}
```

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:5000/api/auth/owner \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC1234"
  }'
```

**Exemplo de Requisição (JavaScript):**
```javascript
const response = await fetch('http://localhost:5000/api/auth/owner', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licensePlate: 'ABC1234'
  })
});

const data = await response.json();

if (response.ok) {
  // Armazenar token para uso em requisições subsequentes
  const token = data.token;
  localStorage.setItem('owner_token', token);
  console.log('Token recebido:', token);
  console.log('Veículo:', data.vehicle);
} else {
  console.error('Erro:', data.error);
}
```

**Exemplo de Requisição (Python):**
```python
import requests

url = "http://localhost:5000/api/auth/owner"
payload = {
    "licensePlate": "ABC1234"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    data = response.json()
    token = data["token"]
    vehicle = data["vehicle"]
    print(f"Token: {token}")
    print(f"Veículo: {vehicle}")
else:
    print(f"Erro: {response.json()}")
```

## Endpoints Disponíveis para Proprietários

Todos os endpoints abaixo requerem autenticação usando o token retornado pelo endpoint de autenticação.

### Autenticação

O token deve ser enviado no header `Authorization`:

```
Authorization: Bearer <token>
```

### `GET /api/owner/vehicle`

Retorna todos os dados completos do veículo autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
{
  "id": "uuid-do-veiculo",
  "name": "Veículo 1",
  "licensePlate": "ABC1234",
  "model": "Modelo do Veículo",
  "status": "moving",
  "ignition": "on",
  "currentSpeed": 60,
  "speedLimit": 80,
  "heading": 90,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 10,
  "lastUpdate": "2024-12-08T14:30:00.000Z",
  "batteryLevel": 85
}
```

**Exemplo:**
```bash
curl http://localhost:5000/api/owner/vehicle \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/owner/position`

Retorna a posição atual e status do veículo.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
{
  "vehicleId": "uuid-do-veiculo",
  "licensePlate": "ABC1234",
  "position": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "heading": 90,
    "accuracy": 10
  },
  "status": {
    "currentSpeed": 60,
    "speedLimit": 80,
    "status": "moving",
    "ignition": "on"
  },
  "lastUpdate": "2024-12-08T14:30:00.000Z"
}
```

**Exemplo:**
```bash
curl http://localhost:5000/api/owner/position \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/owner/history`

Retorna o histórico de localização do veículo.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (opcional): Data de início no formato ISO 8601. Padrão: últimas 24 horas
- `endDate` (opcional): Data de fim no formato ISO 8601. Padrão: data atual

**Exemplo de URL:**
```
GET /api/owner/history?startDate=2024-12-01T00:00:00.000Z&endDate=2024-12-08T23:59:59.000Z
```

**Resposta (200 OK):**
```json
{
  "vehicleId": "uuid-do-veiculo",
  "startDate": "2024-12-01T00:00:00.000Z",
  "endDate": "2024-12-08T23:59:59.000Z",
  "points": [
    {
      "latitude": -23.5505,
      "longitude": -46.6333,
      "speed": 60,
      "heading": 90,
      "timestamp": "2024-12-08T14:30:00.000Z",
      "accuracy": 10
    },
    {
      "latitude": -23.5510,
      "longitude": -46.6340,
      "speed": 65,
      "heading": 92,
      "timestamp": "2024-12-08T14:31:00.000Z",
      "accuracy": 10
    }
  ],
  "totalPoints": 2
}
```

**Exemplo:**
```bash
curl "http://localhost:5000/api/owner/history?startDate=2024-12-01T00:00:00.000Z&endDate=2024-12-08T23:59:59.000Z" \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/owner/alerts`

Retorna os alertas relacionados ao veículo.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
{
  "vehicleId": "uuid-do-veiculo",
  "alerts": [
    {
      "id": "uuid-do-alerta",
      "type": "speed",
      "priority": "warning",
      "vehicleId": "uuid-do-veiculo",
      "vehicleName": "Veículo 1",
      "message": "Velocidade acima do limite",
      "timestamp": "2024-12-08T14:30:00.000Z",
      "read": false,
      "latitude": -23.5505,
      "longitude": -46.6333,
      "speed": 90,
      "speedLimit": 80
    }
  ],
  "total": 1,
  "unread": 1
}
```

**Exemplo:**
```bash
curl http://localhost:5000/api/owner/alerts \
  -H "Authorization: Bearer <token>"
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| `200` | OK - Requisição bem-sucedida |
| `400` | Bad Request - Dados inválidos ou malformados |
| `401` | Unauthorized - Token inválido, expirado ou ausente |
| `404` | Not Found - Veículo não encontrado |
| `500` | Internal Server Error - Erro no servidor |

## Tratamento de Erros

### Token Inválido ou Expirado

**Resposta (401 Unauthorized):**
```json
{
  "error": "Token inválido ou expirado"
}
```

**Solução:** Faça uma nova autenticação usando `POST /api/auth/owner` para obter um novo token.

### Veículo Não Encontrado

**Resposta (404 Not Found):**
```json
{
  "error": "Veículo não encontrado"
}
```

**Solução:** Verifique se a placa do veículo está correta e se o veículo está cadastrado no sistema.

### Token Não Fornecido

**Resposta (401 Unauthorized):**
```json
{
  "error": "Token de autenticação não fornecido"
}
```

**Solução:** Certifique-se de incluir o header `Authorization: Bearer <token>` em todas as requisições.

## Fluxo Completo de Uso

### 1. Autenticação

```javascript
// Passo 1: Autenticar com a placa do veículo
const authResponse = await fetch('http://localhost:5000/api/auth/owner', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ licensePlate: 'ABC1234' })
});

const authData = await authResponse.json();
const token = authData.token;
```

### 2. Usar o Token em Requisições

```javascript
// Passo 2: Usar o token para acessar dados do veículo
const vehicleResponse = await fetch('http://localhost:5000/api/owner/vehicle', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
});

const vehicleData = await vehicleResponse.json();
console.log('Dados do veículo:', vehicleData);
```

### 3. Renovação do Token

Quando o token expirar, simplesmente faça uma nova autenticação:

```javascript
// Token expirado - fazer nova autenticação
const newAuthResponse = await fetch('http://localhost:5000/api/auth/owner', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ licensePlate: 'ABC1234' })
});

const newAuthData = await newAuthResponse.json();
const newToken = newAuthData.token;
```

## Segurança

### Boas Práticas

1. **Armazenamento Seguro do Token:**
   - Em aplicações web, use `localStorage` ou `sessionStorage`
   - Em aplicações mobile, use armazenamento seguro (Keychain/Keystore)
   - Nunca compartilhe o token publicamente

2. **Renovação Proativa:**
   - Renove o token antes de expirar
   - Implemente tratamento de erro para tokens expirados

3. **HTTPS em Produção:**
   - Sempre use HTTPS em produção para proteger o token durante a transmissão

4. **Validação de Placa:**
   - Valide o formato da placa antes de enviar
   - Trate erros de veículo não encontrado adequadamente

### Limitações

- O token dá acesso **apenas** aos dados do veículo autenticado
- Não é possível acessar dados de outros veículos
- Não é possível realizar operações administrativas (criar/editar/deletar veículos)
- O token expira após o período configurado (padrão: 7 dias)

## Diferenças entre Autenticação de Usuário e Proprietário

| Aspecto | Autenticação de Usuário | Autenticação de Proprietário |
|---------|------------------------|------------------------------|
| **Credenciais** | Email + Senha | Apenas Placa do Veículo |
| **Token** | JWT do Supabase Auth | JWT próprio do sistema |
| **Acesso** | Múltiplos veículos (se associados) | Apenas 1 veículo específico |
| **Endpoints** | `/api/vehicles`, `/api/alerts`, etc. | `/api/owner/*` |
| **Uso** | Sistema interno (dashboard web) | Aplicações externas |

## Exemplos Completos

### Exemplo: Aplicação React

```javascript
// hooks/useOwnerAuth.js
import { useState } from 'react';

export function useOwnerAuth() {
  const [token, setToken] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const authenticate = async (licensePlate) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate })
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();
      setToken(data.token);
      setVehicle(data.vehicle);
      localStorage.setItem('owner_token', data.token);
      return data;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  };

  const getVehicleData = async () => {
    const storedToken = token || localStorage.getItem('owner_token');
    if (!storedToken) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch('http://localhost:5000/api/owner/vehicle', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado - limpar e pedir nova autenticação
        setToken(null);
        localStorage.removeItem('owner_token');
        throw new Error('Token expirado');
      }
      throw new Error('Erro ao buscar dados');
    }

    return await response.json();
  };

  return { authenticate, getVehicleData, token, vehicle };
}
```

### Exemplo: Aplicação Python

```python
import requests
from datetime import datetime, timedelta

class OwnerAPI:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
        self.token = None
        self.vehicle = None

    def authenticate(self, license_plate):
        """Autentica usando a placa do veículo"""
        response = requests.post(
            f"{self.base_url}/auth/owner",
            json={"licensePlate": license_plate}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["token"]
        self.vehicle = data["vehicle"]
        return data

    def get_vehicle(self):
        """Busca dados completos do veículo"""
        if not self.token:
            raise ValueError("Token não encontrado. Faça autenticação primeiro.")
        
        response = requests.get(
            f"{self.base_url}/owner/vehicle",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()

    def get_position(self):
        """Busca posição atual do veículo"""
        if not self.token:
            raise ValueError("Token não encontrado. Faça autenticação primeiro.")
        
        response = requests.get(
            f"{self.base_url}/owner/position",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()

    def get_history(self, start_date=None, end_date=None):
        """Busca histórico de localização"""
        if not self.token:
            raise ValueError("Token não encontrado. Faça autenticação primeiro.")
        
        params = {}
        if start_date:
            params["startDate"] = start_date.isoformat()
        if end_date:
            params["endDate"] = end_date.isoformat()
        
        response = requests.get(
            f"{self.base_url}/owner/history",
            headers={"Authorization": f"Bearer {self.token}"},
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_alerts(self):
        """Busca alertas do veículo"""
        if not self.token:
            raise ValueError("Token não encontrado. Faça autenticação primeiro.")
        
        response = requests.get(
            f"{self.base_url}/owner/alerts",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()

# Uso
api = OwnerAPI()
api.authenticate("ABC1234")
vehicle = api.get_vehicle()
position = api.get_position()
alerts = api.get_alerts()
```

## Suporte

Para dúvidas ou problemas, consulte:
- [Documentação Completa da API](./API_COMPLETA.md)
- [Guia de Configuração](./GUIA_CONFIGURACAO_AUTENTICACAO.md)





