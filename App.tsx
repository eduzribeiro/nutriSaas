import React from 'react';
// Main App Component with Routing
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, TenantProvider } from './src/context';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import Login from './views/Login';
import Register from './views/Register';
import MainLayout from './layouts/MainLayout';
import AdminDashboard from './views/admin/Dashboard';
import AdminNutricionistas from './views/admin/Nutricionistas';
import AdminIAUsage from './views/admin/IAUsage';
import AdminSettings from './views/admin/Settings';
import NutriDashboard from './views/nutri/Dashboard';
import NutriPatients from './views/nutri/Patients';
import NutriMealPlans from './views/nutri/MealPlans';
import NutriProntuarios from './views/nutri/Prontuarios';
import NutriAnamnese from './views/nutri/Anamnese';
import NutriEvolucao from '@/views/nutri/Evolucao';
import NutriProfile from './views/nutri/Profile';
import NutriPrintCenter from './views/nutri/PrintCenter';
import NutriPrescriptions from './views/nutri/Prescriptions';
import PatientPlan from './views/patient/MyPlan';
import PatientMeasures from './views/patient/Measures';
import PatientRecipes from './views/patient/Recipes';
import PatientProfile from './views/patient/Profile';
import PatientPrescriptions from './views/patient/Prescriptions';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      {/* Admin routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/nutricionistas"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminNutricionistas />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ia-usage"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminIAUsage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminSettings />
                          </ProtectedRoute>
                        }
                      />

                      {/* Nutritionist routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/pacientes"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriPatients />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/planos"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriMealPlans />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/prontuarios"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriProntuarios />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/anamnese"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriAnamnese />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/evolucao"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriEvolucao />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/receituarios"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriPrescriptions />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/documentos"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriPrintCenter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/perfil"
                        element={
                          <ProtectedRoute allowedRoles={['nutritionist']} requireTenant>
                            <NutriProfile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Patient routes */}
                      <Route
                        path="/meu-plano"
                        element={
                          <ProtectedRoute allowedRoles={['patient']} requireTenant>
                            <PatientPlan />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medidas"
                        element={
                          <ProtectedRoute allowedRoles={['patient']} requireTenant>
                            <PatientMeasures />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/meus-receituarios"
                        element={
                          <ProtectedRoute allowedRoles={['patient']} requireTenant>
                            <PatientPrescriptions />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/gerar-receita"
                        element={
                          <ProtectedRoute allowedRoles={['patient']} requireTenant>
                            <PatientRecipes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/perfil-paciente"
                        element={
                          <ProtectedRoute allowedRoles={['patient']} requireTenant>
                            <PatientProfile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
