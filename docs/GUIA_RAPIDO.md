# Guia Rápido - Referência Rápida

Referência rápida das funcionalidades principais do sistema.

## 🚗 CRUD de Veículos

### Criar Veículo
1. Menu → **Veículos** → **+ Novo Veículo**
2. Preencha os campos
3. Use **"Obter Localização GPS"** para preencher coordenadas automaticamente
4. Clique em **"Criar Veículo"**

### Editar Veículo
1. Menu → **Veículos**
2. Clique em **"Editar"** no veículo
3. Modifique os campos
4. Clique em **"Salvar Alterações"**

### Excluir Veículo
1. Menu → **Veículos**
2. Clique em **"Excluir"** no veículo
3. Confirme

## 📍 Rastreamento em Tempo Real

### Via Página de Teste
```
/test-tracking
```
1. Selecione veículo
2. Clique em **"Iniciar Rastreamento (GPS)"**

### Via API
```bash
POST /api/tracking
{
  "licensePlate": "ABC-1234",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "speed": 65
}
```

## 🗺️ Dashboard

### Acessar
```
/
```

### Funcionalidades
- Ver todos os veículos no mapa
- Filtrar por status
- Buscar veículos
- Ver detalhes do veículo selecionado

## 🔔 Alertas

### Acessar
```
/alerts
```

### Ações
- Marcar como lido
- Marcar todos como lidos
- Limpar alertas lidos

## 🛡️ Geofences

### Criar
1. Menu → **Geofences** → **Criar**
2. Desenhe no mapa
3. Configure regras
4. Salve

## 📊 Relatórios

### Acessar
```
/reports
```

### Tipos
- Violações de velocidade
- Estatísticas de velocidade

## 📈 Histórico

### Acessar
```
/history
```

### Visualizar
1. Selecione veículo
2. Configure período
3. Veja viagens e eventos

## 🔌 Endpoints Principais

| Método | Endpoint | Função |
|--------|----------|--------|
| GET | `/api/vehicles` | Listar veículos |
| POST | `/api/vehicles` | Criar veículo |
| PATCH | `/api/vehicles/:id` | Atualizar veículo |
| DELETE | `/api/vehicles/:id` | Deletar veículo |
| POST | `/api/tracking` | Enviar localização |
| WS | `/ws` | WebSocket (tempo real) |

## 📱 Testar com Smartphone

### Com ngrok
```bash
ngrok http 5000
# Use a URL HTTPS gerada
```

### Acessar
```
https://sua-url-ngrok.ngrok-free.app/test-tracking
```

## 🎯 Atalhos Rápidos

### Criar Veículo com GPS
1. `/vehicles` → **+ Novo Veículo**
2. Preencha nome e placa
3. Clique em **"Obter Localização GPS"**
4. Salve

### Rastrear Smartphone
1. `/test-tracking`
2. Selecione veículo
3. **"Iniciar Rastreamento (GPS)"**
4. Veja no Dashboard (`/`)

### Ver Veículo no Mapa
1. `/` (Dashboard)
2. Clique no veículo na lista
3. Veja no mapa

## ⚡ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Banco de dados
npm run db:push

# Verificar TypeScript
npm run check
```

## 🔑 Campos Obrigatórios - Veículo

- ✅ Nome
- ✅ Placa
- ✅ Status
- ✅ Ignição
- ✅ Velocidade Atual
- ✅ Limite de Velocidade
- ✅ Direção
- ✅ Latitude
- ✅ Longitude
- ✅ Precisão

**Opcionais:**
- Modelo
- Nível de Bateria

## 📝 Status do Veículo

- **stopped** - Parado (0 km/h)
- **idle** - Ocioso (1-4 km/h)
- **moving** - Em Movimento (≥5 km/h)
- **offline** - Offline

## 🎨 Cores no Dashboard

- 🟢 **Verde** - Em Movimento
- 🟡 **Amarelo** - Parado/Ocioso
- ⚫ **Cinza** - Offline
- 🔴 **Vermelho** - Alerta (velocidade acima do limite)

## 🚀 Fluxo Completo de Teste

1. **Criar veículo:**
   - `/vehicles` → **+ Novo Veículo**
   - Use GPS para preencher localização
   - Salve

2. **Rastrear:**
   - `/test-tracking`
   - Selecione veículo
   - Inicie rastreamento

3. **Visualizar:**
   - `/` (Dashboard)
   - Veja veículo se movendo no mapa

## 📞 URLs Importantes

- **Dashboard:** `/`
- **Veículos:** `/vehicles`
- **Teste de Rastreamento:** `/test-tracking`
- **Histórico:** `/history`
- **Geofences:** `/geofences`
- **Alertas:** `/alerts`
- **Relatórios:** `/reports`

## 💡 Dicas Rápidas

- Use **ngrok** para GPS funcionar no smartphone
- **WebSocket** atualiza automaticamente (não precisa recarregar)
- **GPS nativo** funciona no formulário de veículos
- **Status** é calculado automaticamente pela velocidade
- **Velocidade** é calculada automaticamente se não fornecida

---

**Para mais detalhes, consulte:**
- [README.md](./README.md) - Documentação completa
- [INSTALACAO_E_CONFIGURACAO.md](./INSTALACAO_E_CONFIGURACAO.md) - Instalação
- [ENDPOINTS_API.md](./ENDPOINTS_API.md) - API completa





