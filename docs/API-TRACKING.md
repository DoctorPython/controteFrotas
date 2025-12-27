# API de Rastreamento em Tempo Real

Esta documentação descreve como utilizar o endpoint de rastreamento para enviar dados de localização de veículos em tempo real.

## Endpoint

```
POST /api/tracking
```

## Descrição

Este endpoint permite que dispositivos de rastreamento (GPS trackers, aplicativos móveis, etc.) enviem dados de localização em tempo real para atualizar a posição de um veículo no sistema.

## Autenticação

Atualmente, o endpoint não requer autenticação. Em ambiente de produção, recomenda-se implementar autenticação via API Key ou JWT.

## Corpo da Requisição

O corpo da requisição deve ser enviado em formato JSON com os seguintes campos:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `licensePlate` | string | ✅ Sim | Placa do veículo (ex: "ABC-1234") |
| `latitude` | number | ✅ Sim | Latitude em graus decimais (-90 a 90) |
| `longitude` | number | ✅ Sim | Longitude em graus decimais (-180 a 180) |
| `speed` | number | ✅ Sim | Velocidade atual em km/h (mínimo: 0) |
| `heading` | number | ❌ Não | Direção/rumo em graus (0 a 360) |
| `accuracy` | number | ❌ Não | Precisão do GPS em metros |
| `timestamp` | string | ❌ Não | Data/hora da leitura em formato ISO 8601 |

## Exemplo de Requisição

### cURL

```bash
curl -X POST http://localhost:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 65,
    "heading": 180,
    "accuracy": 5,
    "timestamp": "2024-12-08T14:30:00.000Z"
  }'
```

### JavaScript (Fetch)

```javascript
const trackingData = {
  licensePlate: "ABC-1234",
  latitude: -23.5505,
  longitude: -46.6333,
  speed: 65,
  heading: 180,
  accuracy: 5
};

fetch("http://localhost:5000/api/tracking", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(trackingData)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Erro:", error));
```

### Python

```python
import requests

tracking_data = {
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "speed": 65,
    "heading": 180,
    "accuracy": 5
}

response = requests.post(
    "http://localhost:5000/api/tracking",
    json=tracking_data
)

print(response.json())
```

### C# (.NET)

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

var trackingData = new {
    licensePlate = "ABC-1234",
    latitude = -23.5505,
    longitude = -46.6333,
    speed = 65,
    heading = 180,
    accuracy = 5
};

using var client = new HttpClient();
var json = JsonSerializer.Serialize(trackingData);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("http://localhost:5000/api/tracking", content);
var result = await response.Content.ReadAsStringAsync();
Console.WriteLine(result);
```

## Respostas

### Sucesso (200 OK)

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

### Erro de Validação (400 Bad Request)

Quando os dados enviados são inválidos:

```json
{
  "error": "Dados de rastreamento inválidos",
  "details": [
    {
      "code": "too_small",
      "minimum": -90,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to -90",
      "path": ["latitude"]
    }
  ]
}
```

### Veículo Não Encontrado (404 Not Found)

Quando a placa informada não corresponde a nenhum veículo cadastrado:

```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo encontrado com a placa: XYZ-9999"
}
```

### Erro Interno (500 Internal Server Error)

```json
{
  "error": "Falha ao processar dados de rastreamento"
}
```

## Comportamento Automático

Ao receber os dados de rastreamento, o sistema realiza automaticamente:

1. **Atualização de Status**: 
   - Se `speed > 0`: status = `"moving"` e ignição = `"on"`
   - Se `speed = 0`: status = `"stopped"`

2. **Timestamp**: Se não informado, utiliza a data/hora atual do servidor

3. **WebSocket Broadcast**: Todos os clientes conectados via WebSocket recebem a atualização em tempo real

## Integração com Dispositivos GPS

### Frequência de Envio Recomendada

| Situação | Intervalo |
|----------|-----------|
| Veículo em movimento | 5-15 segundos |
| Veículo parado | 30-60 segundos |
| Economia de bateria | 1-5 minutos |

### Exemplo de Integração com Arduino/ESP32

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

const char* serverUrl = "http://SEU_SERVIDOR:5000/api/tracking";
const char* licensePlate = "ABC-1234";

void sendTrackingData(float lat, float lng, float speed, float heading) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<256> doc;
    doc["licensePlate"] = licensePlate;
    doc["latitude"] = lat;
    doc["longitude"] = lng;
    doc["speed"] = speed;
    doc["heading"] = heading;
    
    String json;
    serializeJson(doc, json);
    
    int httpCode = http.POST(json);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println(response);
    }
    
    http.end();
  }
}
```

## Notas Importantes

1. **Veículo deve existir**: O veículo com a placa informada deve estar previamente cadastrado no sistema.

2. **Coordenadas válidas**: Latitude deve estar entre -90 e 90, longitude entre -180 e 180.

3. **Velocidade não negativa**: O valor de velocidade deve ser maior ou igual a zero.

4. **Formato de data**: Use o padrão ISO 8601 (ex: `"2024-12-08T14:30:00.000Z"`)

## Suporte

Para dúvidas ou problemas, consulte a documentação completa ou entre em contato com a equipe de desenvolvimento.






