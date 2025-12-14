# Documentação da API - Endpoints

Esta documentação descreve todos os endpoints disponíveis no sistema de controle de frotas.

## Base URL

```
http://localhost:5000/api
```

ou

```
http://SEU-IP:5000/api
```

---

## 🔵 WebSocket - Atualizações em Tempo Real

### `WS /ws`

Conexão WebSocket para receber atualizações de veículos em tempo real.

**Conexão:**
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'vehicles') {
    console.log('Veículos atualizados:', message.data);
  }
};
```

**Mensagens recebidas:**
- `{ type: "vehicles", data: Vehicle[] }` - Lista completa de veículos atualizada

**Comportamento:**
- Ao conectar, recebe imediatamente a lista atual de veículos
- Recebe atualizações automáticas sempre que um veículo é modificado
- Atualizações são enviadas quando:
  - Um veículo é criado, atualizado ou deletado
  - Dados de rastreamento são recebidos via `/api/tracking`

---

## 🚗 Veículos (Vehicles)

### `GET /api/vehicles`

Lista todos os veículos cadastrados.

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

**Exemplo de uso:**
```bash
curl http://localhost:5000/api/vehicles
```

---

### `GET /api/vehicles/:id`

Busca um veículo específico pelo ID.

**Parâmetros:**
- `id` (path) - ID do veículo

**Resposta (200 OK):**
```json
{
  "id": "v1",
  "name": "Caminhão 01",
  "licensePlate": "ABC-1234",
  ...
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

Cria um novo veículo.

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

**Campos obrigatórios:**
- `name` - Nome do veículo
- `licensePlate` - Placa do veículo
- `status` - Status: "moving" | "stopped" | "idle" | "offline"
- `ignition` - Ignição: "on" | "off"
- `currentSpeed` - Velocidade atual (km/h)
- `speedLimit` - Limite de velocidade (km/h)
- `heading` - Direção (0-360°)
- `latitude` - Latitude (-90 a 90)
- `longitude` - Longitude (-180 a 180)
- `accuracy` - Precisão GPS (metros)
- `lastUpdate` - Data/hora ISO 8601

**Campos opcionais:**
- `model` - Modelo do veículo
- `batteryLevel` - Nível de bateria (0-100)

**Resposta (201 Created):**
```json
{
  "id": "v1",
  "name": "Caminhão 01",
  ...
}
```

**Resposta (400 Bad Request):**
```json
{
  "error": "Invalid vehicle data",
  "details": [...]
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
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

---

### `PATCH /api/vehicles/:id`

Atualiza um veículo existente (campos parciais).

**Parâmetros:**
- `id` (path) - ID do veículo

**Body (JSON):** Qualquer campo do veículo (todos opcionais)
```json
{
  "name": "Novo Nome",
  "speedLimit": 80,
  "status": "moving"
}
```

**Resposta (200 OK):**
```json
{
  "id": "v1",
  "name": "Novo Nome",
  ...
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
curl -X PATCH http://localhost:5000/api/vehicles/v1 \
  -H "Content-Type: application/json" \
  -d '{"speedLimit": 80}'
```

---

### `DELETE /api/vehicles/:id`

Deleta um veículo.

**Parâmetros:**
- `id` (path) - ID do veículo

**Resposta (204 No Content):** Sem corpo

**Resposta (404 Not Found):**
```json
{
  "error": "Vehicle not found"
}
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:5000/api/vehicles/v1
```

---

## 📍 Rastreamento (Tracking)

### `POST /api/tracking`

**Endpoint principal para receber dados de rastreamento em tempo real.**

Este é o endpoint usado por dispositivos GPS, aplicativos móveis ou sistemas externos para enviar a localização de veículos.

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

**Campos obrigatórios:**
- `licensePlate` - Placa do veículo (deve existir no sistema)
- `latitude` - Latitude (-90 a 90)
- `longitude` - Longitude (-180 a 180)
- `speed` - Velocidade em km/h (≥ 0)

**Campos opcionais:**
- `heading` - Direção em graus (0-360)
- `accuracy` - Precisão GPS em metros (≥ 0)
- `timestamp` - Data/hora ISO 8601 (padrão: agora)

**Comportamento:**
1. Busca o veículo pela placa (`licensePlate`)
2. Atualiza a localização, velocidade e status do veículo
3. Calcula o status automaticamente:
   - `speed = 0` → `status: "stopped"`
   - `speed < 5` → `status: "idle"`
   - `speed ≥ 5` → `status: "moving"`
4. Atualiza `ignition` baseado na velocidade
5. Atualiza `lastUpdate` com timestamp atual
6. Envia atualização via WebSocket para todos os clientes conectados

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
      "message": "Expected number, received string"
    }
  ]
}
```

**Resposta (404 Not Found):**
```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo encontrado com a placa: ABC-1234"
}
```

**Exemplo de uso:**
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

**Exemplo JavaScript:**
```javascript
const trackingData = {
  licensePlate: "ABC-1234",
  latitude: -23.5505,
  longitude: -46.6333,
  speed: 65,
  heading: 180,
  accuracy: 5
};

fetch('http://localhost:5000/api/tracking', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(trackingData)
})
  .then(res => res.json())
  .then(data => console.log('Sucesso:', data))
  .catch(err => console.error('Erro:', err));
```

---

## 🛡️ Geofences

### `GET /api/geofences`

Lista todas as geofences.

**Resposta (200 OK):**
```json
[
  {
    "id": "g1",
    "name": "Depósito Central",
    "description": "Área principal",
    "type": "circle",
    "active": true,
    "center": { "latitude": -23.5505, "longitude": -46.6333 },
    "radius": 500,
    "rules": [...],
    "vehicleIds": ["v1", "v2"],
    "color": "#22c55e"
  }
]
```

---

### `GET /api/geofences/:id`

Busca uma geofence específica.

---

### `POST /api/geofences`

Cria uma nova geofence.

---

### `PATCH /api/geofences/:id`

Atualiza uma geofence.

---

### `DELETE /api/geofences/:id`

Deleta uma geofence.

---

## 🔔 Alertas (Alerts)

### `GET /api/alerts`

Lista todos os alertas.

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
    "speed": 95,
    "speedLimit": 60
  }
]
```

---

### `GET /api/alerts/:id`

Busca um alerta específico.

---

### `POST /api/alerts`

Cria um novo alerta.

---

### `PATCH /api/alerts/:id`

Atualiza um alerta (ex: marcar como lido).

**Exemplo:**
```bash
curl -X PATCH http://localhost:5000/api/alerts/a1 \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

---

### `POST /api/alerts/mark-all-read`

Marca todos os alertas como lidos.

**Resposta (200 OK):**
```json
{
  "success": true
}
```

---

### `DELETE /api/alerts/clear-read`

Remove todos os alertas já lidos.

---

## 📊 Relatórios e Histórico

### `GET /api/trips`

Busca viagens de um veículo.

**Query Parameters:**
- `vehicleId` (obrigatório) - ID do veículo
- `startDate` (opcional) - Data inicial ISO 8601
- `endDate` (opcional) - Data final ISO 8601

**Exemplo:**
```bash
curl "http://localhost:5000/api/trips?vehicleId=v1&startDate=2024-12-01&endDate=2024-12-08"
```

---

### `GET /api/reports/violations`

Lista violações de velocidade.

**Query Parameters:**
- `startDate` (opcional) - Padrão: 30 dias atrás
- `endDate` (opcional) - Padrão: agora

---

### `GET /api/reports/speed-stats`

Estatísticas de velocidade.

**Query Parameters:**
- `startDate` (opcional) - Padrão: 30 dias atrás
- `endDate` (opcional) - Padrão: agora

**Resposta:**
```json
{
  "totalViolations": 150,
  "vehiclesWithViolations": 5,
  "averageExcessSpeed": 12.5,
  "violationsByDay": [...],
  "topViolators": [...]
}
```

---

## 🔐 Autenticação

**Status atual:** Nenhuma autenticação implementada.

**Recomendação para produção:**
- Implementar autenticação via JWT ou API Key
- Adicionar middleware de autenticação nos endpoints
- Especialmente importante para `/api/tracking` (endpoint público)

---

## 📝 Validação

Todos os endpoints usam **Zod** para validação de dados:

- Endpoints de criação/atualização validam o schema antes de processar
- Retornam erros detalhados (400 Bad Request) com lista de problemas
- Validação inclui tipos, ranges e formatos

---

## 🌐 CORS e Headers

**Headers aceitos:**
- `Content-Type: application/json` (para POST/PATCH)

**CORS:**
- Configurado para aceitar requisições de qualquer origem (desenvolvimento)
- Em produção, configurar CORS adequadamente

---

## ⚠️ Códigos de Status HTTP

- `200 OK` - Sucesso
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Sucesso sem conteúdo (DELETE)
- `400 Bad Request` - Dados inválidos
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

---

## 🔄 Fluxo de Rastreamento em Tempo Real

1. **Dispositivo GPS/Aplicativo** envia dados para `POST /api/tracking`
2. **Servidor** valida e atualiza o veículo no banco de dados
3. **Servidor** envia atualização via WebSocket (`/ws`) para todos os clientes conectados
4. **Dashboard Web** recebe atualização e atualiza o mapa em tempo real

**Exemplo de fluxo completo:**
```
Smartphone → POST /api/tracking → Servidor atualiza veículo → WebSocket broadcast → Dashboard atualiza
```

---

## 📚 Exemplos Práticos

### Criar veículo e começar a rastrear

```bash
# 1. Criar veículo
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
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

# 2. Enviar localização
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
```

---

## 🐛 Tratamento de Erros

Todos os endpoints seguem padrão consistente:

**Erro de validação (400):**
```json
{
  "error": "Mensagem de erro",
  "details": [
    {
      "path": ["campo"],
      "message": "Descrição do erro"
    }
  ]
}
```

**Erro de não encontrado (404):**
```json
{
  "error": "Recurso não encontrado",
  "message": "Descrição adicional"
}
```

**Erro do servidor (500):**
```json
{
  "error": "Mensagem de erro genérica"
}
```

---

## 📞 Suporte

Para dúvidas ou problemas com a API, verifique:
1. Logs do servidor (console)
2. Validação dos dados enviados
3. Status HTTP da resposta
4. Mensagens de erro detalhadas






