# Documentação Completa da API - FleetTrack

Documentação atualizada e completa da API REST do sistema de controle de frotas.

## 📋 Índice

- [Informações Gerais](#informações-gerais)
- [WebSocket - Atualizações em Tempo Real](#websocket---atualizações-em-tempo-real)
- [Veículos](#veículos)
- [Rastreamento em Tempo Real](#rastreamento-em-tempo-real)
- [Geofences](#geofences)
- [Alertas](#alertas)
- [Histórico e Relatórios](#histórico-e-relatórios)
- [Schemas e Tipos](#schemas-e-tipos)
- [Tratamento de Erros](#tratamento-de-erros)
- [Exemplos Práticos](#exemplos-práticos)

---

## Informações Gerais

### Base URL

```
http://localhost:5000/api
```

Para produção ou acesso remoto:
```
http://SEU-IP:5000/api
```

### Formato de Dados

- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Formato de Datas**: ISO 8601 (ex: `"2024-12-08T14:30:00.000Z"`)

### Autenticação

**Status atual:** ✅ **A API requer autenticação via JWT Bearer Token.**

A maioria dos endpoints requer autenticação. O token deve ser enviado no header `Authorization`:

```
Authorization: Bearer <token>
```

**Endpoints públicos (sem autenticação):**
- `POST /api/tracking` - Recebe dados de rastreamento (público para dispositivos GPS)
- `GET /api/alerts/:id` - Busca alerta específico
- `POST /api/alerts` - Cria alerta manualmente
- `PATCH /api/alerts/:id` - Atualiza alerta
- `POST /api/alerts/mark-all-read` - Marca todos como lidos
- `DELETE /api/alerts/clear-read` - Remove alertas lidos

**Endpoints que requerem autenticação:**
- Todos os outros endpoints requerem token válido

**Endpoints que requerem permissão de administrador:**
- `POST /api/vehicles` - Criar veículo
- `PATCH /api/vehicles/:id` - Atualizar veículo
- `DELETE /api/vehicles/:id` - Deletar veículo
- Todos os endpoints de `/api/geofences` - Gerenciar geofences
- `GET /api/reports/violations` - Relatório de violações
- `GET /api/reports/speed-stats` - Estatísticas de velocidade

**Filtragem por usuário:**
- Usuários comuns (`role: "user"`) veem apenas seus próprios veículos e alertas
- Administradores (`role: "admin"`) veem todos os dados

### CORS

- Configurado para aceitar requisições de qualquer origem (desenvolvimento)
- Em produção, configurar CORS adequadamente para domínios específicos

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| `200` | OK - Requisição bem-sucedida |
| `201` | Created - Recurso criado com sucesso |
| `204` | No Content - Sucesso sem conteúdo (DELETE) |
| `400` | Bad Request - Dados inválidos ou malformados |
| `401` | Unauthorized - Token inválido, expirado ou ausente |
| `403` | Forbidden - Acesso negado (sem permissão suficiente) |
| `404` | Not Found - Recurso não encontrado |
| `500` | Internal Server Error - Erro no servidor |

---

## WebSocket - Atualizações em Tempo Real

### Conexão WebSocket

**Endpoint:** `ws://localhost:5000/ws`

Conexão WebSocket para receber atualizações de veículos em tempo real sem necessidade de polling.

### Conexão

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensagem recebida:', message);
};

ws.onerror = (error) => {
  console.error('Erro WebSocket:', error);
};

ws.onclose = () => {
  console.log('Conexão WebSocket fechada');
};
```

### Mensagens Recebidas

#### Tipo: `vehicles`

Atualização da lista completa de veículos.

```json
{
  "type": "vehicles",
  "data": [
    {
      "id": "v1",
      "name": "Caminhão 01",
      "licensePlate": "ABC-1234",
      "status": "moving",
      "currentSpeed": 72,
      "latitude": -23.5489,
      "longitude": -46.6388,
      ...
    }
  ]
}
```

### Comportamento

- **Ao conectar**: Recebe imediatamente a lista atual de veículos
- **Atualizações automáticas**: Recebe atualizações sempre que:
  - Um veículo é criado, atualizado ou deletado
  - Dados de rastreamento são recebidos via `POST /api/tracking`
  - Qualquer alteração nos veículos ocorre

### Exemplo Completo

```javascript
class VehicleWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket conectado');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'vehicles') {
        this.onVehiclesUpdate(message.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erro WebSocket:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket desconectado');
      this.attemptReconnect();
    };
  }

  onVehiclesUpdate(vehicles) {
    console.log('Veículos atualizados:', vehicles);
    // Atualizar UI, mapa, etc.
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Tentativa de reconexão ${this.reconnectAttempts}...`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Uso
const ws = new VehicleWebSocket('ws://localhost:5000/ws');
ws.connect();
```

---

## Autenticação

### `POST /api/auth/login`

Realiza login no sistema e retorna token de autenticação.

**Body (JSON):**

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200 OK):**

```json
{
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "username": "Nome do Usuário",
    "role": "admin"
  },
  "token": "jwt-access-token",
  "session": {
    "access_token": "jwt-access-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600
  }
}
```

**Resposta (401 Unauthorized):**

```json
{
  "error": "Credenciais inválidas",
  "message": "Email ou senha incorretos"
}
```

**Resposta (400 Bad Request):**

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["email"],
      "message": "Expected string, received undefined"
    }
  ]
}
```

**Exemplo:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});

const data = await response.json();
// Armazenar token para uso em requisições subsequentes
localStorage.setItem('auth_token', data.token);
```

---

### `POST /api/auth/logout`

Realiza logout do sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

**Exemplo:**

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/auth/me`

Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**

```json
{
  "id": "uuid-do-usuario",
  "email": "usuario@exemplo.com",
  "username": "Nome do Usuário",
  "role": "admin"
}
```

**Resposta (401 Unauthorized):**

```json
{
  "error": "Usuário não autenticado"
}
```

**Exemplo:**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Veículos

### `GET /api/vehicles`

Lista todos os veículos cadastrados no sistema.

**Autenticação:** ✅ Requerida

**Permissões:**
- **Usuários comuns (`role: "user"`)**: Veem apenas seus próprios veículos (associados na tabela `user_vehicles`)
- **Administradores (`role: "admin"`)**: Veem todos os veículos

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
[
  {
    "id": "v1",
    "name": "Caminhão 01",
    "licensePlate": "ABC-1234",
    "model": "Mercedes Actros",
    "status": "moving",
    "ignition": "on",
    "currentSpeed": 72,
    "speedLimit": 80,
    "heading": 45,
    "latitude": -23.5489,
    "longitude": -46.6388,
    "accuracy": 5,
    "lastUpdate": "2024-12-08T14:30:00.000Z",
    "batteryLevel": 85
  }
]
```

**Exemplo:**
```bash
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer <token>"
```

```javascript
const vehicles = await fetch('http://localhost:5000/api/vehicles', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
  .then(res => res.json());
console.log(vehicles);
```

**Resposta (401 Unauthorized):**

```json
{
  "error": "Token inválido ou expirado"
}
```

---

### `GET /api/vehicles/:id`

Busca um veículo específico pelo ID.

**Autenticação:** ❌ Não requerida (público)

**Parâmetros:**
- `id` (path, obrigatório) - ID único do veículo

**Resposta (200 OK):**
```json
{
  "id": "v1",
  "name": "Caminhão 01",
  "licensePlate": "ABC-1234",
  "model": "Mercedes Actros",
  "status": "moving",
  "ignition": "on",
  "currentSpeed": 72,
  "speedLimit": 80,
  "heading": 45,
  "latitude": -23.5489,
  "longitude": -46.6388,
  "accuracy": 5,
  "lastUpdate": "2024-12-08T14:30:00.000Z",
  "batteryLevel": 85
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Vehicle not found"
}
```

**Exemplo:**
```bash
curl http://localhost:5000/api/vehicles/v1
```

---

### `POST /api/vehicles`

Cria um novo veículo no sistema.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "name": "Caminhão 01",
  "licensePlate": "ABC-1234",
  "model": "Mercedes Actros",
  "status": "stopped",
  "ignition": "off",
  "currentSpeed": 0,
  "speedLimit": 60,
  "heading": 0,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 5,
  "lastUpdate": "2024-12-08T14:30:00.000Z",
  "batteryLevel": 85
}
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição | Valores |
|-------|------|-----------|---------|
| `name` | string | Nome do veículo | Qualquer string |
| `licensePlate` | string | Placa do veículo | Ex: "ABC-1234" |
| `status` | string | Status atual | `"moving"`, `"stopped"`, `"idle"`, `"offline"` |
| `ignition` | string | Estado da ignição | `"on"`, `"off"` |
| `currentSpeed` | number | Velocidade atual (km/h) | ≥ 0 |
| `speedLimit` | number | Limite de velocidade (km/h) | ≥ 0 |
| `heading` | number | Direção/rumo | 0-360° |
| `latitude` | number | Latitude | -90 a 90 |
| `longitude` | number | Longitude | -180 a 180 |
| `accuracy` | number | Precisão GPS (metros) | ≥ 0 |
| `lastUpdate` | string | Data/hora ISO 8601 | ISO 8601 |

**Campos Opcionais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `model` | string | Modelo do veículo |
| `batteryLevel` | number | Nível de bateria (0-100) |

**Resposta (201 Created):**
```json
{
  "id": "v1",
  "name": "Caminhão 01",
  "licensePlate": "ABC-1234",
  ...
}
```

**Resposta (400 Bad Request):**
```json
{
  "error": "Invalid vehicle data",
  "details": [
    {
      "path": ["latitude"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Resposta (403 Forbidden):**

```json
{
  "error": "Acesso negado",
  "message": "Apenas administradores podem criar veículos"
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Caminhão 01",
    "licensePlate": "ABC-1234",
    "status": "stopped",
    "ignition": "off",
    "currentSpeed": 0,
    "speedLimit": 60,
    "heading": 0,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 5,
    "lastUpdate": "2024-12-08T14:30:00.000Z"
  }'
```

```javascript
const vehicle = await fetch('http://localhost:5000/api/vehicles', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    name: 'Caminhão 01',
    licensePlate: 'ABC-1234',
    status: 'stopped',
    ignition: 'off',
    currentSpeed: 0,
    speedLimit: 60,
    heading: 0,
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 5,
    lastUpdate: new Date().toISOString()
  })
}).then(res => res.json());
```

---

### `PATCH /api/vehicles/:id`

Atualiza um veículo existente. Permite atualização parcial (apenas campos informados).

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path, obrigatório) - ID do veículo

**Body (JSON):** Qualquer campo do veículo (todos opcionais)

```json
{
  "name": "Novo Nome",
  "speedLimit": 80,
  "status": "moving",
  "batteryLevel": 90
}
```

**Resposta (200 OK):**
```json
{
  "id": "v1",
  "name": "Novo Nome",
  "speedLimit": 80,
  "status": "moving",
  ...
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Vehicle not found"
}
```

**Resposta (400 Bad Request):**
```json
{
  "error": "Invalid vehicle data",
  "details": [...]
}
```

**Resposta (403 Forbidden):**

```json
{
  "error": "Acesso negado",
  "message": "Apenas administradores podem atualizar veículos"
}
```

**Exemplo:**
```bash
curl -X PATCH http://localhost:5000/api/vehicles/v1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"speedLimit": 80}'
```

---

### `DELETE /api/vehicles/:id`

Remove um veículo do sistema.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path, obrigatório) - ID do veículo

**Resposta (204 No Content):** Sem corpo de resposta

**Resposta (404 Not Found):**
```json
{
  "error": "Vehicle not found"
}
```

**Resposta (403 Forbidden):**

```json
{
  "error": "Acesso negado",
  "message": "Apenas administradores podem deletar veículos"
}
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:5000/api/vehicles/v1 \
  -H "Authorization: Bearer <token>"
```

---

## Rastreamento em Tempo Real

### `POST /api/tracking`

**Endpoint principal para receber dados de rastreamento em tempo real.**

Este endpoint é usado por dispositivos GPS, aplicativos móveis ou sistemas externos para enviar a localização de veículos.

**Body (JSON):**

```json
{
  "licensePlate": "ABC-1234",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "speed": 65,
  "heading": 180,
  "accuracy": 5,
  "timestamp": "2024-12-08T14:30:00.000Z"
}
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `licensePlate` | string | Placa do veículo | Deve existir no sistema |
| `latitude` | number | Latitude em graus | -90 a 90 |
| `longitude` | number | Longitude em graus | -180 a 180 |
| `speed` | number | Velocidade em km/h | ≥ 0 |

**Campos Opcionais:**

| Campo | Tipo | Descrição | Padrão |
|-------|------|-----------|--------|
| `heading` | number | Direção em graus | 0 |
| `accuracy` | number | Precisão GPS em metros | 0 |
| `timestamp` | string | Data/hora ISO 8601 | Data/hora atual |

**Comportamento Automático:**

1. **Busca o veículo** pela placa (`licensePlate`)
2. **Atualiza localização, velocidade e status** do veículo
3. **Calcula status automaticamente:**
   - `speed = 0` → `status: "stopped"`, `ignition: "off"`
   - `speed < 5` → `status: "idle"`
   - `speed ≥ 5` → `status: "moving"`, `ignition: "on"`
4. **Atualiza `lastUpdate`** com timestamp atual
5. **Envia atualização via WebSocket** para todos os clientes conectados

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Localização atualizada com sucesso",
  "vehicle": {
    "id": "v1",
    "name": "Caminhão 01",
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "currentSpeed": 65,
    "status": "moving",
    "lastUpdate": "2024-12-08T14:30:00.000Z"
  }
}
```

**Resposta (400 Bad Request):**
```json
{
  "error": "Dados de rastreamento inválidos",
  "details": [
    {
      "path": ["latitude"],
      "message": "Number must be greater than or equal to -90"
    }
  ]
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo encontrado com a placa: XYZ-9999"
}
```

**Exemplos:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 65,
    "heading": 180,
    "accuracy": 5
  }'
```

**JavaScript:**
```javascript
const trackingData = {
  licensePlate: "ABC-1234",
  latitude: -23.5505,
  longitude: -46.6333,
  speed: 65,
  heading: 180,
  accuracy: 5
};

const response = await fetch('http://localhost:5000/api/tracking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(trackingData)
});

const result = await response.json();
console.log(result);
```

**Python:**
```python
import requests
from datetime import datetime

tracking_data = {
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 65,
    "heading": 180,
    "accuracy": 5,
    "timestamp": datetime.utcnow().isoformat() + "Z"
}

response = requests.post(
    "http://localhost:5000/api/tracking",
    json=tracking_data
)

print(response.json())
```

**Frequência Recomendada:**

| Situação | Intervalo |
|----------|-----------|
| Veículo em movimento | 5-15 segundos |
| Veículo parado | 30-60 segundos |
| Economia de bateria | 1-5 minutos |

---

## Geofences

### `GET /api/geofences`

Lista todas as geofences cadastradas.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
[
  {
    "id": "g1",
    "name": "Depósito Central",
    "description": "Área principal de armazenamento",
    "type": "circle",
    "active": true,
    "center": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "radius": 500,
    "rules": [
      {
        "type": "entry",
        "enabled": true,
        "toleranceSeconds": 30
      },
      {
        "type": "exit",
        "enabled": true,
        "toleranceSeconds": 30
      },
      {
        "type": "dwell",
        "enabled": false,
        "dwellTimeMinutes": 30,
        "toleranceSeconds": 30
      }
    ],
    "vehicleIds": ["v1", "v2"],
    "lastTriggered": "2024-12-08T14:30:00.000Z",
    "color": "#22c55e"
  }
]
```

**Exemplo:**
```bash
curl http://localhost:5000/api/geofences \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/geofences/:id`

Busca uma geofence específica pelo ID.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path, obrigatório) - ID da geofence

**Resposta (200 OK):**
```json
{
  "id": "g1",
  "name": "Depósito Central",
  ...
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Geofence not found"
}
```

---

### `POST /api/geofences`

Cria uma nova geofence.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "name": "Depósito Central",
  "description": "Área principal",
  "type": "circle",
  "active": true,
  "center": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "radius": 500,
  "points": [],
  "rules": [
    {
      "type": "entry",
      "enabled": true,
      "toleranceSeconds": 30
    },
    {
      "type": "exit",
      "enabled": true,
      "toleranceSeconds": 30
    }
  ],
  "vehicleIds": ["v1"],
  "color": "#22c55e"
}
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome da geofence |
| `type` | string | Tipo: `"circle"` ou `"polygon"` |
| `active` | boolean | Se a geofence está ativa |
| `rules` | array | Array de regras de alerta |
| `vehicleIds` | array | IDs dos veículos monitorados |

**Para tipo `circle`:**
- `center` (obrigatório) - Objeto com `latitude` e `longitude`
- `radius` (obrigatório) - Raio em metros

**Para tipo `polygon`:**
- `points` (obrigatório) - Array de pontos com `latitude` e `longitude` (mínimo 3 pontos)

**Resposta (201 Created):**
```json
{
  "id": "g1",
  "name": "Depósito Central",
  ...
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/geofences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Depósito Central",
    "type": "circle",
    "active": true,
    "center": {"latitude": -23.5505, "longitude": -46.6333},
    "radius": 500,
    "rules": [{"type": "entry", "enabled": true, "toleranceSeconds": 30}],
    "vehicleIds": []
  }'
```

---

### `PATCH /api/geofences/:id`

Atualiza uma geofence existente.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path, obrigatório) - ID da geofence

**Body (JSON):** Qualquer campo da geofence (todos opcionais)

```json
{
  "active": false,
  "radius": 1000
}
```

**Resposta (200 OK):**
```json
{
  "id": "g1",
  "active": false,
  "radius": 1000,
  ...
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Geofence not found"
}
```

---

### `DELETE /api/geofences/:id`

Remove uma geofence do sistema.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path, obrigatório) - ID da geofence

**Resposta (204 No Content):** Sem corpo

**Resposta (404 Not Found):**
```json
{
  "error": "Geofence not found"
}
```

---

## Alertas

### `GET /api/alerts`

Lista todos os alertas do sistema.

**Autenticação:** ✅ Requerida

**Permissões:**
- **Usuários comuns (`role: "user"`)**: Veem apenas alertas de seus próprios veículos
- **Administradores (`role: "admin"`)**: Veem todos os alertas

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
[
  {
    "id": "a1",
    "type": "speed",
    "priority": "critical",
    "vehicleId": "v2",
    "vehicleName": "Van 02",
    "message": "Velocidade acima do limite: 95 km/h",
    "timestamp": "2024-12-08T14:30:00.000Z",
    "read": false,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 95,
    "speedLimit": 60,
    "geofenceName": null
  },
  {
    "id": "a2",
    "type": "geofence_entry",
    "priority": "info",
    "vehicleId": "v1",
    "vehicleName": "Caminhão 01",
    "message": "Veículo entrou na geofence: Depósito Central",
    "timestamp": "2024-12-08T14:25:00.000Z",
    "read": true,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "geofenceName": "Depósito Central"
  }
]
```

**Tipos de Alerta:**

| Tipo | Descrição |
|------|-----------|
| `speed` | Violação de velocidade |
| `geofence_entry` | Entrada em geofence |
| `geofence_exit` | Saída de geofence |
| `geofence_dwell` | Permanência prolongada em geofence |
| `system` | Alerta do sistema |

**Prioridades:**

| Prioridade | Descrição |
|------------|-----------|
| `critical` | Requer atenção imediata |
| `warning` | Requer atenção |
| `info` | Informativo |

**Exemplo:**
```bash
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/alerts/:id`

Busca um alerta específico pelo ID.

**Parâmetros:**
- `id` (path, obrigatório) - ID do alerta

**Resposta (200 OK):**
```json
{
  "id": "a1",
  "type": "speed",
  "priority": "critical",
  ...
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Alert not found"
}
```

---

### `POST /api/alerts`

Cria um novo alerta manualmente.

**Body (JSON):**

```json
{
  "type": "speed",
  "priority": "critical",
  "vehicleId": "v1",
  "vehicleName": "Caminhão 01",
  "message": "Velocidade acima do limite",
  "timestamp": "2024-12-08T14:30:00.000Z",
  "read": false,
  "speed": 95,
  "speedLimit": 60,
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | string | Tipo do alerta |
| `priority` | string | Prioridade |
| `vehicleId` | string | ID do veículo |
| `vehicleName` | string | Nome do veículo |
| `message` | string | Mensagem do alerta |
| `timestamp` | string | Data/hora ISO 8601 |
| `read` | boolean | Se foi lido |

**Resposta (201 Created):**
```json
{
  "id": "a1",
  ...
}
```

---

### `PATCH /api/alerts/:id`

Atualiza um alerta (ex: marcar como lido).

**Parâmetros:**
- `id` (path, obrigatório) - ID do alerta

**Body (JSON):**

```json
{
  "read": true
}
```

**Resposta (200 OK):**
```json
{
  "id": "a1",
  "read": true,
  ...
}
```

**Exemplo:**
```bash
curl -X PATCH http://localhost:5000/api/alerts/a1 \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

---

### `POST /api/alerts/mark-all-read`

Marca todos os alertas não lidos como lidos.

**Resposta (200 OK):**
```json
{
  "success": true
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/alerts/mark-all-read
```

---

### `DELETE /api/alerts/clear-read`

Remove todos os alertas que já foram marcados como lidos.

**Resposta (200 OK):**
```json
{
  "success": true
}
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:5000/api/alerts/clear-read
```

---

## Histórico e Relatórios

### `GET /api/trips`

Busca viagens/trajetos de um veículo em um período.

**Autenticação:** ✅ Requerida

**Permissões:**
- **Usuários comuns (`role: "user"`)**: Podem buscar apenas viagens de seus próprios veículos
- **Administradores (`role: "admin"`)**: Podem buscar viagens de qualquer veículo

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `vehicleId` | string | ✅ Sim | ID do veículo |
| `startDate` | string | ❌ Não | Data inicial ISO 8601 |
| `endDate` | string | ❌ Não | Data final ISO 8601 |

**Resposta (200 OK):**
```json
[
  {
    "id": "t1",
    "vehicleId": "v1",
    "startTime": "2024-12-08T08:00:00.000Z",
    "endTime": "2024-12-08T12:30:00.000Z",
    "totalDistance": 245.5,
    "travelTime": 270,
    "stoppedTime": 45,
    "averageSpeed": 54.5,
    "maxSpeed": 85,
    "stopsCount": 3,
    "points": [
      {
        "latitude": -23.5505,
        "longitude": -46.6333,
        "speed": 0,
        "heading": 0,
        "timestamp": "2024-12-08T08:00:00.000Z",
        "accuracy": 5
      }
    ],
    "events": [
      {
        "id": "e1",
        "type": "departure",
        "latitude": -23.5505,
        "longitude": -46.6333,
        "timestamp": "2024-12-08T08:00:00.000Z"
      },
      {
        "id": "e2",
        "type": "stop",
        "latitude": -23.5600,
        "longitude": -46.6400,
        "timestamp": "2024-12-08T09:15:00.000Z",
        "duration": 15
      }
    ]
  }
]
```

**Tipos de Eventos:**

| Tipo | Descrição |
|------|-----------|
| `departure` | Partida |
| `arrival` | Chegada |
| `stop` | Parada |
| `speed_violation` | Violação de velocidade |
| `geofence_entry` | Entrada em geofence |
| `geofence_exit` | Saída de geofence |

**Exemplo:**
```bash
curl "http://localhost:5000/api/trips?vehicleId=v1&startDate=2024-12-01T00:00:00Z&endDate=2024-12-08T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/reports/violations`

Lista todas as violações de velocidade em um período.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão |
|-----------|------|-------------|--------|
| `startDate` | string | ❌ Não | 30 dias atrás |
| `endDate` | string | ❌ Não | Agora |

**Resposta (200 OK):**
```json
[
  {
    "id": "viol1",
    "vehicleId": "v1",
    "vehicleName": "Caminhão 01",
    "speed": 95,
    "speedLimit": 60,
    "excessSpeed": 35,
    "timestamp": "2024-12-08T14:30:00.000Z",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "duration": 120
  }
]
```

**Exemplo:**
```bash
curl "http://localhost:5000/api/reports/violations?startDate=2024-12-01T00:00:00Z&endDate=2024-12-08T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/reports/speed-stats`

Retorna estatísticas agregadas de violações de velocidade.

**Autenticação:** ✅ Requerida  
**Permissões:** ✅ Requer permissão de administrador (`role: "admin"`)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão |
|-----------|------|-------------|--------|
| `startDate` | string | ❌ Não | 30 dias atrás |
| `endDate` | string | ❌ Não | Agora |

**Resposta (200 OK):**
```json
{
  "totalViolations": 150,
  "vehiclesWithViolations": 5,
  "averageExcessSpeed": 12.5,
  "violationsByDay": [
    {
      "date": "2024-12-01",
      "count": 10
    },
    {
      "date": "2024-12-02",
      "count": 15
    }
  ],
  "topViolators": [
    {
      "vehicleId": "v1",
      "vehicleName": "Caminhão 01",
      "totalViolations": 45,
      "averageExcessSpeed": 18.5,
      "lastViolation": "2024-12-08T14:30:00.000Z"
    }
  ]
}
```

**Exemplo:**
```bash
curl "http://localhost:5000/api/reports/speed-stats?startDate=2024-12-01T00:00:00Z&endDate=2024-12-08T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

---

## Schemas e Tipos

### Vehicle (Veículo)

```typescript
type VehicleStatus = "moving" | "stopped" | "idle" | "offline";
type IgnitionStatus = "on" | "off";

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  model?: string;
  status: VehicleStatus;
  ignition: IgnitionStatus;
  currentSpeed: number;        // km/h
  speedLimit: number;          // km/h
  heading: number;             // 0-360°
  latitude: number;            // -90 a 90
  longitude: number;            // -180 a 180
  accuracy: number;            // metros
  lastUpdate: string;          // ISO 8601
  batteryLevel?: number;       // 0-100
}
```

### Geofence

```typescript
type GeofenceType = "circle" | "polygon";
type GeofenceRuleType = "entry" | "exit" | "dwell" | "time_violation";

interface GeofenceRule {
  type: GeofenceRuleType;
  enabled: boolean;
  dwellTimeMinutes?: number;
  startTime?: string;
  endTime?: string;
  toleranceSeconds?: number;
}

interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  active: boolean;
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;             // metros (apenas para circle)
  points?: Array<{              // apenas para polygon
    latitude: number;
    longitude: number;
  }>;
  rules: GeofenceRule[];
  vehicleIds: string[];
  lastTriggered?: string;      // ISO 8601
  color?: string;               // hex color
}
```

### Alert

```typescript
type AlertType = "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
type AlertPriority = "critical" | "warning" | "info";

interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  vehicleId: string;
  vehicleName: string;
  message: string;
  timestamp: string;            // ISO 8601
  read: boolean;
  latitude?: number;
  longitude?: number;
  speed?: number;
  speedLimit?: number;
  geofenceName?: string;
}
```

### Trip (Viagem)

```typescript
interface LocationPoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;            // ISO 8601
  accuracy?: number;
}

interface RouteEvent {
  id: string;
  type: "departure" | "arrival" | "stop" | "speed_violation" | "geofence_entry" | "geofence_exit";
  latitude: number;
  longitude: number;
  timestamp: string;            // ISO 8601
  duration?: number;            // minutos
  speed?: number;
  speedLimit?: number;
  geofenceName?: string;
  address?: string;
}

interface Trip {
  id: string;
  vehicleId: string;
  startTime: string;            // ISO 8601
  endTime: string;              // ISO 8601
  totalDistance: number;        // metros
  travelTime: number;           // minutos
  stoppedTime: number;          // minutos
  averageSpeed: number;         // km/h
  maxSpeed: number;             // km/h
  stopsCount: number;
  points: LocationPoint[];
  events: RouteEvent[];
}
```

### TrackingData (Dados de Rastreamento)

```typescript
interface TrackingData {
  licensePlate: string;        // obrigatório
  latitude: number;             // obrigatório, -90 a 90
  longitude: number;            // obrigatório, -180 a 180
  speed: number;               // obrigatório, ≥ 0
  heading?: number;             // 0-360
  accuracy?: number;            // metros, ≥ 0
  timestamp?: string;           // ISO 8601
}
```

### SpeedViolation

```typescript
interface SpeedViolation {
  id: string;
  vehicleId: string;
  vehicleName: string;
  speed: number;
  speedLimit: number;
  excessSpeed: number;
  timestamp: string;           // ISO 8601
  latitude: number;
  longitude: number;
  duration: number;             // segundos
}
```

### VehicleStats

```typescript
interface VehicleStats {
  totalViolations: number;
  vehiclesWithViolations: number;
  averageExcessSpeed: number;
  violationsByDay: Array<{
    date: string;
    count: number;
  }>;
  topViolators: Array<{
    vehicleId: string;
    vehicleName: string;
    totalViolations: number;
    averageExcessSpeed: number;
    lastViolation: string;      // ISO 8601
  }>;
}
```

---

## Tratamento de Erros

Todos os endpoints seguem um padrão consistente de tratamento de erros.

### Erro de Validação (400 Bad Request)

Quando os dados enviados são inválidos:

```json
{
  "error": "Invalid vehicle data",
  "details": [
    {
      "path": ["latitude"],
      "message": "Expected number, received string",
      "code": "invalid_type"
    },
    {
      "path": ["speed"],
      "message": "Number must be greater than or equal to 0",
      "code": "too_small"
    }
  ]
}
```

### Erro de Autenticação (401 Unauthorized)

Quando o token está ausente, inválido ou expirado:

```json
{
  "error": "Token inválido ou expirado"
}
```

Para login com credenciais inválidas:

```json
{
  "error": "Credenciais inválidas",
  "message": "Email ou senha incorretos"
}
```

### Erro de Autorização (403 Forbidden)

Quando o usuário não tem permissão suficiente:

```json
{
  "error": "Acesso negado",
  "message": "Apenas administradores podem criar veículos"
}
```

### Erro de Não Encontrado (404 Not Found)

Quando o recurso solicitado não existe:

```json
{
  "error": "Vehicle not found"
}
```

Para endpoints de rastreamento:

```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo encontrado com a placa: XYZ-9999"
}
```

### Erro do Servidor (500 Internal Server Error)

Quando ocorre um erro interno:

```json
{
  "error": "Failed to fetch vehicles"
}
```

---

## Exemplos Práticos

### Fluxo Completo: Login, Criar Veículo e Rastrear

```bash
# 1. Fazer login e obter token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetrack.com",
    "password": "senha123"
  }' | jq -r '.token')

# 2. Criar um veículo (requer permissão de admin)
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Meu Veículo",
    "licensePlate": "TEST-0001",
    "status": "stopped",
    "ignition": "off",
    "currentSpeed": 0,
    "speedLimit": 60,
    "heading": 0,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 10,
    "lastUpdate": "2024-12-08T14:30:00.000Z"
  }'

# 2. Enviar localização inicial
curl -X POST http://localhost:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "TEST-0001",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 0,
    "heading": 0,
    "accuracy": 5
  }'

# 3. Simular movimento
curl -X POST http://localhost:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "TEST-0001",
    "latitude": -23.5510,
    "longitude": -46.6340,
    "speed": 50,
    "heading": 90,
    "accuracy": 5
  }'

# 4. Verificar veículo atualizado
curl http://localhost:5000/api/vehicles/TEST-0001
```

### Integração com Aplicativo Mobile

```javascript
// Exemplo de função para enviar localização do GPS
async function sendLocation(licensePlate, position) {
  const trackingData = {
    licensePlate: licensePlate,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    speed: position.coords.speed || 0,
    heading: position.coords.heading || 0,
    accuracy: position.coords.accuracy || 0,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:5000/api/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trackingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar localização');
    }

    const result = await response.json();
    console.log('Localização enviada:', result);
    return result;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Usar geolocation API do navegador
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      sendLocation('TEST-0001', position);
    },
    (error) => {
      console.error('Erro GPS:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}
```

### Monitoramento em Tempo Real com WebSocket

```javascript
// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'vehicles') {
    // Atualizar mapa com novas posições
    message.data.forEach(vehicle => {
      updateVehicleMarker(vehicle);
    });
  }
};

function updateVehicleMarker(vehicle) {
  // Lógica para atualizar marcador no mapa
  console.log(`Veículo ${vehicle.name} atualizado:`, {
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    speed: vehicle.currentSpeed,
    status: vehicle.status
  });
}
```

### Criar Geofence e Monitorar Entrada/Saída

```bash
# 1. Fazer login e obter token (requer permissão de admin)
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetrack.com",
    "password": "senha123"
  }' | jq -r '.token')

# 2. Criar geofence circular
curl -X POST http://localhost:5000/api/geofences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Depósito Central",
    "description": "Área principal",
    "type": "circle",
    "active": true,
    "center": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "radius": 500,
    "rules": [
      {
        "type": "entry",
        "enabled": true,
        "toleranceSeconds": 30
      },
      {
        "type": "exit",
        "enabled": true,
        "toleranceSeconds": 30
      }
    ],
    "vehicleIds": ["v1"]
  }'

# 3. Verificar alertas gerados quando veículo entra/sai
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### Gerar Relatório de Violações

```bash
# 1. Fazer login e obter token (requer permissão de admin)
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetrack.com",
    "password": "senha123"
  }' | jq -r '.token')

# 2. Obter estatísticas dos últimos 7 dias
curl "http://localhost:5000/api/reports/speed-stats?startDate=2024-12-01T00:00:00Z&endDate=2024-12-08T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"

# 3. Listar todas as violações detalhadas
curl "http://localhost:5000/api/reports/violations?startDate=2024-12-01T00:00:00Z&endDate=2024-12-08T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Notas Importantes

### Validação

- Todos os endpoints de criação/atualização usam **Zod** para validação
- Erros de validação retornam código `400` com detalhes específicos
- Validação inclui tipos, ranges, formatos e obrigatoriedade

### Performance

- Endpoints de listagem não têm paginação implementada
- Para grandes volumes de dados, considere implementar paginação
- WebSocket é eficiente para atualizações em tempo real

### Segurança

- ✅ **Autenticação JWT implementada** - Todos os endpoints (exceto alguns públicos) requerem token válido
- ✅ **Autorização baseada em roles** - Administradores têm acesso completo, usuários comuns têm acesso limitado
- ✅ **Row Level Security (RLS)** - Usuários comuns veem apenas seus próprios dados
- ⚠️ Endpoint `/api/tracking` é público - Mantido público para permitir envio de dados de dispositivos GPS sem autenticação
- ⚠️ CORS permite qualquer origem - Restringir em produção para domínios específicos

### Limitações Conhecidas

- Histórico de viagens é calculado em tempo real (não há cache)
- Alertas são gerados automaticamente, mas não há sistema de notificações push
- ✅ Suporte para múltiplos usuários implementado - Usuários comuns veem apenas seus próprios veículos e alertas

---

## Suporte e Contato

Para dúvidas ou problemas:

1. Verifique os logs do servidor (console)
2. Valide os dados enviados usando os schemas fornecidos
3. Verifique o código de status HTTP da resposta
4. Consulte as mensagens de erro detalhadas retornadas pela API

---

**Última atualização:** Janeiro 2025  
**Versão da API:** 1.1.0

**Mudanças na versão 1.1.0:**
- ✅ Implementada autenticação JWT via Supabase Auth
- ✅ Adicionados endpoints de autenticação (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
- ✅ Implementada autorização baseada em roles (admin/user)
- ✅ Filtragem de dados por usuário (usuários comuns veem apenas seus próprios veículos e alertas)
- ✅ Endpoints de veículos, geofences e relatórios agora requerem autenticação e/ou permissão de administrador



