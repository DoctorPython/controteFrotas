# Configurar ngrok para Teste de Rastreamento

O ngrok cria um túnel HTTPS seguro para seu servidor local, permitindo que o GPS funcione corretamente no smartphone.

## 📥 Instalação

### Windows

1. **Baixe o ngrok:**
   - Acesse: https://ngrok.com/download
   - Baixe a versão para Windows
   - Extraia o arquivo `ngrok.exe`

2. **Ou use via Chocolatey:**
   ```powershell
   choco install ngrok
   ```

3. **Ou use via npm (se tiver Node.js):**
   ```bash
   npm install -g ngrok
   ```

### Linux/Mac

```bash
# Via Homebrew (Mac)
brew install ngrok

# Ou baixe direto do site
# https://ngrok.com/download
```

## 🔑 Configuração Inicial (Opcional mas Recomendado)

1. **Crie uma conta gratuita:**
   - Acesse: https://dashboard.ngrok.com/signup
   - Crie uma conta gratuita

2. **Obtenha seu authtoken:**
   - Após criar a conta, vá em:n https://dashboard.ngrok.com/get-started/your-authtoke
   - Copie o token = export NGROK_AUTHTOKEN=36aWU4GAzsPYWU6qfAeJ4kPPAZX_7xbL6KpTfYdqMgXJbiGzr

3. **Configure o ngrok:**
   ```bash
   ngrok config add-authtoken 36aWU4GAzsPYWU6qfAeJ4kPPAZX_7xbL6KpTfYdqMgXJbiGzr
   ```

**Nota:** Sem authtoken, o ngrok funciona mas com limitações (sessões de 2 horas, URLs aleatórias).

## 🚀 Como Usar

### 1. Inicie seu servidor

Primeiro, certifique-se de que seu servidor está rodando:

```bash
npm run dev
# ou
npm start
```

O servidor deve estar rodando na porta padrão (geralmente 5000).

### 2. Inicie o ngrok

Abra um novo terminal e execute:

```bash
ngrok http 5000
```

**Ou se sua porta for diferente:**

```bash
ngrok http 3000
# ou qualquer porta que seu servidor use
```

### 3. Obtenha a URL HTTPS

O ngrok mostrará algo assim:

```
Session Status                online
Account                       seu-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copie a URL HTTPS:** `https://abc123.ngrok-free.app`

### 4. Use no Smartphone

No seu smartphone, acesse:

```
https://abc123.ngrok-free.app/test-tracking
```

**Substitua `abc123.ngrok-free.app` pela URL que o ngrok gerou para você.**

## ✅ Vantagens do ngrok

1. **HTTPS automático** - GPS funciona perfeitamente
2. **Acesso de qualquer lugar** - Não precisa estar na mesma rede
3. **URL pública** - Pode testar de qualquer dispositivo
4. **Gratuito** - Plano free é suficiente para testes

## 📱 Teste Completo

### Passo a Passo:

1. **Terminal 1 - Servidor:**
   ```bash
   cd controle-frotas
   npm run dev
   ```

2. **Terminal 2 - ngrok:**
   ```bash
   ngrok http 5000
   ```

3. **Copie a URL HTTPS** que aparece (ex: `https://abc123.ngrok-free.app`)

4. **No smartphone:**
   - Acesse: `https://abc123.ngrok-free.app/test-tracking`
   - Selecione o veículo "Fumaça"
   - Clique em "Iniciar Rastreamento (GPS)"
   - **Agora o GPS funcionará!** ✅

5. **No Dashboard (outro dispositivo/aba):**
   - Acesse: `https://abc123.ngrok-free.app/`
   - Veja o veículo se movendo em tempo real!

## 🔧 Configurações Avançadas

### URL Fixa (Plano Pago)

Com plano pago, você pode ter uma URL fixa:

```bash
ngrok http 5000 --domain=seu-dominio.ngrok.app
```

### Acesso Local e Remoto

Você pode usar tanto:
- **Local:** `http://localhost:5000` (mesma máquina)
- **Rede local:** `http://192.168.0.16:5000` (mesma rede)
- **ngrok:** `https://abc123.ngrok-free.app` (qualquer lugar, HTTPS)

### Web Interface do ngrok

O ngrok também fornece uma interface web para monitorar requisições:

```
http://127.0.0.1:4040
```

Acesse no navegador para ver:
- Todas as requisições HTTP
- Headers e bodies
- Respostas
- Útil para debug!

## ⚠️ Limitações do Plano Gratuito

- **Sessões de 2 horas** - Precisa reiniciar o ngrok após 2h
- **URLs aleatórias** - Cada vez que iniciar, a URL muda
- **Limite de conexões** - Mas suficiente para testes

## 🎯 Exemplo Prático

```bash
# Terminal 1
$ npm run dev
> servindo na porta 5000

# Terminal 2
$ ngrok http 5000

# Output:
Forwarding  https://a1b2c3.ngrok-free.app -> http://localhost:5000

# No smartphone, acesse:
https://a1b2c3.ngrok-free.app/test-tracking

# No Dashboard, acesse:
https://a1b2c3.ngrok-free.app/
```

## 🐛 Troubleshooting

### "ngrok: command not found"
- Certifique-se de que o ngrok está no PATH
- Ou use o caminho completo: `./ngrok.exe http 5000`

### "Tunnel session expired"
- Reinicie o ngrok (limite de 2h no plano free)

### "ERR_NGROK_3200"
- Verifique se o servidor está rodando na porta correta
- Verifique se a porta não está bloqueada pelo firewall

### GPS ainda não funciona
- Certifique-se de usar a URL **HTTPS** (não HTTP)
- Verifique se o navegador permite localização
- Tente em modo anônimo/privado

## 💡 Dica Pro

Você pode criar um script para iniciar tudo de uma vez:

**Windows (start.bat):**
```batch
@echo off
start cmd /k "npm run dev"
timeout /t 3
start cmd /k "ngrok http 5000"
```

**Linux/Mac (start.sh):**
```bash
#!/bin/bash
npm run dev &
sleep 3
ngrok http 5000
```

---

**Pronto!** Agora você pode testar o rastreamento GPS em tempo real de qualquer lugar! 🎉







