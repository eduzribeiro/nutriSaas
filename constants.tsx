
import React from 'react';
import { LayoutDashboard, Users, Brain, Settings, Utensils, ClipboardList, BookOpen, LineChart, Download, UserCircle, FileText, Printer } from 'lucide-react';

export const COLORS = {
  primary: 'emerald-600',
  secondary: 'emerald-500',
  accent: 'emerald-50',
  text: 'slate-800',
  lightText: 'slate-500',
};

export const MENU_ITEMS = {
  admin: [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Nutricionistas', icon: <Users size={20} />, path: '/nutricionistas' },
    { label: 'Uso de IA', icon: <Brain size={20} />, path: '/ia-usage' },
    { label: 'Configurações', icon: <Settings size={20} />, path: '/settings' },
  ],
  nutritionist: [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Pacientes', icon: <Users size={20} />, path: '/pacientes' },
    { label: 'Planos Alimentares', icon: <Utensils size={20} />, path: '/planos' },
    { label: 'Prontuários', icon: <ClipboardList size={20} />, path: '/prontuarios' },
    { label: 'Anamnese', icon: <BookOpen size={20} />, path: '/anamnese' },
    { label: 'Evolução', icon: <LineChart size={20} />, path: '/evolucao' },
    { label: 'Receituários', icon: <FileText size={20} />, path: '/receituarios' },
    { label: 'Documentos', icon: <Printer size={20} />, path: '/documentos' },
    { label: 'Perfil', icon: <UserCircle size={20} />, path: '/perfil' },
  ],
  patient: [
    { label: 'Meu Plano', icon: <Utensils size={20} />, path: '/meu-plano' },
    { label: 'Minhas Medidas', icon: <LineChart size={20} />, path: '/medidas' },
    { label: 'Receituários', icon: <FileText size={20} />, path: '/meus-receituarios' },
    { label: 'Gerar Receita (IA)', icon: <Brain size={20} />, path: '/gerar-receita' },
    { label: 'Perfil', icon: <UserCircle size={20} />, path: '/perfil-paciente' },
  ],
};
