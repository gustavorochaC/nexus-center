# Resumo - Correção de Erro em get_group_permissions

## Data: 2026-01-28

## Problema Identificado

Erro ao tentar carregar permissões de grupos:
```
Erro: column apps.icon does not exist
```

A função RPC `get_group_permissions` estava tentando acessar `apps.icon`, mas a tabela `hub_apps` não possui essa coluna.

## Estrutura da Tabela hub_apps

Colunas existentes:
- id
- name
- url
- category
- is_public
- created_at
- updated_at
- color
- description
- display_order

**Coluna inexistente**: `icon`

## Solução Implementada

### 1. Migration SQL ✅

**Arquivo**: Migration `fix_get_group_permissions_icon`

**Mudanças**:
- Removida referência a `apps.icon` da função `get_group_permissions`
- Removido campo `app_icon` do retorno da função
- Mantidos apenas campos que existem na tabela

**Função corrigida retorna**:
- permission_id
- app_id
- app_name
- app_color
- access_level
- granted_at

### 2. Código TypeScript ✅

**Arquivo**: `src/services/permissions.ts`

**Mudanças**:
- Removido mapeamento de `app_icon` no retorno de `getGroupPermissions`
- Mantido apenas campos retornados pela função RPC

### 3. Melhorias Adicionais ✅

**Arquivo**: `src/components/admin/GroupsTab.tsx`

**Mudanças**:
- Melhorado tratamento de erro em `openPermissionsModal`
- Mensagem de erro mais descritiva incluindo detalhes do erro

## Validação

### Teste Manual

1. Acessar `/admin` > Grupos
2. Clicar em "Permissões" em um grupo
3. Verificar que modal abre sem erros
4. Verificar que permissões são carregadas corretamente

**Resultado esperado**: ✅ Modal abre e permissões são carregadas sem erros

### Verificação no Banco

```sql
-- Testar função diretamente
SELECT * FROM public.get_group_permissions('ID_DO_GRUPO');
```

**Resultado esperado**: ✅ Função retorna dados sem erro

## Arquivos Modificados

1. ✅ Migration aplicada no banco: `fix_get_group_permissions_icon`
2. ✅ `src/services/permissions.ts` - Removido mapeamento de app_icon
3. ✅ `src/components/admin/GroupsTab.tsx` - Melhorado tratamento de erro

## Observações

- O tipo `GroupPermission` ainda tem `app_icon` como opcional, mas não é mais preenchido
- Isso não causa problemas pois o campo é opcional
- Se necessário no futuro, pode-se adicionar a coluna `icon` à tabela `hub_apps` ou usar outro campo existente

## Conclusão

✅ **Problema resolvido**

- Função RPC corrigida
- Código TypeScript atualizado
- Tratamento de erros melhorado
- Sistema funcionando corretamente
