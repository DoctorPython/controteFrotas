# Guia: Monitorar Smartphone em Tempo Real

Este guia explica como usar seu smartphone para enviar localização em tempo real para o sistema de rastreamento.

## 📱 Passo a Passo

### 1. Acesse a Página de Teste

No seu smartphone, abra o navegador e acesse:

```
http://192.168.0.16:5000/test-tracking
```

*(Substitua pelo IP do seu servidor)*

### 2. Selecione o Veículo "Fumaça"

1. No dropdown "Selecione um Veículo", escolha **"Fumaça - NOZ-2975"**
2. A placa será preenchida automaticamente

### 3. Configure o Intervalo (Opcional)

- Padrão: **5 segundos** (recomendado)
- Você pode ajustar de 1 a 60 segundos
- Intervalos menores = mais atualizações, mas consome mais bateria

### 4. Inicie o Rastreamento

Você tem **3 opções**:

#### Opção A: Rastreamento Automático (GPS) ⭐ Recomendado

1. Clique em **"Iniciar Rastreamento (GPS)"**
2. Permita o acesso à localização quando solicitado
3. O sistema enviará sua localização automaticamente a cada X segundos

**⚠️ Nota:** Se aparecer erro de "secure origins", o GPS não funcionará via HTTP. Use as opções B ou C abaixo.

#### Opção B: Envio Manual Único

1. Clique em **"Enviar Agora"**
2. O sistema tentará obter sua localização GPS e enviar uma vez
3. Repita quando quiser atualizar a posição

#### Opção C: Coordenadas Manuais

1. Abra o **Google Maps** no smartphone
2. Toque e segure no local onde você está
3. Copie as coordenadas que aparecem
4. Cole nos campos "Latitude" e "Longitude" na página
5. Clique em **"Enviar Coordenadas Manuais"**
6. Repita conforme você se move

## 🗺️ Como Obter Coordenadas no Google Maps

1. Abra o Google Maps
2. Toque e segure no ponto onde você está
3. Na parte inferior, aparecerão as coordenadas (ex: `-3.110094, -59.989105`)
4. Toque nas coordenadas para copiar
5. Cole na página de teste

## 📊 Monitorar em Tempo Real

### Abra o Dashboard em Outra Aba

1. Abra uma nova aba no navegador (ou outro dispositivo)
2. Acesse: `http://192.168.0.16:5000/`
3. O veículo "Fumaça" aparecerá no mapa
4. A posição será atualizada automaticamente quando você enviar dados

### O que você verá:

- ✅ **Mapa atualizado** com a posição do veículo
- ✅ **Velocidade** em tempo real
- ✅ **Direção** do movimento
- ✅ **Status** (Em Movimento, Parado, etc.)
- ✅ **Última atualização** (há quantos segundos)

## 🔄 Fluxo Completo

```
Smartphone (GPS) 
    ↓
Página de Teste (/test-tracking)
    ↓
POST /api/tracking
    ↓
Servidor atualiza veículo
    ↓
WebSocket broadcast
    ↓
Dashboard atualiza mapa (tempo real)
```

## 💡 Dicas

### Para Melhor Precisão:
- Use ao **ar livre** (melhor sinal GPS)
- Aguarde alguns segundos para o GPS estabilizar
- Mantenha o navegador aberto e ativo

### Para Economizar Bateria:
- Use intervalos maiores (10-15 segundos)
- Feche outras abas do navegador
- Use modo de economia de energia

### Se o GPS Não Funcionar:
- Use coordenadas manuais do Google Maps
- Atualize manualmente quando se mover
- Configure HTTPS no servidor (solução permanente)

## 🚀 Solução Permanente: Configurar HTTPS

Para usar GPS automaticamente sem erros:

1. **Instale um certificado SSL** (Let's Encrypt é gratuito)
2. **Configure o servidor** para HTTPS
3. **Acesse via** `https://192.168.0.16:5000/test-tracking`
4. O GPS funcionará automaticamente

## 📱 Teste Rápido

1. **Abra 2 abas/janelas:**
   - Aba 1: Dashboard (`http://192.168.0.16:5000/`)
   - Aba 2: Teste de Rastreamento (`http://192.168.0.16:5000/test-tracking`)

2. **Na aba de teste:**
   - Selecione "Fumaça - NOZ-2975"
   - Clique em "Enviar Agora" ou use coordenadas manuais

3. **Veja na aba do Dashboard:**
   - O veículo "Fumaça" aparecerá/moverá no mapa
   - Atualização em tempo real!

## ❓ Problemas Comuns

### "Erro: GPS requer HTTPS"
- **Solução:** Use coordenadas manuais ou configure HTTPS

### "Veículo não encontrado"
- **Solução:** Verifique se a placa está correta (NOZ-2975)

### "Localização não atualiza"
- **Solução:** Verifique se o Dashboard está aberto e conectado

### "Bateria drenando rápido"
- **Solução:** Aumente o intervalo de envio (10-15 segundos)

## 🎯 Exemplo Prático

**Cenário:** Você está em Manaus (coordenadas: -3.110094, -59.989105)

1. Acesse `/test-tracking` no smartphone
2. Selecione "Fumaça"
3. Digite:
   - Latitude: `-3.110094`
   - Longitude: `-59.989105`
4. Clique em "Enviar Coordenadas Manuais"
5. Veja no Dashboard: o veículo aparecerá em Manaus no mapa!

**Enquanto você se move:**
- Atualize as coordenadas manualmente
- Ou use "Enviar Agora" se o GPS funcionar
- O veículo se moverá no mapa em tempo real

---

**Pronto!** Agora você pode monitorar seu smartphone em tempo real no sistema de rastreamento! 🎉





