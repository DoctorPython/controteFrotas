# Guia de Instalação e Configuração

Este guia explica como instalar, configurar e executar o sistema de controle de frotas.

## 📋 Pré-requisitos

### Software Necessário

- **Node.js** 18.0.0 ou superior
- **npm** 9.0.0 ou superior (vem com Node.js)
- **Git** (opcional, para clonar o repositório)

### Verificar Instalação

```bash
node --version
# Deve mostrar: v18.x.x ou superior

npm --version
# Deve mostrar: 9.x.x ou superior
```

## 🚀 Instalação

### 1. Clonar/Baixar o Projeto

Se você já tem o projeto, pule para o passo 2.

```bash
# Se usar Git
git clone <url-do-repositorio>
cd controle-frotas

# Ou extraia o arquivo ZIP do projeto
```

### 2. Instalar Dependências

```bash
npm install
```

Este comando instalará todas as dependências necessárias:
- React e dependências do frontend
- Express e dependências do backend
- Drizzle ORM para banco de dados
- Outras bibliotecas necessárias

**Tempo estimado:** 2-5 minutos (dependendo da conexão)

### 3. Configurar Variáveis de Ambiente (Opcional)

O sistema funciona sem configuração adicional usando armazenamento em memória.

Para usar Supabase (banco de dados real):

1. Crie um arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=sua-url-do-supabase
SUPABASE_KEY=sua-chave-do-supabase
```

2. Configure as variáveis no arquivo `server/supabase.ts`

## 🏃 Executar o Sistema

### Modo Desenvolvimento

```bash
npm run dev
```

O sistema iniciará em:
- **Frontend + Backend:** `http://localhost:5000`
- **API:** `http://localhost:5000/api`

### Modo Produção

```bash
# 1. Build do projeto
npm run build

# 2. Iniciar servidor
npm start
```

## 🔧 Configurações Adicionais

### Porta do Servidor

Por padrão, o servidor roda na porta **5000**.

Para mudar, configure a variável de ambiente:

```bash
# Windows (PowerShell)
$env:PORT=3000
npm run dev

# Linux/Mac
PORT=3000 npm run dev
```

### Banco de Dados

#### Opção 1: Memória (Padrão - Desenvolvimento)

O sistema usa armazenamento em memória por padrão. Não requer configuração.

**Vantagens:**
- ✅ Rápido para desenvolvimento
- ✅ Não precisa de banco de dados
- ✅ Dados resetam ao reiniciar

**Desvantagens:**
- ❌ Dados são perdidos ao reiniciar
- ❌ Não adequado para produção

#### Opção 2: Supabase (Produção)

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as variáveis de ambiente
4. Execute as migrações:

```bash
npm run db:push
```

**Vantagens:**
- ✅ Persistência de dados
- ✅ Adequado para produção
- ✅ Escalável

## 📱 Configurar para Teste com Smartphone

### Opção 1: Rede Local

1. Descubra o IP da sua máquina:

**Windows:**
```cmd
ipconfig
# Procure por "IPv4 Address"
```

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr
```

2. No smartphone (mesma rede Wi-Fi):
   - Acesse: `http://SEU-IP:5000`
   - Exemplo: `http://192.168.0.16:5000`

**⚠️ Limitação:** GPS não funcionará via HTTP

### Opção 2: ngrok (Recomendado)

1. Instale o ngrok (veja [CONFIGURAR_NGROK.md](./CONFIGURAR_NGROK.md))

2. Inicie o ngrok:
```bash
ngrok http 5000
```

3. Copie a URL HTTPS (ex: `https://abc123.ngrok-free.app`)

4. No smartphone:
   - Acesse: `https://abc123.ngrok-free.app`
   - GPS funcionará perfeitamente! ✅

**Documentação completa:** [Configurar ngrok](./CONFIGURAR_NGROK.md)

## 🧪 Verificar Instalação

### 1. Acesse o Sistema

Abra o navegador em: `http://localhost:5000`

Você deve ver:
- ✅ Interface do Dashboard
- ✅ Menu de navegação
- ✅ Mapa (pode estar vazio inicialmente)

### 2. Teste o CRUD de Veículos

1. Clique em **"Veículos"** no menu
2. Clique em **"+ Novo Veículo"**
3. Preencha os campos
4. Clique em **"Criar Veículo"**
5. Verifique se o veículo aparece na lista

### 3. Teste o Rastreamento

1. Acesse: `http://localhost:5000/test-tracking`
2. Selecione um veículo
3. Teste o envio de localização

## 🐛 Problemas Comuns

### "Port already in use"

A porta 5000 já está em uso. Soluções:

1. **Mude a porta:**
```bash
PORT=3000 npm run dev
```

2. **Ou pare o processo na porta 5000:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### "Cannot find module"

Reinstale as dependências:

```bash
rm -rf node_modules package-lock.json
npm install
```

### "npm: command not found"

Instale o Node.js:
- Download: https://nodejs.org/
- Escolha a versão LTS

### Erro ao executar `npm run dev`

1. Verifique se está na pasta correta:
```bash
cd controle-frotas
```

2. Verifique se as dependências estão instaladas:
```bash
npm install
```

3. Verifique os logs de erro no terminal

## 📦 Estrutura do Projeto

```
controle-frotas/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/       # Páginas (Dashboard, Veículos, etc.)
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── hooks/       # Hooks customizados
│   │   └── lib/         # Utilitários
│   └── index.html
├── server/              # Backend Express
│   ├── index.ts         # Servidor principal
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Camada de dados (memória)
│   └── supabase-storage.ts # Camada de dados (Supabase)
├── shared/              # Código compartilhado
│   └── schema.ts        # Schemas Zod
├── docs/                # Documentação
├── package.json         # Dependências e scripts
└── tsconfig.json        # Configuração TypeScript
```

## 🔄 Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run check        # Verifica erros TypeScript
```

### Produção

```bash
npm run build        # Compila o projeto
npm start            # Inicia servidor de produção
```

### Banco de Dados

```bash
npm run db:push      # Aplica migrações do banco
```

## 🌐 Acessar de Outros Dispositivos

### Na Mesma Rede

1. Descubra seu IP local
2. No outro dispositivo, acesse: `http://SEU-IP:5000`

### De Qualquer Lugar

Use ngrok (veja [CONFIGURAR_NGROK.md](./CONFIGURAR_NGROK.md))

## ✅ Checklist de Instalação

- [ ] Node.js instalado (v18+)
- [ ] npm instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Sistema acessível em `http://localhost:5000`
- [ ] Página de veículos funcionando
- [ ] (Opcional) ngrok configurado para GPS
- [ ] (Opcional) Supabase configurado para produção

## 🎯 Próximos Passos

Após instalação bem-sucedida:

1. **Crie alguns veículos** - Use a página de veículos
2. **Configure ngrok** - Para testar GPS no smartphone
3. **Teste o rastreamento** - Use a página `/test-tracking`
4. **Explore o Dashboard** - Veja os veículos no mapa
5. **Leia a documentação** - Veja [README.md](./README.md)

## 📚 Documentação Relacionada

- [README.md](./README.md) - Visão geral do sistema
- [CONFIGURAR_NGROK.md](./CONFIGURAR_NGROK.md) - Configurar HTTPS
- [GUIA_RASTREAMENTO_SMARTPHONE.md](./GUIA_RASTREAMENTO_SMARTPHONE.md) - Testar com smartphone
- [ENDPOINTS_API.md](./ENDPOINTS_API.md) - Documentação da API

---

**Pronto para começar!** 🚀

Se encontrar problemas, consulte a seção "Problemas Comuns" acima ou verifique os logs do servidor.






