git # Nexus Center - Hub de Aplicações

Sistema centralizado para gerenciamento e acesso a múltiplas aplicações com controle de permissões granular.

## Sobre o Projeto

O Nexus Center é uma plataforma que permite centralizar o acesso a diferentes aplicações em um único hub, com sistema completo de autenticação, autorização e gerenciamento de usuários. Administradores podem gerenciar aplicações, usuários, grupos e permissões de forma intuitiva.

## Funcionalidades Principais

### Para Usuários

- **Dashboard Personalizado**: Visualização de aplicações disponíveis baseada em permissões
- **Categorização de Apps**: Apps organizados em categorias Primária (cards maiores) e Secundária (cards menores)
- **Acesso Rápido**: Links diretos para aplicações com base em permissões individuais e de grupo
- **Perfil e Configurações**: Gerenciamento de preferências pessoais

### Para Administradores

- **Gerenciamento de Aplicações**: Criar, editar e configurar aplicações no hub
- **Gerenciamento de Usuários**: 
  - Visualizar todos os usuários
  - Gerenciar roles (tornar admin/remover admin)
  - Excluir usuários (remove de auth.users e hub_profiles)
  - Gerenciar grupos de usuários
- **Sistema de Grupos**: Criar grupos e atribuir permissões por grupo
- **Matriz de Permissões**: Visualização e edição completa de permissões individuais e por grupo
- **Controle de Acesso**: Sistema robusto de permissões com níveis de acesso (read, write, admin)

## Tecnologias Utilizadas

### Frontend

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Radix UI** - Componentes acessíveis
- **Material UI Icons** - Ícones
- **TanStack Query** - Gerenciamento de estado do servidor
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend

- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - RPC Functions

### Testes

- **Vitest** - Test runner
- **@testing-library/react** - Testes de componentes
- **@testing-library/jest-dom** - Matchers adicionais
- **@testing-library/user-event** - Simulação de interações

## Estrutura do Projeto

```
nexus-center/
├── src/
│   ├── components/          # Componentes React
│   │   ├── admin/           # Componentes do painel admin
│   │   ├── auth/            # Componentes de autenticação
│   │   └── ui/              # Componentes UI (shadcn)
│   ├── contexts/            # Context providers
│   │   ├── AuthContext.tsx  # Autenticação e perfil
│   │   ├── UserSettingsContext.tsx
│   │   └── SettingsModalContext.tsx
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários e configurações
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Funções utilitárias
│   ├── pages/               # Páginas da aplicação
│   │   ├── Dashboard.tsx    # Hub principal
│   │   ├── Admin.tsx        # Painel administrativo
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Settings.tsx
│   ├── services/            # Serviços de API
│   │   ├── applications.ts  # Gerenciamento de apps
│   │   └── permissions.ts   # Gerenciamento de permissões
│   ├── types/               # Definições TypeScript
│   │   └── database.ts      # Tipos do banco de dados
│   └── __tests__/           # Testes automatizados
├── supabase/
│   └── migrations/          # Migrations SQL
├── public/                  # Arquivos estáticos
└── package.json
```

## Pré-requisitos

- Node.js 18+ e npm
- Conta Supabase (para banco de dados e autenticação)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gustavorochaC/nexus-center.git
cd nexus-center
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute as migrations do banco de dados:
Acesse o Supabase Dashboard e execute as migrations em ordem:
- `001_initial_schema.sql`
- `002_fix_api_mismatch.sql`
- `003_seed_admin_user.sql`
- `004_validate_auth_schema.sql`
- `005_admin_rls_policies.sql`
- `006_set_default_roles.sql`
- `007_create_groups_system.sql`
- `008_create_permission_functions.sql`
- `009_add_missing_columns_to_hub_apps.sql`
- `010_fix_orphan_users.sql`
- `011_fix_handle_new_user_function.sql`

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 8085)

# Build
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento
npm run preview          # Preview do build de produção

# Qualidade de Código
npm run lint             # Executa ESLint

# Testes
npm test                 # Executa testes com Vitest
npm run test:ui          # Interface visual dos testes
npm run test:coverage    # Cobertura de testes
```

## Configuração do Banco de Dados

O projeto utiliza Supabase (PostgreSQL) com as seguintes tabelas principais:

- `hub_profiles` - Perfis de usuários
- `hub_apps` - Aplicações cadastradas
- `hub_app_permissions` - Permissões individuais
- `hub_groups` - Grupos de usuários
- `hub_group_members` - Membros dos grupos
- `hub_group_permissions` - Permissões por grupo

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de segurança baseadas em roles (admin/user)
- Funções RPC protegidas com `SECURITY DEFINER`

## Deploy

### Build de Produção

```bash
npm run build
```

O build será gerado na pasta `dist/` e pode ser servido por qualquer servidor estático.

### Plataformas Recomendadas

- **Vercel** - Deploy automático via Git
- **Netlify** - Deploy automático via Git
- **Railway** - Deploy com suporte a variáveis de ambiente
- **Fly.io** - Deploy com edge functions

## Estrutura de Permissões

### Roles

- **admin**: Acesso completo ao painel administrativo
- **user**: Acesso ao dashboard e aplicações permitidas

### Níveis de Acesso por Aplicação

- **read**: Apenas visualização
- **write**: Leitura e escrita
- **admin**: Controle total da aplicação

## Funcionalidades Administrativas

### Gerenciamento de Usuários

- Visualizar todos os usuários cadastrados
- Tornar usuário admin ou remover permissão de admin
- Excluir usuários (remove de auth.users e hub_profiles)
- Gerenciar grupos aos quais o usuário pertence

### Gerenciamento de Aplicações

- Criar novas aplicações
- Editar aplicações existentes
- Definir categoria (Primário/Secundário)
- Configurar cores e descrições

### Sistema de Grupos

- Criar grupos de usuários
- Atribuir permissões por grupo
- Gerenciar membros dos grupos

### Matriz de Permissões

- Visualização completa de todas as permissões
- Edição de permissões individuais e por grupo
- Interface intuitiva para gerenciamento

## Testes

O projeto inclui testes automatizados usando Vitest:

```bash
# Executar todos os testes
npm test

# Executar com interface visual
npm run test:ui

# Ver cobertura
npm run test:coverage
```

Testes cobrem:
- Autenticação e criação de perfis
- Registro de usuários
- Gerenciamento de grupos e permissões
- Exclusão de usuários

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e proprietário.

## Suporte

Para questões ou suporte, entre em contato através do repositório GitHub.
