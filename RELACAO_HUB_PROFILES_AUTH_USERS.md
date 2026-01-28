# Relação entre hub_profiles e auth.users

## Pergunta

Se eu apagar diretamente do database `hub_profiles`, vai apagar lá em Authentication (`auth.users`) dentro do Supabase?

## Resposta: **NÃO** ❌

### Explicação

A relação entre as tabelas é:

```
auth.users (tabela pai)
    ↓
hub_profiles (tabela filha)
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

### Como Funciona o CASCADE

O `ON DELETE CASCADE` funciona **apenas na direção da foreign key**:

1. ✅ **Se você deletar de `auth.users`** → Automaticamente deleta de `hub_profiles`
   - Isso acontece porque `hub_profiles.id` referencia `auth.users.id`
   - O CASCADE garante que quando o pai é deletado, os filhos também são deletados

2. ❌ **Se você deletar de `hub_profiles`** → **NÃO deleta de `auth.users`**
   - A foreign key está em `hub_profiles`, não em `auth.users`
   - Não há constraint em `auth.users` que referencia `hub_profiles`
   - Portanto, deletar o filho não afeta o pai

### Constraint Atual

```sql
FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
```

**Onde está**: Na tabela `hub_profiles`
**Direção**: `hub_profiles.id` → `auth.users.id`
**CASCADE**: Funciona apenas quando `auth.users` é deletado

### Exemplo Prático

```sql
-- ❌ Isso NÃO deleta de auth.users
DELETE FROM public.hub_profiles WHERE id = 'algum-uuid';

-- ✅ Isso deleta de hub_profiles automaticamente
DELETE FROM auth.users WHERE id = 'algum-uuid';
```

### Consequências

Se você deletar apenas de `hub_profiles`:
- ✅ O registro é removido de `hub_profiles`
- ❌ O registro **permanece** em `auth.users`
- ⚠️ O usuário ainda pode fazer login (mas sem perfil)
- ⚠️ Criará um usuário órfão novamente

### Para Deletar Completamente

Se você quer deletar o usuário completamente (tanto de `auth.users` quanto de `hub_profiles`):

**Opção 1: Deletar de auth.users (recomendado)**
```sql
DELETE FROM auth.users WHERE id = 'uuid-do-usuario';
-- Isso automaticamente deleta de hub_profiles devido ao CASCADE
```

**Opção 2: Usar API do Supabase Auth**
```typescript
// Via código
await supabase.auth.admin.deleteUser(userId);
```

**Opção 3: Via Dashboard do Supabase**
- Authentication > Users > Deletar usuário
- Isso remove de `auth.users` e automaticamente de `hub_profiles`

### Importante

⚠️ **Nunca delete apenas de `hub_profiles`** se você quer remover o usuário completamente, pois:
- O usuário continuará existindo em `auth.users`
- Poderá fazer login mas sem perfil
- Criará inconsistência no sistema

### Verificação

Para verificar a relação atual:

```sql
-- Ver constraints de hub_profiles
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.hub_profiles'::regclass 
AND contype = 'f';
```

## Conclusão

**NÃO**, deletar de `hub_profiles` **não deleta** de `auth.users`. 

Para deletar completamente um usuário, delete de `auth.users` (que automaticamente deleta de `hub_profiles` devido ao CASCADE).
