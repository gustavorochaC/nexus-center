# Testes - Exclusão de Usuários no Painel Admin

## Data: 2026-01-28

## Objetivo

Validar que a funcionalidade de exclusão de usuários está funcionando corretamente, removendo tanto de `auth.users` quanto de `hub_profiles`.

## Mudanças Implementadas

1. **Migration SQL**: Função RPC `delete_user` criada no banco
2. **Serviço TypeScript**: Função `deleteUser` em `permissions.ts`
3. **UI**: Botão de excluir e AlertDialog de confirmação em `UsersTab.tsx`

## Testes Manuais Recomendados

### Teste 1: Excluir Usuário Comum

**Pré-requisito**: Usuário admin logado, pelo menos 1 usuário comum existente

**Passos**:
1. Acessar `/admin` > Usuários
2. Localizar um usuário comum (não admin)
3. Clicar no botão de excluir (ícone de lixeira)
4. Confirmar no AlertDialog
5. Observar feedback

**Resultado esperado**:
- ✅ AlertDialog aparece com informações do usuário
- ✅ Toast de sucesso: "Usuário excluído"
- ✅ Usuário desaparece da lista
- ✅ Usuário removido de `auth.users`
- ✅ Perfil removido de `hub_profiles` (CASCADE)

### Teste 2: Tentar Excluir a Si Mesmo

**Passos**:
1. Acessar `/admin` > Usuários
2. Localizar seu próprio usuário (admin logado)
3. Tentar clicar no botão de excluir

**Resultado esperado**:
- ✅ Botão de excluir está desabilitado
- ✅ Se clicar, toast de erro: "Você não pode excluir sua própria conta"

### Teste 3: Tentar Excluir Último Admin

**Pré-requisito**: Apenas 1 admin no sistema

**Passos**:
1. Verificar que há apenas 1 admin
2. Tentar excluir esse admin

**Resultado esperado**:
- ✅ Botão de excluir está desabilitado
- ✅ Se tentar excluir, toast de erro: "Não é possível excluir o último administrador"

### Teste 4: Excluir Admin (Quando Há Outros Admins)

**Pré-requisito**: Pelo menos 2 admins no sistema

**Passos**:
1. Acessar `/admin` > Usuários
2. Localizar um admin (que não seja você)
3. Clicar em excluir
4. Confirmar

**Resultado esperado**:
- ✅ Exclusão bem-sucedida
- ✅ Admin removido do sistema
- ✅ Outros admins permanecem

### Teste 5: Usuário em Grupos

**Pré-requisito**: Usuário que está em pelo menos 1 grupo

**Passos**:
1. Localizar usuário que está em grupos
2. Clicar em excluir
3. Observar AlertDialog

**Resultado esperado**:
- ✅ AlertDialog mostra aviso: "Este usuário está em X grupo(s)"
- ✅ Exclusão remove usuário dos grupos automaticamente (CASCADE)
- ✅ Permissões de grupo são perdidas

### Teste 6: Validação de Permissões

**Passos**:
1. Fazer logout
2. Fazer login com usuário não-admin
3. Tentar acessar `/admin` > Usuários
4. Tentar excluir usuário

**Resultado esperado**:
- ✅ Não pode acessar `/admin` (redirecionado)
- ✅ Se conseguir acessar, botão de excluir desabilitado
- ✅ Toast de erro: "Apenas administradores podem excluir usuários"

## Validação no Banco de Dados

### Query de Verificação

```sql
-- Verificar se usuário foi removido de auth.users
SELECT COUNT(*) FROM auth.users WHERE id = 'UUID_DO_USUARIO';
-- Resultado esperado: 0

-- Verificar se perfil foi removido de hub_profiles (CASCADE)
SELECT COUNT(*) FROM public.hub_profiles WHERE id = 'UUID_DO_USUARIO';
-- Resultado esperado: 0

-- Verificar se foi removido de grupos (CASCADE)
SELECT COUNT(*) FROM public.hub_group_members WHERE user_id = 'UUID_DO_USUARIO';
-- Resultado esperado: 0
```

### Testar Função RPC Diretamente

```sql
-- Testar função (deve retornar erro se não for admin)
SELECT * FROM public.delete_user('UUID_DO_USUARIO');
```

## Checklist de Validação

- [ ] Admin pode excluir usuários comuns
- [ ] Não pode excluir a si mesmo (botão desabilitado)
- [ ] Não pode excluir último admin (botão desabilitado)
- [ ] Pode excluir admin quando há outros admins
- [ ] AlertDialog mostra aviso se usuário está em grupos
- [ ] Toast de sucesso aparece após exclusão
- [ ] Toast de erro aparece se exclusão falhar
- [ ] Lista é atualizada automaticamente após exclusão
- [ ] Usuário é removido de auth.users
- [ ] Perfil é removido de hub_profiles (CASCADE)
- [ ] Usuário é removido de grupos (CASCADE)
- [ ] Não há erros no console

## Testes Automatizados

Arquivo criado: `src/__tests__/delete-user.test.tsx`

**Cobertura**:
- ✅ Validações de segurança
- ✅ Prevenção de auto-exclusão
- ✅ Prevenção de exclusão do último admin
- ✅ Função deleteUser
- ✅ Feedback visual
- ✅ Atualização de lista

**Para executar**:
```bash
npm test delete-user
```

## Observações

- A exclusão é permanente e irreversível
- CASCADE remove automaticamente de todas as tabelas relacionadas
- Validações são feitas tanto no frontend quanto no banco (RPC)
- Feedback visual claro para o usuário

## Próximos Passos

1. Executar testes manuais seguindo o checklist
2. Verificar logs do console para erros
3. Verificar logs do Supabase se houver problemas
4. Ajustar mensagens se necessário
