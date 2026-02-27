# 🏗️ ARQUITETURA REFATORADA - NUTRISAAS

## 📋 RESUMO EXECUTIVO

Este documento descreve a nova arquitetura do NutriSaaS após a refatoração completa para suportar multi-tenancy e integração futura com Supabase.

---

## 🎯 OBJETIVOS ALCANÇADOS

✅ **Separação de Responsabilidades**: Lógica de negócio isolada em services  
✅ **Multi-Tenant Ready**: Todos os dados preparados com `tenantId`  
✅ **Supabase Ready**: Estrutura preparada para Row Level Security (RLS)  
✅ **Proteção de Rotas**: Sistema robusto baseado em roles e tenant  
✅ **Gerenciamento de Estado**: Contextos React para auth e tenant  
✅ **Código Escalável**: Arquitetura limpa e manutenível  

---

## 📁 NOVA ESTRUTURA DE PASTAS

```
nutrisaas---gestão-inteligente/
├── src/
│   ├── types/                    # ✨ NOVO
│   │   ├── user.ts              # Tipos de usuário e autenticação
│   │   ├── tenant.ts            # Tipos de tenant/nutricionista
│   │   ├── patient.ts           # Tipos de paciente
│   │   ├── plan.ts              # Tipos de planos e receitas
│   │   ├── aiUsage.ts           # Tipos de uso de IA
│   │   └── index.ts             # Export central
│   │
│   ├── services/                 # ✨ NOVO
│   │   ├── authService.ts       # Autenticação e sessão
│   │   ├── userService.ts       # Operações de usuário
│   │   ├── nutritionistService.ts # Operações de tenant
│   │   ├── patientService.ts    # Operações de paciente
│   │   ├── aiUsageService.ts    # Controle de quota de IA
│   │   └── index.ts             # Export central
│   │
│   ├── context/                  # ✨ NOVO
│   │   ├── AuthContext.tsx      # Estado global de autenticação
│   │   ├── TenantContext.tsx    # Estado global de tenant
│   │   └── index.ts             # Export central
│   │
│   └── components/               # ✨ ATUALIZADO
│       ├── ProtectedRoute.tsx   # Proteção de rotas por role
│       └── DashboardCard.tsx    # (existente)
│
├── views/                        # Views (UI apenas)
│   ├── Login.tsx                # ♻️ REFATORADO
│   ├── Register.tsx
│   ├── admin/
│   ├── nutri/
│   └── patient/
│
├── layouts/
│   └── MainLayout.tsx           # ♻️ REFATORADO
│
├── App.tsx                       # ♻️ REFATORADO
├── constants.tsx                 # ♻️ ATUALIZADO
└── types.ts                      # ⚠️ DEPRECATED (usar src/types/)
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO

### Antes (Problemas)
- ❌ Lógica de login hardcoded no componente
- ❌ Dados no localStorage sem validação
- ❌ Props drilling (user passado por toda árvore)
- ❌ Sem controle de sessão

### Depois (Solução)
- ✅ **AuthService**: Camada de abstração para autenticação
- ✅ **AuthContext**: Estado global acessível via `useAuth()`
- ✅ **Preparado para Supabase**: Estrutura compatível com Supabase Auth
- ✅ **Validação de Role**: `hasRole()` e `belongsToTenant()`

### Uso
```typescript
// Em qualquer componente
import { useAuth } from '../src/context';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // user.role: 'admin' | 'nutritionist' | 'patient'
  // user.tenantId: ID do nutricionista (null para admin)
  // user.profile: { name, crn, nutriCode, etc }
};
```

---

## 🏢 ARQUITETURA MULTI-TENANT

### Conceito
- **Tenant** = Cada nutricionista é um tenant independente
- **Isolamento**: Pacientes pertencem a um único tenant
- **Admin**: Acesso global a todos os tenants

### Estrutura de Dados

#### User (Autenticação)
```typescript
{
  id: string;
  email: string;
  role: 'admin' | 'nutritionist' | 'patient';
  tenantId: string | null;  // null para admin
  profile: {
    name: string;
    crn?: string;           // Para nutricionistas
    nutriCode?: string;     // Código de cadastro
    linkedNutriId?: string; // Para pacientes
  }
}
```

#### Tenant (Nutricionista)
```typescript
{
  id: string;
  nutritionistId: string;
  businessName: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'basic' | 'premium';
  aiQuotaDaily: number;
  aiQuotaMonthly: number;
}
```

#### Patient (Paciente)
```typescript
{
  id: string;
  tenantId: string;  // ← ISOLAMENTO MULTI-TENANT
  userId: string;
  name: string;
  email: string;
  weight?: number;
  height?: number;
  objective?: string;
}
```

### TenantContext

```typescript
import { useTenant } from '../src/context';

const MyComponent = () => {
  const { 
    tenant,          // Dados do nutricionista/tenant
    tenantUsage,     // Uso de IA (diário/mensal)
    canUseAI,        // Boolean: pode usar IA?
    refreshUsage     // Atualizar contadores
  } = useTenant();
  
  if (!canUseAI) {
    return <div>Cota de IA excedida</div>;
  }
};
```

---

## 🛡️ PROTEÇÃO DE ROTAS

### ProtectedRoute Component

```typescript
// Proteger por autenticação
<ProtectedRoute>
  <MyComponent />
</ProtectedRoute>

// Proteger por role
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>

// Proteger por role + tenant
<ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
  <PatientsList />
</ProtectedRoute>
```

### Comportamento
1. **Não autenticado** → Redireciona para `/login`
2. **Role inválida** → Mostra tela de "Acesso Negado"
3. **Sem tenant** → Mostra tela de "Configuração Incompleta"

---

## 🔧 CAMADA DE SERVIÇOS

### authService
```typescript
import { authService } from '../src/services';

// Login
await authService.login(email, password);

// Logout
await authService.logout();

// Verificar role
authService.hasRole('admin');

// Verificar tenant
authService.belongsToTenant(tenantId);

// Atualizar perfil
await authService.updateProfile({ name: 'Novo Nome' });
```

### patientService
```typescript
import { patientService } from '../src/services';

// Listar pacientes (filtrado por tenant automaticamente)
const { data, total } = await patientService.getPatients({
  search: 'juliana',
  page: 1,
  pageSize: 20
});

// Criar paciente
const patient = await patientService.createPatient({
  userId: '123',
  name: 'João Silva',
  email: 'joao@email.com',
  weight: 75,
  height: 180,
  objective: 'Emagrecimento'
});

// Adicionar medição
await patientService.addMeasurement(patientId, {
  weight: 74,
  bodyFat: 18,
  measuredAt: new Date().toISOString()
});

// Histórico
const history = await patientService.getPatientHistory(patientId);
```

### aiUsageService
```typescript
import { aiUsageService } from '../src/services';

// Verificar se pode usar IA
const { allowed, reason, remaining } = await aiUsageService.canUseAI();

if (!allowed) {
  alert(reason); // "Cota diária excedida"
  return;
}

// Registrar uso
await aiUsageService.recordUsage('meal_plan', 1);

// Ver resumo de uso
const summary = await aiUsageService.getUsageSummary(tenantId);
// { dailyUsage: 12, monthlyUsage: 145, dailyQuota: 50, monthlyQuota: 1000 }
```

---

## 🔄 INTEGRAÇÃO COM SUPABASE (PRÓXIMOS PASSOS)

### 1. Configuração Inicial

```bash
npm install @supabase/supabase-js
```

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### 2. Schema SQL (Supabase)

```sql
-- Users table (managed by Supabase Auth)
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'nutritionist', 'patient')),
  tenant_id UUID,
  crn TEXT,
  nutri_code TEXT,
  linked_nutri_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'free',
  ai_quota_daily INTEGER DEFAULT 5,
  ai_quota_monthly INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  weight DECIMAL,
  height DECIMAL,
  objective TEXT,
  last_consultation DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Nutritionists can only see their own patients
CREATE POLICY "Nutritionists see own patients"
  ON patients FOR SELECT
  USING (tenant_id = auth.uid());

-- Policy: Patients can only see themselves
CREATE POLICY "Patients see themselves"
  ON patients FOR SELECT
  USING (user_id = auth.uid());

-- AI Usage table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 1,
  cost DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Atualizar authService

```typescript
// src/services/authService.ts
import { supabase } from '../lib/supabase';

async login(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  // Buscar profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  return {
    id: data.user.id,
    email: data.user.email!,
    role: profile.role,
    tenantId: profile.tenant_id,
    profile: {
      userId: profile.id,
      name: profile.name,
      crn: profile.crn,
      nutriCode: profile.nutri_code
    }
  };
}
```

### 4. Atualizar patientService

```typescript
// src/services/patientService.ts
import { supabase } from '../lib/supabase';

async getPatients(filters?: FilterOptions): Promise<PaginatedResponse<Patient>> {
  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' });
  
  // RLS automaticamente filtra por tenant_id
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    data: data || [],
    total: count || 0,
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    hasMore: (count || 0) > (filters?.pageSize || 20)
  };
}
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### Autenticação
| Antes | Depois |
|-------|--------|
| Hardcoded no Login.tsx | authService.ts |
| Props drilling | useAuth() hook |
| localStorage direto | Camada de abstração |
| Sem validação | hasRole(), belongsToTenant() |

### Dados
| Antes | Depois |
|-------|--------|
| Arrays mockados em componentes | Services centralizados |
| Sem tenant_id | Todos os dados com tenantId |
| Sem paginação | PaginatedResponse<T> |
| Sem filtros | FilterOptions |

### Rotas
| Antes | Depois |
|-------|--------|
| Condicionais no App.tsx | ProtectedRoute component |
| Qualquer um acessa qualquer rota | Role-based access control |
| Sem verificação de tenant | requireTenant flag |

### Arquitetura
| Antes | Depois |
|-------|--------|
| Lógica nos componentes | Camada de services |
| Sem gerenciamento de estado | AuthContext + TenantContext |
| Não escalável | Multi-tenant ready |
| Não preparado para Supabase | Supabase-ready |

---

## 🚀 PRÓXIMOS PASSOS

### Fase 1: Integração Supabase (1-2 semanas)
1. ✅ Criar projeto no Supabase
2. ✅ Executar migrations SQL
3. ✅ Configurar RLS policies
4. ✅ Atualizar services para usar Supabase
5. ✅ Testar isolamento de tenants

### Fase 2: Features Avançadas (2-3 semanas)
1. Upload de avatares (Supabase Storage)
2. Realtime updates (Supabase Realtime)
3. Email notifications (Supabase Edge Functions)
4. Backup automático
5. Exportação de dados

### Fase 3: Produção (1 semana)
1. Configurar CI/CD
2. Testes E2E
3. Monitoramento e logs
4. Deploy

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Arquivos Deprecated
- `types.ts` (raiz) → Usar `src/types/`
- Lógica de autenticação em componentes → Usar `authService`

### 🔒 Segurança
- Todos os services verificam permissões
- RLS no Supabase garantirá isolamento de dados
- Tokens gerenciados pelo Supabase Auth

### 🎯 Convenções
- **Roles**: `admin`, `nutritionist`, `patient` (em inglês)
- **IDs**: UUIDs (preparado para Supabase)
- **Timestamps**: ISO 8601 strings
- **Naming**: camelCase para código, snake_case para DB

---

## 👥 FLUXOS DE USUÁRIO

### Admin
1. Login → Dashboard global
2. Ver todos os nutricionistas
3. Ver uso de IA agregado
4. Criar/editar/desativar nutricionistas
5. Configurações globais

### Nutricionista
1. Login → Dashboard do tenant
2. Ver apenas seus pacientes
3. Criar planos alimentares
4. Usar IA (respeitando quota)
5. Gerenciar prontuários

### Paciente
1. Login → Seu plano alimentar
2. Ver apenas seus dados
3. Registrar medidas
4. Gerar receitas com IA
5. Ver evolução

---

## 🎉 CONCLUSÃO

A refatoração transformou o NutriSaaS de um protótipo monolítico em uma aplicação SaaS multi-tenant profissional, pronta para escalar e integrar com Supabase. Toda a lógica de negócio está isolada, os dados estão preparados para multi-tenancy, e a arquitetura é limpa e manutenível.

**Próximo passo**: Integrar com Supabase e fazer deploy! 🚀
