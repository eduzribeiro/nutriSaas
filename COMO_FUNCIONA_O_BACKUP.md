# 💾 Guia Oficial: Exportação e Importação de Backups (NutriSaaS)

Como a plataforma NutriSaaS opera na nuvem usando um banco de dados relacional (Supabase/PostgreSQL) e arquitetura Multi-Tenant (onde cada nutricionista tem seu "cofre" isolado), a funcionalidade de backup local segue um fluxo de engenharia de dados seguro para garantir que a nutricionista possa guardar os dados no PC dela.

Este documento explica **como a nova funcionalidade de Exportação e Importação será estruturada e funcionará** dentro do ecossistema NutriSaaS.

---

## 1. Como funcionará a Exportação (Download para o PC)

O processo de exportação fará com que o sistema colete todos os dados pertencentes *somente* àquele consultório/nutricionista e gere um arquivo unificado e criptografado para baixar.

**Fluxo Técnico:**
1. A nutricionista clica em **"Exportar Backup Local"** na tela de Configurações.
2. O servidor (via uma nova Edge Function/RPC no Supabase) varre o banco de dados filtrando pelo `tenant_id` da nutricionista:
   - Extrai o Perfil da Nutricionista (Configurações)
   - Extrai todos os **Pacientes** (`patients`)
   - Extrai todas as **Medições** (`patient_measurements`)
   - Extrai todos os **Planos Alimentares** (`meal_plans`)
   - Extrai todas as **Receitas e Prontuários** (`recipes`, `anamnesis`)
3. O servidor converte toda essa estrutura em formato **JSON** (JavaScript Object Notation - formato universal e seguro).
4. O arquivo JSON é compactado, encriptado (opcionalmente) e inicia-se o download no navegador para o PC com um nome padronizado: `NutriSaaS-Backup_NOME_DATA.json`.

---

## 2. Como funcionará a Importação (Restauração do PC)

A importação serve para "puxar" os dados guardados no PC de volta para o sistema. 

**Fluxo Técnico:**
1. Na tela de Configurações, a nutricionista selecionará a opção **"Importar Backup Local"**.
2. Uma janela permitirá selecionar o arquivo `NutriSaaS-Backup_DATA.json` do computador.
3. Ao enviar o arquivo, o sistema passará por um **Validador de Integridade**:
   - Vai verificar se o arquivo não está corrompido.
   - Vai certificar-se de que o backup pertence a esta mesma nutricionista (verificando assinaturas internas).
4. Ocorrerá o protocolo de **Upsert (Update/Insert)**:
   - O sistema vai ler os dados do arquivo e inseri-los no banco de dados nas nuvens. 
   - Se um paciente já existir, os dados serão mesclados (ignorando os dados repetidos e adicionando o que estava no backup).
   - Isso evita dados duplicados e bagunça no banco.
5. Um aviso de sucesso "Seus dados foram restaurados com sucesso!" será emitido, e a plataforma será atualizada.

---

## 3. Desafios de Conflitos e Banco de Dados (Atenção)

**Problema das Chaves Primárias (UUIDs):**  
Nenhum dado é solto. Uma receita sempre está amarrada ao ID único de um Paciente que está amarrado ao ID Único do Nutricionista. O Backup exporta essas "amarras". Na importação, o sistema vai preservar esses mapeamentos usando os UUIDs exatos para garantir que o Plano A, volte diretamente para o Paciente B, etc.

**Imagens e Avatares:**  
Os arquivos baixados no PC (o `.json`) conteria apenas dados textuais. Imagens (fotos de perfil) baixá-las junto exigiria que exportássemos um `.zip` inteiro (o que torna a arquitetura pesada). Logo, a melhor prática é exportar textualmente tudo, exceto os arquivos pesados de fotos, que permanecem no servidor principal no `storage` (Storage nativo). Se a foto foi deletada do storage principal, ela é resetada na importação.

## 4. Onde a NutriSaaS já é Segura Mesmo Sem Backup Manual

É importante lembrar que o NutriSaaS é construído sobre a infraestrutura da nuvem do Supabase, o que significa:
*   **Backups Diários e Automáticos (PITR):** A própria plataforma já espelha os dados todos os dias de forma invisível nos servidores da base na Virgina/EUA (AWS). Um falha local jamais apagaria as clínicas.
*   A exportação "para o PC" atua mais como uma tranquilidade psicológica para as nutricionistas (para elas sentirem que "os dados estão na minha posse" também e não aprisionados), o que é um fortíssimo gatilho de vendas e credibilidade para a NutriSaaS. 

---

### **Próximos Passos Sugeridos para o Desenvolvimento (Fase 2):**
1. Adicionar o Botão (UI) em `views/nutri/Profile.tsx` (Seção Backups).
2. Criar duas funções RPC exclusivas (Supabase): `admin_export_tenant_data` e `admin_import_tenant_data`.
3. Validar a velocidade de download de bancos cheios.
