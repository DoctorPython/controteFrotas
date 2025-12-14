# Documentação - Sistema de Controle de Frotas

Bem-vindo à documentação completa do sistema de rastreamento veicular em tempo real.

## 📚 Índice da Documentação

### 🚀 Guias de Início Rápido

1. **[Configurar ngrok](./CONFIGURAR_NGROK.md)** - Configure HTTPS para testar GPS no smartphone
2. **[Rastreamento com Smartphone](./GUIA_RASTREAMENTO_SMARTPHONE.md)** - Como usar seu smartphone para rastreamento em tempo real
3. **[API de Rastreamento](./API-TRACKING.md)** - Documentação da API de tracking

### 🔧 Documentação Técnica

4. **[Endpoints da API](./ENDPOINTS_API.md)** - Documentação completa de todos os endpoints REST
5. **[CRUD de Veículos](#crud-de-veículos)** - Como gerenciar veículos no sistema

---

## 🎯 Visão Geral do Sistema

O sistema de controle de frotas permite:

- ✅ **Rastreamento em tempo real** de veículos via GPS
- ✅ **Gerenciamento completo** de veículos (CRUD)
- ✅ **Geofences** - Áreas de monitoramento
- ✅ **Alertas** - Notificações de velocidade, geofences, etc.
- ✅ **Relatórios** - Estatísticas e violações
- ✅ **Histórico** - Viagens e eventos
- ✅ **Dashboard interativo** com mapa em tempo real

---

## 🚗 CRUD de Veículos

### Acessar a Página de Veículos

1. No menu de navegação, clique em **"Veículos"**
2. Ou acesse diretamente: `/vehicles`

### Criar Novo Veículo

1. Clique no botão **"+ Novo Veículo"**
2. Preencha os campos:
   - **Nome** (obrigatório): Ex: "Caminhão 01"
   - **Placa** (obrigatório): Ex: "ABC-1234"
   - **Modelo** (opcional): Ex: "Mercedes Actros"
   - **Status**: Parado, Em Movimento, Ocioso ou Offline
   - **Ignição**: Ligada ou Desligada
   - **Velocidade Atual**: km/h
   - **Limite de Velocidade**: km/h
   - **Direção**: 0-360°
   - **Precisão**: metros
   - **Latitude/Longitude**: Coordenadas GPS
   - **Nível de Bateria** (opcional): 0-100%

3. **Dica:** Use o botão **"Obter Localização GPS"** para preencher automaticamente latitude, longitude, precisão e direção

4. Clique em **"Criar Veículo"**

### Editar Veículo

1. Na lista de veículos, clique em **"Editar"** no veículo desejado
2. Modifique os campos necessários
3. Use **"Obter Localização GPS"** para atualizar a localização
4. Clique em **"Salvar Alterações"**

### Excluir Veículo

1. Na lista de veículos, clique em **"Excluir"** no veículo desejado
2. Confirme a exclusão

### Visualizar Detalhes

1. Clique em um veículo na lista
2. Os detalhes aparecerão no painel direito com:
   - Informações básicas
   - Localização atual
   - Velocidade e direção
   - Status do sistema

---

## 📍 Funcionalidade GPS Nativa

### Obter Localização no Formulário

O sistema possui funcionalidade GPS integrada no formulário de veículos:

1. **Ao criar ou editar um veículo:**
   - Clique no botão **"Obter Localização GPS"**
   - Permita o acesso à localização
   - Os campos são preenchidos automaticamente:
     - ✅ Latitude
     - ✅ Longitude
     - ✅ Precisão
     - ✅ Direção

2. **Requisitos:**
   - HTTPS (use ngrok para desenvolvimento)
   - Permissão de localização no navegador
   - GPS ativo no dispositivo

### Tratamento de Erros

O sistema exibe mensagens claras quando:
- GPS não está disponível
- HTTPS não está configurado
- Permissão negada
- Timeout ao obter localização

---

## 🔄 Rastreamento em Tempo Real

### Opção 1: Página de Teste (Recomendado para Testes)

1. Acesse: `/test-tracking`
2. Selecione um veículo
3. Clique em **"Iniciar Rastreamento (GPS)"**
4. O sistema enviará localização automaticamente

**Documentação completa:** [Guia de Rastreamento com Smartphone](./GUIA_RASTREAMENTO_SMARTPHONE.md)

### Opção 2: API Direta

Envie dados via `POST /api/tracking`:

```bash
curl -X POST https://seu-servidor.com/api/tracking \
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

**Documentação completa:** [API de Rastreamento](./API-TRACKING.md)

---

## 🗺️ Dashboard

### Visualizar Veículos no Mapa

1. Acesse o **Dashboard** (`/`)
2. Veja todos os veículos no mapa em tempo real
3. Clique em um veículo na lista para ver detalhes
4. Use **"Seguir veículo"** para acompanhar o movimento

### Funcionalidades do Dashboard

- ✅ Mapa interativo com todos os veículos
- ✅ Atualização em tempo real via WebSocket
- ✅ Filtros por status (Todos, Em Movimento, Parados, etc.)
- ✅ Busca de veículos
- ✅ Painel de detalhes do veículo selecionado
- ✅ Visualização de geofences

---

## 🔔 Alertas

### Visualizar Alertas

1. Acesse **"Alertas"** no menu
2. Veja todos os alertas do sistema:
   - Violações de velocidade
   - Entrada/saída de geofences
   - Alertas do sistema

### Gerenciar Alertas

- Marcar como lido
- Marcar todos como lidos
- Limpar alertas lidos
- Filtrar por tipo e prioridade

---

## 🛡️ Geofences

### Criar Geofence

1. Acesse **"Geofences"** no menu
2. Clique em **"Criar"**
3. Configure:
   - Nome e descrição
   - Tipo (Círculo ou Polígono)
   - Área no mapa
   - Regras (entrada, saída, permanência)
   - Veículos associados

### Gerenciar Geofences

- Ativar/desativar
- Editar configurações
- Excluir
- Visualizar no mapa

---

## 📊 Relatórios

### Tipos de Relatórios

1. **Violações de Velocidade**
   - Lista todas as violações
   - Filtro por data
   - Estatísticas por veículo

2. **Estatísticas de Velocidade**
   - Total de violações
   - Veículos com violações
   - Velocidade média excedida
   - Top violadores

### Acessar Relatórios

1. Clique em **"Relatórios"** no menu
2. Selecione o tipo de relatório
3. Configure filtros de data
4. Visualize gráficos e estatísticas

---

## 📈 Histórico

### Visualizar Histórico de Viagens

1. Acesse **"Histórico"** no menu
2. Selecione um veículo
3. Configure período (data inicial e final)
4. Veja:
   - Viagens realizadas
   - Pontos de parada
   - Eventos (partida, chegada, violações)
   - Distância percorrida
   - Tempo de viagem

---

## 🔌 WebSocket - Atualizações em Tempo Real

O sistema usa WebSocket para atualizações em tempo real:

- **Endpoint:** `WS /ws`
- **Conexão automática** quando você abre o Dashboard
- **Atualizações instantâneas** quando veículos mudam de posição
- **Sem necessidade de polling** - economia de recursos

**Documentação completa:** [Endpoints da API](./ENDPOINTS_API.md#webSocket)

---

## 🛠️ Configuração e Desenvolvimento

### Requisitos

- Node.js 18+
- npm ou yarn
- Banco de dados (Supabase ou memória)

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
npm start
```

### Banco de Dados

```bash
npm run db:push
```

---

## 🔐 Segurança

### Autenticação

**Status atual:** Não implementada (desenvolvimento)

**Recomendações para produção:**
- Implementar autenticação JWT
- Adicionar API Key para `/api/tracking`
- Configurar CORS adequadamente
- Usar HTTPS sempre

---

## 📱 Testando com Smartphone

### Configuração Rápida

1. **Configure ngrok:**
   ```bash
   ngrok http 5000
   ```

2. **Copie a URL HTTPS** (ex: `https://abc123.ngrok-free.app`)

3. **No smartphone:**
   - Acesse: `https://abc123.ngrok-free.app/test-tracking`
   - Selecione um veículo
   - Inicie o rastreamento

**Documentação completa:** [Configurar ngrok](./CONFIGURAR_NGROK.md)

---

## 🐛 Troubleshooting

### GPS não funciona

- ✅ Use HTTPS (ngrok)
- ✅ Permita acesso à localização
- ✅ Verifique se o GPS está ativo
- ✅ Teste em modo anônimo/privado

### Veículo não atualiza no Dashboard

- ✅ Verifique se o WebSocket está conectado
- ✅ Verifique se está enviando dados via `/api/tracking`
- ✅ Recarregue a página

### Erro ao criar veículo

- ✅ Verifique se todos os campos obrigatórios estão preenchidos
- ✅ Verifique se as coordenadas são válidas
- ✅ Veja a mensagem de erro específica

---

## 📞 Suporte

### Documentação Adicional

- [Endpoints da API](./ENDPOINTS_API.md) - Referência completa da API
- [API de Rastreamento](./API-TRACKING.md) - Detalhes do endpoint de tracking
- [Configurar ngrok](./CONFIGURAR_NGROK.md) - Guia de configuração
- [Rastreamento com Smartphone](./GUIA_RASTREAMENTO_SMARTPHONE.md) - Guia passo a passo

### Estrutura do Projeto

```
controle-frotas/
├── client/          # Frontend React
│   └── src/
│       ├── pages/   # Páginas da aplicação
│       ├── components/ # Componentes reutilizáveis
│       └── hooks/    # Hooks customizados
├── server/          # Backend Express
│   ├── routes.ts    # Rotas da API
│   ├── storage.ts   # Camada de dados
│   └── index.ts     # Servidor principal
├── shared/          # Código compartilhado
│   └── schema.ts    # Schemas Zod
└── docs/            # Documentação
```

---

## 🎉 Funcionalidades Implementadas

### ✅ CRUD Completo de Veículos
- Criar, ler, atualizar e deletar veículos
- Formulário com validação
- GPS nativo no formulário
- Lista com filtros e busca

### ✅ Rastreamento em Tempo Real
- Endpoint `/api/tracking`
- Cálculo automático de velocidade
- Cálculo automático de status
- Atualização via WebSocket

### ✅ Dashboard Interativo
- Mapa com todos os veículos
- Atualização em tempo real
- Painel de detalhes
- Filtros e busca

### ✅ Geofences
- Criação de áreas de monitoramento
- Regras configuráveis
- Visualização no mapa

### ✅ Alertas
- Notificações em tempo real
- Diferentes tipos e prioridades
- Gerenciamento de alertas

### ✅ Relatórios
- Violações de velocidade
- Estatísticas detalhadas
- Gráficos e visualizações

### ✅ Histórico
- Viagens e eventos
- Filtros por data
- Visualização de rotas

---

**Última atualização:** Dezembro 2024

**Versão:** 1.0.0





