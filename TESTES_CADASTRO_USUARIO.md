# Testes - Correção de Cadastro de Usuário

## Data: 2026-01-28

## Objetivo

Validar que a correção do problema de cadastro duplicado está funcionando corretamente, incluindo:
- Criação automática de perfis via trigger
- Tratamento de emails duplicados
- Recuperação de usuários órfãos

## Mudanças Implementadas

1. **Migration 010**: Criou perfis para 4 usuários órfãos
2. **Migration 011**: Corrigiu função `handle_new_user()` e trigger
3. **Register.tsx**: Melhorou mensagens de erro para emails duplicados
4. **AuthContext.tsx**: Adicionou fallback para criar perfil manualmente se trigger falhar

## Testes Manuais Recomendados

### Teste 1: Verificar Perfis Órfãos Corrigidos

**Pré-requisito**: Migration 010 aplicada

**Passos**:
1. Verificar no Supabase que todos os 5 usuários têm perfis:
   ```sql
   SELECT u.id, u.email, CASE WHEN p.id IS NULL THEN 'SEM PERFIL' ELSE 'COM PERFIL' END as status 
   FROM auth.users u 
   LEFT JOIN public.hub_profiles p ON u.id = p.id;
   ```
2. Verificar que `gustavorocarvalho@hotmail.com` tem perfil

**Resultado esperado**: ✅ Todos os 5 usuários devem ter perfis

### Teste 2: Tentar Cadastrar Email Existente

**Passos**:
1. Acessar página de registro (`/register`)
2. Tentar cadastrar com email `gustavorocarvalho@hotmail.com`
3. Preencher nome e senha
4. Clicar em "Criar Conta"

**Resultado esperado**: 
- ❌ Cadastro deve ser bloqueado
- ✅ Mensagem clara: "Este email já está cadastrado. Se você já tem uma conta, faça login."
- ✅ Não deve criar novo usuário

### Teste 3: Cadastrar Novo Usuário

**Passos**:
1. Acessar página de registro (`/register`)
2. Preencher com email novo (ex: `teste.novo@exemplo.com`)
3. Preencher nome completo
4. Preencher senha (mínimo 6 caracteres)
5. Clicar em "Criar Conta"

**Resultado esperado**:
- ✅ Cadastro deve ser bem-sucedido
- ✅ Perfil deve ser criado automaticamente em `hub_profiles`
- ✅ Verificar no Supabase que perfil foi criado:
   ```sql
   SELECT * FROM public.hub_profiles WHERE email = 'teste.novo@exemplo.com';
   ```

### Teste 4: Login com Usuário que Tinha Perfil Órfão

**Passos**:
1. Acessar página de login (`/login`)
2. Tentar fazer login com `gustavorocarvalho@hotmail.com`
3. Inserir senha correta

**Resultado esperado**:
- ✅ Login deve funcionar normalmente
- ✅ Perfil deve ser carregado corretamente
- ✅ Usuário deve ser redirecionado para dashboard

### Teste 5: Verificar Trigger Funciona para Novos Usuários

**Passos**:
1. Criar novo usuário via interface (Teste 3)
2. Verificar imediatamente no Supabase:
   ```sql
   SELECT u.id, u.email, u.created_at, p.id as profile_id, p.created_at as profile_created_at
   FROM auth.users u
   LEFT JOIN public.hub_profiles p ON u.id = p.id
   WHERE u.email = 'teste.novo@exemplo.com';
   ```

**Resultado esperado**:
- ✅ Perfil deve existir
- ✅ `profile_created_at` deve ser muito próximo de `u.created_at` (trigger executou rapidamente)

### Teste 6: Validação de Mensagens de Erro

**Cenários**:
1. Email inválido: `email-sem-arroba`
2. Senha muito curta: `12345` (menos de 6 caracteres)
3. Email já cadastrado: `gustavorocarvalho@hotmail.com`

**Resultado esperado**:
- ✅ Mensagens de erro claras e específicas para cada caso
- ✅ Não deve mostrar erros genéricos

## Validação no Banco de Dados

### Query de Verificação Completa

```sql
-- Verificar integridade: todos usuários têm perfis
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_profiles,
    COUNT(DISTINCT u.id) - COUNT(DISTINCT p.id) as orphan_count
FROM auth.users u
LEFT JOIN public.hub_profiles p ON u.id = p.id;

-- Resultado esperado: orphan_count = 0
```

### Verificar Trigger Está Ativo

```sql
SELECT tgname, tgenabled, pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND tgname = 'on_auth_user_created';
```

## Checklist de Validação

- [ ] Todos os 5 usuários existentes têm perfis
- [ ] Tentativa de cadastro com email existente mostra mensagem clara
- [ ] Novo cadastro cria perfil automaticamente
- [ ] Login funciona para usuários que tinham perfil órfão
- [ ] Trigger funciona para novos usuários
- [ ] Mensagens de erro são claras e específicas
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do Supabase

## Próximos Passos

Após validação manual, criar testes automatizados usando test-engineer para:
- Testes unitários das funções de erro
- Testes de integração do fluxo de cadastro
- Testes E2E do fluxo completo
