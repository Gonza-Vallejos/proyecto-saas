import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

// Lazy‑load pages (reduces initial bundle)
const Catalog = lazy(() => import('./pages/Catalog'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin layout (kept eager because it provides the frame)
import AdminLayout from './layouts/AdminLayout';

// Lazy‑load admin sections
const Products = lazy(() => import('./pages/admin/Products'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const StoreManagement = lazy(() => import('./pages/admin/StoreManagement'));
const Appearance = lazy(() => import('./pages/admin/Appearance'));
const QRGenerator = lazy(() => import('./pages/admin/QRGenerator'));
const Modifiers = lazy(() => import('./pages/admin/Modifiers'));
const WhatsAppOrders = lazy(() => import('./pages/admin/WhatsAppOrders'));
const OrderHistory = lazy(() => import('./pages/admin/OrderHistory'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const PointOfSale = lazy(() => import('./pages/admin/PointOfSale'));
const CashRegistersHistory = lazy(() => import('./pages/admin/CashRegistersHistory'));
const Subscription = lazy(() => import('./pages/admin/Subscription'));
const SassBilling = lazy(() => import('./pages/admin/SassBilling'));

// Simple spinner for lazy loading fallback
import Spinner from './components/Spinner';
import { api } from './utils/api';
// Componente para decidir qué mostrar en el índice del /admin según el rol
const AdminIndex = () => {
  const { user } = useOutletContext<{ user: { role: string } }>();

  if (!user) return null;

  if (user.role === 'SUPERADMIN') {
    return <StoreManagement />;
  }

  if (user.role === 'CASHIER') {
    return <Navigate to="pos" replace />;
  }

  return <Products />;
};

function App() {
  useEffect(() => {
    // Ping backend periódicamente para mantener Render despierto si hay pestañas abiertas
    const pingBackend = async () => {
      try {
        await api.get('/auth/profile').catch(() => { });
      } catch (e) {
        // Ignorar errores
      }
    };

    pingBackend();
    const interval = setInterval(pingBackend, 10 * 60 * 1000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Ruta para acceder directamente por slug (ej: localhost:5173/s/demo-store) */}
          <Route path="/s/:slug" element={<Catalog />} />

          {/* Fallback a la demo-store por defecto si entran a / */}
          <Route path="/" element={<Navigate to="/s/demo-store" replace />} />

          {/* Portal de Acceso */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Panel Maestro para SuperAdmin */}
          <Route path="/admin/master" element={<AdminLayout />}>
            <Route index element={<StoreManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="billing" element={<SassBilling />} />
          </Route>

          {/* Panel de Tienda Específica */}
          <Route path="/admin/:storeSlug" element={<AdminLayout />}>
            <Route index element={<AdminIndex />} />
            <Route path="categories" element={<Categories />} />
            <Route path="appearance" element={<Appearance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="qr" element={<QRGenerator />} />
            <Route path="modifiers" element={<Modifiers />} />
            <Route path="orders-online" element={<WhatsAppOrders />} />
            <Route path="orders-history" element={<OrderHistory />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="pos" element={<PointOfSale />} />
            <Route path="cash-registers" element={<CashRegistersHistory />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>

          {/* Redirección inteligente de /admin */}
          <Route path="/admin" element={<Navigate to={`/admin/${localStorage.getItem('last_active_slug') || 'login'}`} replace />} />

          {/* Fallback general */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
