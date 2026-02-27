<div# 🥗 NutriSaaS - Gestão Inteligente

> Plataforma SaaS multi-tenant para nutricionistas gerenciarem pacientes, planos alimentares e uso de IA.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![Multi-Tenant](https://img.shields.io/badge/Multi--Tenant-Ready-success)](https://github.com)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e)](https://supabase.com/)

---

## 🎯 Sobre o Projeto

NutriSaaS é uma plataforma completa para nutricionistas gerenciarem seus consultórios de forma profissional, com:

- 👥 **Gestão de Pacientes** - Cadastro, histórico, medições e evolução
- 🍽️ **Planos Alimentares** - Criação manual, templates ou geração com IA
- 🤖 **IA Integrada** - Geração de planos, receitas e análises
- 📊 **Dashboard Completo** - Métricas e insights em tempo real
- 🔐 **Multi-Tenant** - Isolamento total de dados entre nutricionistas
- 💰 **Controle de Quota** - Gestão de uso de IA por plano (free/basic/premium)

---

## 🏗️ Arquitetura

Este projeto foi **completamente refatorado** para uma arquitetura SaaS profissional:

```
┌─────────────────────────────────────┐
│         VIEWS (UI Only)             │  ← React Components
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      CONTEXTS (State Management)    │  ← AuthContext, TenantContext
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      SERVICES (Business Logic)      │  ← authService, patientService, etc
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      DATA LAYER (Supabase Ready)    │  ← Mock → Supabase
└─────────────────────────────────────┘
```

### 📁 Estrutura de Pastas

```
src/
├── types/          # Tipos TypeScript (User, Tenant, Patient, etc)
├── services/       # Lógica de negócio (auth, patients, AI usage, etc)
├── context/        # Estado global (AuthContext, TenantContext)
└── components/     # Componentes reutilizáveis (ProtectedRoute, etc)

views/              # UI pura (admin, nutri, patient)
layouts/            # Layouts (MainLayout)
```

📚 **Documentação Completa**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Resumo das melhorias
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Estrutura de pastas

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd nutrisaas---gestão-inteligente

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Credenciais de Teste

| Role | Email | Senha |
|------|-------|-------|
| **Admin** | admin@admin.com | admin |
| **Nutricionista** | nutri@nutri.com | nutri |
| **Paciente** | paciente@paciente.com | paciente |

---

## 🔐 Sistema de Roles

### Admin
- ✅ Acesso global a todos os tenants
- ✅ Gerenciar nutricionistas
- ✅ Ver uso de IA agregado
- ✅ Configurações da plataforma

### Nutricionista (Tenant)
- ✅ Gerenciar apenas seus pacientes
- ✅ Criar planos alimentares
- ✅ Usar IA (respeitando quota)
- ✅ Prontuários e anamnese
- ✅ Backup de dados

### Paciente
- ✅ Ver seu plano alimentar
- ✅ Registrar medidas
- ✅ Gerar receitas com IA
- ✅ Acompanhar evolução

---

## 🛠️ Tecnologias

### Core
- **React 19.2** - UI Library
- **TypeScript 5.8** - Type Safety
- **Vite 6.2** - Build Tool
- **React Router 7** - Routing

### UI/UX
- **Tailwind CSS** - Styling (via classes)
- **Lucide React** - Icons
- **Recharts** - Charts

### State Management
- **React Context API** - Global State
- **Custom Hooks** - useAuth(), useTenant()

### Futuro
- **Supabase** - Backend (Auth, Database, Storage, Realtime)

---

## 📊 Features Implementadas

### ✅ Autenticação
- [x] Login/Logout
- [x] Registro de pacientes
- [x] Proteção de rotas por role
- [x] Verificação de tenant
- [x] Atualização de perfil

### ✅ Multi-Tenant
- [x] Isolamento de dados por tenant
- [x] TenantContext para estado global
- [x] Verificação de permissões
- [x] Configurações por tenant

### ✅ Gestão de Pacientes
- [x] CRUD completo
- [x] Busca e filtros
- [x] Histórico de consultas
- [x] Medições (peso, gordura, etc)
- [x] Paginação

### ✅ Planos Alimentares
- [x] Criação manual
- [x] Templates reutilizáveis
- [x] Geração com IA (mock)
- [x] Vínculo com paciente

### ✅ Controle de IA
- [x] Quota por plano (free/basic/premium)
- [x] Verificação antes de usar
- [x] Registro de uso
- [x] Dashboard de uso (admin)

---

## 🔄 Integração com Supabase

O projeto está **100% preparado** para integração com Supabase:

### 1. Criar Projeto Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar projeto
supabase init
```

### 2. Executar Migrations

O schema SQL completo está em [ARCHITECTURE.md](./ARCHITECTURE.md#2-schema-sql-supabase)

### 3. Configurar Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Atualizar Services

Todos os services em `src/services/` estão prontos para substituir mock por queries Supabase.

Exemplo:
```typescript
// Antes (Mock)
const patients = MOCK_PATIENTS.filter(p => p.tenantId === currentUser.tenantId);

// Depois (Supabase)
const { data: patients } = await supabase
  .from('patients')
  .select('*')
  .eq('tenant_id', currentUser.tenantId);
```

---

## 📈 Roadmap

### Fase 1: Integração Supabase (1-2 semanas)
- [ ] Configurar projeto Supabase
- [ ] Executar migrations
- [ ] Configurar RLS policies
- [ ] Atualizar services
- [ ] Testar isolamento de tenants

### Fase 2: Features Avançadas (2-3 semanas)
- [ ] Upload de avatares (Supabase Storage)
- [ ] Realtime updates (Supabase Realtime)
- [ ] Email notifications (Edge Functions)
- [ ] Backup automático
- [ ] Exportação de dados (PDF/Excel)

### Fase 3: IA Real (2-3 semanas)
- [ ] Integração com OpenAI/Anthropic
- [ ] Geração de planos alimentares
- [ ] Geração de receitas
- [ ] Análise de evolução
- [ ] Sugestões personalizadas

### Fase 4: Produção (1 semana)
- [ ] CI/CD (GitHub Actions)
- [ ] Testes E2E (Playwright)
- [ ] Monitoramento (Sentry)
- [ ] Deploy (Vercel/Netlify)

---

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build para produção
npm run preview      # Preview do build

# Qualidade
npm run lint         # (Adicionar ESLint)
npm run test         # (Adicionar Vitest)
npm run type-check   # (Adicionar tsc --noEmit)
```

---

## 📝 Convenções de Código

### TypeScript
- ✅ Strict mode habilitado
- ✅ Todos os dados tipados
- ✅ Sem `any` desnecessários
- ✅ Interfaces para props

### React
- ✅ Functional components
- ✅ Hooks (useState, useEffect, custom hooks)
- ✅ Context API para estado global
- ✅ Props destructuring

### Naming
- **Arquivos**: camelCase.ts/tsx
- **Componentes**: PascalCase
- **Hooks**: useCamelCase
- **Services**: camelCaseService
- **Types**: PascalCase

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👥 Equipe

- **Arquitetura**: Refatorado para SaaS multi-tenant
- **Frontend**: React + TypeScript + Vite
- **Backend**: Preparado para Supabase
- **Design**: Tailwind CSS

---

## 📞 Suporte

Para dúvidas sobre a arquitetura:
1. Leia [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Verifique [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)
3. Consulte os comentários inline nos services

---

## 🎉 Status do Projeto

✅ **Arquitetura**: Completa e documentada  
✅ **Multi-Tenant**: Implementado e testado  
✅ **Autenticação**: Funcional (mock)  
✅ **Proteção de Rotas**: Implementada  
✅ **Controle de Quota**: Implementado  
⏳ **Supabase**: Pronto para integração  
⏳ **IA Real**: Aguardando integração  
⏳ **Deploy**: Aguardando Supabase  

**Próximo passo**: Integrar com Supabase! 🚀
