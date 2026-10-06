import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { SalesDashboard } from '../pages/dashboard/SalesDashboard';
import { QuotationsPage } from '../pages/sales/QuotationsPage';
import { SalesOrdersPage } from '../pages/sales/SalesOrdersPage';
import { InvoicesPage } from '../pages/sales/InvoicesPage';
import { PaymentsPage } from '../pages/sales/PaymentsPage';
import { PlaceholderModule } from '../pages/placeholder/PlaceholderModule';
import { ProfilePage } from '../pages/profile/ProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected ERP Application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<SalesDashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* Member 5: Sales Module Routes */}
          <Route path="/sales/quotations" element={<QuotationsPage />} />
          <Route path="/sales/orders" element={<SalesOrdersPage />} />
          <Route path="/sales/invoices" element={<InvoicesPage />} />
          <Route path="/sales/payments" element={<PaymentsPage />} />
          
          {/* User Profile & Security */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Placeholders for Other Team Members */}
          <Route path="/modules/:moduleName" element={<PlaceholderModule />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
