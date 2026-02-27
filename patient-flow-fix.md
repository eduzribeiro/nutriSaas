# Otimização do Fluxo de Pacientes e Integração Nutricionista/Admin

## 1. Visão Geral
Este plano descreve as ações para corrigir e otimizar o fluxo de dados entre Admins, Nutricionistas e Pacientes no NutriSaaS, visando garantir as permissões corretas (RLS), o vínculo correto no cadastro através de código da nutri e e-mail no paciente, cotas de IA exibidas e aplicadas e inserção/impressão da receita médica.

## 2. Tarefas e Requisitos

### Backend (Banco de Dados / Supabase / RLS)
- [ ] Revisar as tabelas `patients` (ou o modo como o tenant identifica se um usuário é paciente).
- [ ] Ajustar as RLS para que o paciente consiga visualizar todas as informações (dietas, receitas médicas, progresso) cadastradas por sua nutricionista.
- [ ] Criar ou atualizar a tabela de cotas (se houver `ai_quotas`) para suportar um limite de "2 requisições por dia" na IA para o paciente.
- [ ] O limite *mensal* do paciente deve vir do valor configurado pelo *admin* globalmente na tabela de configurações ou planos do tenant.
- [ ] Garantir RLS permitindo que o admin consiga alterar esse limite de cota mensal visível pra todos os pacientes.

### Frontend - Fluxo de Nutricionista
- [ ] Cadastro do Paciente pela Nutri: Obrigatório adicionar campo `E-mail`.
- [ ] Cadastro da Receita Médica: Nova aba ou formulário no painel da nutri onde possa digitar um texto livre com o rodapé padrão, salvar para o paciente ver e imprimir/salvar PDF (`window.print()`).
- [ ] Ajuste no Prompt do Plano Alimentar com IA: Especificar "Calorias aproximadas e ao menos duas opções de prato para cada refeição."

### Frontend - Fluxo do Paciente
- [ ] Sign-up / Login: O paciente precisa colocar o código da nutri e o *mesmo* e-mail cadastrado pela nutri para ele para que seja vinculado automaticamente.
- [ ] Exibição no App: Ao fazer o login, o contexto do paciente deve buscar os documentos que a nutricionista gerou.
- [ ] Cotas da IA do Paciente: Mostrar visualmente a quantidade gasta de 2 ao dia e o limite total mensal permitido.

## 3. Ordem de Execução
1. Mapear o banco de dados e aplicar os perfis corretos via script backend.
2. Atualizar as APIs e componentes React da Nutricionista (cadastro, receita médica, IA prompt).
3. Atualizar o cadastro e exibições do paciente (dashboard do paciente).
4. Rodar scripts de checagem.
