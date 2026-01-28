# Testes - Permissões em Grupos

## Data: 2026-01-28

## Objetivo

Validar que a correção do problema de atribuição de permissões em grupos está funcionando corretamente.

## Mudanças Implementadas

1. **GroupsTab.tsx**:
   - Adicionado `useToast` para feedback visual
   - Adicionado `useAuth` para validação de admin
   - Adicionado estado `updatingPermission` para rastrear operações
   - Melhorado tratamento de erros com mensagens claras
   - Adicionado indicador de loading no Select durante atualização
   - Adicionado validação de admin antes de operações

2. **permissions.ts**:
   - Melhorado tratamento de erros em `setGroupPermission`
   - Adicionado log de erros para debug
   - Mensagens de erro mais descritivas

## Testes Manuais Recomendados

### Teste 1: Atribuir Permissão a Grupo

**Pré-requisito**: Usuário admin logado, grupo criado, apps disponíveis

**Passos**:
1. Acessar `/admin` como admin
2. Ir para tab "Grupos"
3. Clicar em "Permissões" em um grupo
4. Selecionar um app no dropdown
5. Escolher nível de acesso (Editor, Visualizador, ou Bloqueado)
6. Observar feedback visual

**Resultado esperado**:
- ✅ Toast de sucesso aparece: "Permissão atualizada"
- ✅ Select mostra indicador de loading durante atualização
- ✅ Valor do Select é atualizado após sucesso
- ✅ Permissão é salva no banco de dados

### Teste 2: Remover Permissão de Grupo

**Passos**:
1. Abrir modal de permissões de um grupo
2. Selecionar "Não definido" para um app que tem permissão
3. Observar feedback

**Resultado esperado**:
- ✅ Toast de sucesso: "Permissão removida"
- ✅ Select volta para "Não definido"
- ✅ Permissão é removida do banco

### Teste 3: Validação de Admin

**Passos**:
1. Fazer logout
2. Fazer login com usuário não-admin
3. Tentar acessar `/admin` > Grupos > Permissões

**Resultado esperado**:
- ✅ Toast de erro: "Acesso negado - Apenas administradores podem gerenciar permissões"
- ✅ Modal não abre ou operações são bloqueadas

### Teste 4: Tratamento de Erros

**Cenários**:
1. Desconectar internet e tentar atribuir permissão
2. Tentar atribuir permissão com dados inválidos

**Resultado esperado**:
- ✅ Toast de erro aparece com mensagem clara
- ✅ Erro não quebra a interface
- ✅ Estado é restaurado após erro

### Teste 5: Múltiplas Operações Simultâneas

**Passos**:
1. Abrir modal de permissões
2. Alterar permissões de múltiplos apps rapidamente
3. Observar comportamento

**Resultado esperado**:
- ✅ Cada operação mostra loading individual
- ✅ Operações são processadas em ordem
- ✅ Não há conflitos ou estados inconsistentes

## Validação no Banco de Dados

### Query de Verificação

```sql
-- Verificar permissões de um grupo específico
SELECT 
    gp.id,
    g.name as grupo_nome,
    a.name as app_nome,
    gp.access_level,
    gp.granted_at
FROM public.hub_group_permissions gp
JOIN public.hub_groups g ON gp.group_id = g.id
JOIN public.hub_apps a ON gp.app_id = a.id
WHERE g.id = 'ID_DO_GRUPO'
ORDER BY a.name;
```

### Verificar RLS

```sql
-- Verificar se políticas RLS estão ativas
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'hub_group_permissions';
```

## Checklist de Validação

- [ ] Toast de sucesso aparece ao atribuir permissão
- [ ] Toast de sucesso aparece ao remover permissão
- [ ] Toast de erro aparece quando operação falha
- [ ] Indicador de loading aparece durante atualização
- [ ] Select é desabilitado durante atualização
- [ ] Validação de admin funciona corretamente
- [ ] Permissões são salvas no banco de dados
- [ ] Permissões são removidas do banco quando necessário
- [ ] Múltiplas operações funcionam sem conflitos
- [ ] Mensagens de erro são claras e úteis

## Testes Automatizados

Arquivo criado: `src/__tests__/groups-permissions.test.tsx`

**Cobertura**:
- ✅ Testes de atribuição de permissão
- ✅ Testes de remoção de permissão
- ✅ Testes de validação de admin
- ✅ Testes de estado de loading
- ✅ Testes de tratamento de erros

**Para executar**:
```bash
npm test groups-permissions
```

## Observações

- Os toasts fornecem feedback imediato ao usuário
- O estado de loading previne múltiplas operações simultâneas
- A validação de admin garante segurança
- Mensagens de erro são descritivas para facilitar debug

## Próximos Passos

1. Executar testes manuais seguindo o checklist
2. Verificar logs do console para erros
3. Verificar logs do Supabase se houver problemas
4. Ajustar mensagens de erro se necessário
