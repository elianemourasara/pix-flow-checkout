
import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import OrdersPage from '@/pages/admin/orders';
import ProductsPage from '@/pages/admin/products';
import AsaasSettings from '@/pages/admin/AsaasSettings';
import AsaasEmailSettings from '@/pages/admin/AsaasEmailSettings';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/admin/dashboard';
import Login from '@/pages/admin/Login';
import AdminLayout from '@/layouts/AdminLayout';
import PixSettings from '@/pages/admin/PixSettings';
import PixelSettings from '@/pages/admin/PixelSettings';
import CreditCardsList from '@/pages/admin/credit-cards';
import WebhookSimulator from '@/pages/admin/WebhookSimulator';
import AdminTools from '@/pages/admin/AdminTools';
import ApiInformation from '@/pages/admin/ApiInformation';
import TelegramSettingsPage from '@/pages/admin/TelegramSettingsPage';
import EditProductPage from '@/pages/admin/products/edit';
import NewProductPage from '@/pages/admin/products/new';

const AdminRoutes = () => {
  useEffect(() => {
    console.log('AdminRoutes mounted, checking auth state...');
  }, []);
  
  return (
    <Routes>
      {/* Public admin routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      
      {/* Dashboard - Accessible to all authenticated users */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin-only routes */}
      <Route path="/orders" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <OrdersPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <ProductsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Produto novo e edição */}
      <Route path="/products/new" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <NewProductPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products/edit/:slug" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <EditProductPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/asaas-settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AsaasSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/asaas-email-settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AsaasEmailSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Adicionando a rota de cartões de crédito */}
      <Route path="/credit-cards" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <CreditCardsList />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Adicionando as rotas de configurações PIX */}
      <Route path="/pix-settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <PixSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Adicionando as rotas de configurações de Pixel */}
      <Route path="/pixel-settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <PixelSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Adicionando rota do simulador de webhook */}
      <Route path="/webhook-simulator" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <WebhookSimulator />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Adicionando rota de ferramentas administrativas */}
      <Route path="/tools" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminTools />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Adicionando rota de informações de API */}
      <Route path="/api-information" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <ApiInformation />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Adicionando rota de configurações do Telegram */}
      <Route path="/telegram-settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <TelegramSettingsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AdminRoutes;
