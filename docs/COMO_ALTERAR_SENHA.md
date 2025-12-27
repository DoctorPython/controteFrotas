# Como Alterar a Senha de um Usuário

Este guia explica como alterar a senha do usuário `martinsgomes527@gmail.com` (ou qualquer outro usuário) no sistema.

## Método 1: Usando o Script (Recomendado)

### Passo 1: Execute o script

No terminal, execute o seguinte comando:

```bash
tsx scripts/change-user-password.ts martinsgomes527@gmail.com R@1zd3d3ntr02025
```

**Parâmetros:**
- Primeiro parâmetro: Email do usuário
- Segundo parâmetro: Nova senha (mínimo 6 caracteres)

### Exemplo completo:

```bash
tsx scripts/change-user-password.ts martinsgomes527@gmail.com R@1zd3d3ntr0
```

### Saída esperada:

```
🔍 Buscando usuário com email: martinsgomes527@gmail.com...
✅ Usuário encontrado: martinsgomes527@gmail.com (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

🔐 Alterando senha...

✅ Senha alterada com sucesso para o usuário martinsgomes527@gmail.com!

📝 Detalhes:
   Email: martinsgomes527@gmail.com
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Última atualização: 2024-01-XX...
```

## Método 2: Via Supabase Dashboard (Alternativa)

Se preferir usar a interface web do Supabase:

1. **Acesse o Supabase Dashboard:**
   - URL: https://app.supabase.com/project/rtgdjxgbmdjzxwkhllxt
   - Faça login com suas credenciais

2. **Navegue até Authentication:**
   - No menu lateral, clique em **Authentication**
   - Depois clique em **Users**

3. **Encontre o usuário:**
   - Use a barra de busca para encontrar `martinsgomes527@gmail.com`
   - Clique no usuário para abrir os detalhes

4. **Altere a senha:**
   - Clique no botão **"..."** (três pontos) ao lado do usuário
   - Selecione **"Reset Password"** ou **"Update User"**
   - Digite a nova senha
   - Clique em **"Update"** ou **"Save"**

## Requisitos

- ✅ Arquivo `.env` configurado com `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
- ✅ O usuário deve existir no Supabase Auth
- ✅ A nova senha deve ter pelo menos 6 caracteres

## Troubleshooting

### Erro: "Usuário não encontrado"
- Verifique se o email está correto
- Confirme que o usuário existe no Supabase Auth (via Dashboard)

### Erro: "SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme que as variáveis estão configuradas corretamente

### Erro: "A senha deve ter pelo menos 6 caracteres"
- Use uma senha com no mínimo 6 caracteres
- Recomendamos usar senhas fortes com letras, números e caracteres especiais

## Segurança

⚠️ **Importante:**
- A `SUPABASE_SERVICE_KEY` tem privilégios administrativos completos
- Nunca compartilhe ou exponha esta chave
- Mantenha o arquivo `.env` seguro e não o commite no Git





