import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import Products from './pages/admin/Products';
import Settings from './pages/admin/Settings';
import Categories from './pages/admin/Categories';
import StoreManagement from './pages/admin/StoreManagement';
import Appearance from './pages/admin/Appearance';
import QRGenerator from './pages/admin/QRGenerator';
import Modifiers from './pages/admin/Modifiers';
import TablesManager from './pages/admin/TablesManager';
import KitchenDashboard from './pages/admin/KitchenDashboard';
import WhatsAppOrders from './pages/admin/WhatsAppOrders';
import OrderHistory from './pages/admin/OrderHistory';
import StaffManagement from './pages/admin/StaffManagement';
import WaiterView from './pages/WaiterView';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Componente para decidir qué mostrar en el índice del /admin según el rol
const AdminIndex = () => {
  const { user } = useOutletContext<{ user: { role: string } }>();
  
  if (!user) return null;
  
  if (user.role === 'SUPERADMIN') {
    return <StoreManagement />;
  }
  
  return <Products />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para acceder directamente por slug (ej: localhost:5173/s/demo-store) */}
        <Route path="/s/:slug" element={<Catalog />} />

        {/* Fallback a la demo-store por defecto si entran a / */}
        <Route path="/" element={<Navigate to="/s/demo-store" replace />} />

        {/* Portal de Acceso */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Panel Privado Protegido */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminIndex />} />
          <Route path="categories" element={<Categories />} />
          <Route path="appearance" element={<Appearance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="qr" element={<QRGenerator />} />
          <Route path="modifiers" element={<Modifiers />} />
          <Route path="tables" element={<TablesManager />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
          <Route path="orders-online" element={<WhatsAppOrders />} />
          <Route path="orders-history" element={<OrderHistory />} />
          <Route path="staff" element={<StaffManagement />} />
        </Route>

        <Route path="/waiter" element={<WaiterView />} />

        {/* Fallback general */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
