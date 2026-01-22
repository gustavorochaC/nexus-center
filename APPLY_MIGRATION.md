# Aplicar Migração de Seed no Servidor

## Passo a Passo

### 1. Copiar o arquivo de migração para o servidor
Você precisa transferir o arquivo `003_seed_admin_user.sql` para o servidor onde o Supabase está rodando.

**Opção A: Via SCP/SFTP**
```bash
scp c:\Users\gustavo.rocha\Desktop\Teste\Hub-Antigo\nexus-center\supabase\migrations\003_seed_admin_user.sql usuario@192.168.1.220:/caminho/do/supabase/migrations/
```

**Opção B: Copiar manualmente via Putty**
1. Abra o arquivo `003_seed_admin_user.sql` no seu computador
2. Copie todo o conteúdo
3. No servidor, crie o arquivo:
   ```bash
   nano /caminho/do/supabase/migrations/003_seed_admin_user.sql
   ```
4. Cole o conteúdo
5. Salve (Ctrl+O, Enter, Ctrl+X)

### 2. Aplicar a migração
No servidor, execute:

```bash
cd /caminho/do/supabase
supabase db reset
```

**OU** se preferir aplicar apenas esta migração sem resetar:

```bash
psql -h localhost -U postgres -d postgres -f /caminho/do/supabase/migrations/003_seed_admin_user.sql
```

### 3. Verificar se funcionou
Após aplicar, execute no servidor:

```sql
-- Verificar se o perfil foi criado
SELECT * FROM hub.hub_profiles WHERE email = 'vaccontatos@hotmail.com';

-- Verificar se as permissões foram criadas
SELECT * FROM hub.hub_app_permissions WHERE user_id = '0d5b446b-aa6c-498e-b44d-f64e40f54c38';
```

Deve retornar:
- 1 linha em `hub_profiles` (seu perfil admin)
- 3 linhas em `hub_app_permissions` (uma para cada aplicação)

### 4. Testar no frontend
Após confirmar que os dados foram inseridos, recarregue a página de **Configurações > Administrador** no navegador.

Agora deve aparecer:
- Seu usuário na lista de perfis
- As 3 aplicações com suas permissões
