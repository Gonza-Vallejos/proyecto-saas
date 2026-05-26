import { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Store, Package, LogOut, Settings, ExternalLink, LayoutGrid, Palette, Bell, User, KeyRound, Menu as MenuIcon, QrCode, Sandwich, UserCog, MessageSquare, History, MonitorSmartphone, Archive } from 'lucide-react';
import { Avatar, Text, Group, Badge, Indicator, Tooltip, Stack, ActionIcon, Menu, Modal, TextInput, PasswordInput, Button, Drawer, Divider } from '@mantine/core';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import AdminNavLink from '../components/AdminNavLink';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'SUPERADMIN' | 'STORE_ADMIN' | 'CASHIER';
  storeId?: string;
}

export default function AdminLayout() {
  const { storeSlug } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [storeData, setStoreData] = useState<{ slug: string, logoUrl?: string, name: string, hasModifiers?: boolean, hasOrderManagement?: boolean, hasWhatsAppOrders?: boolean, hasPOS?: boolean } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  useEffect(() => {
    const activeSlug = storeSlug || 'master';
    api.setStoreContext(activeSlug);

    const tokenKey = storeSlug ? `token_${storeSlug}` : 'token';
    const token = localStorage.getItem(tokenKey);

    if (token) {
      setIsAuthenticated(true);
      fetchProfile(token);
    } else {
      setIsAuthenticated(false);
    }
  }, [storeSlug]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);

        if (data.role === 'STORE_ADMIN' && storeSlug) {
           fetchStoreInfo(token);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Error fetching profile', e);
      setIsAuthenticated(false);
    }
  };

  const fetchStoreInfo = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoreData(data);

        if (storeSlug && data.slug !== storeSlug) {
           console.warn('Slug mismatch. Redirecting to correct store dashboard.');
           navigate(`/admin/${data.slug}`, { replace: true });
        }
      }
    } catch (e) {
      console.error('Error fetching store info', e);
    }
  };

  const handleLogout = () => {
    if (storeSlug) {
      localStorage.removeItem(`token_${storeSlug}`);
    }
    localStorage.removeItem('token');

    api.setStoreContext(null);
    navigate('/login');
  };

  const openProfileModal = () => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setProfilePassword('');
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const payload: Record<string, string> = {};
      if (profileName && profileName !== user?.name) payload.name = profileName;
      if (profileEmail && profileEmail !== user?.email) payload.email = profileEmail;
      if (profilePassword && profilePassword.trim().length > 0) payload.password = profilePassword;

      if (Object.keys(payload).length === 0) {
        setProfileModalOpen(false);
        return;
      }

      const updated = await api.patch('/auth/profile', payload);
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
      setProfileModalOpen(false);

      if (payload.password) {
        Swal.fire({
          title: '¡Contraseña actualizada!',
          text: 'Tu sesión sigue activa. La próxima vez usarás la nueva contraseña.',
          icon: 'success',
        });
      } else {
        Swal.fire('Guardado', 'Tu perfil fue actualizado.', 'success');
      }
    } catch (e: unknown) {
      Swal.fire('Error', e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  if (isAuthenticated === null) return <div className="loader-container">Comprobando credenciales...</div>;
  if (isAuthenticated === false) return <Navigate to="/login" replace />;
  if (!user) return <div className="loader-container">Cargando perfil...</div>;

  const isActive = (path: string) => location.pathname === path;

  const adminPrefix = storeSlug ? `/admin/${storeSlug}` : '/admin/master';

  const navLinks = user.role === 'SUPERADMIN' ? (
    <>
      <AdminNavLink to="/admin/master" active={isActive('/admin/master')}>
        <Store size={18} /> Gestión de Tiendas
      </AdminNavLink>
    </>
  ) : user.role === 'CASHIER' ? (
    <>
      <AdminNavLink to={`${adminPrefix}/pos`} active={isActive(`${adminPrefix}/pos`)}>
        <MonitorSmartphone size={18} /> Punto de Venta
      </AdminNavLink>
      <AdminNavLink to={`${adminPrefix}/orders-history`} active={isActive(`${adminPrefix}/orders-history`)}>
        <History size={18} /> Historial de Pedidos
      </AdminNavLink>
      {storeData?.hasWhatsAppOrders && (
        <AdminNavLink to={`${adminPrefix}/orders-online`} active={isActive(`${adminPrefix}/orders-online`)}>
          <MessageSquare size={18} /> Pedidos Online
        </AdminNavLink>
      )}
    </>
  ) : (
    <>
      {storeData?.hasPOS && (
        <>
          <AdminNavLink to={`${adminPrefix}/pos`} active={isActive(`${adminPrefix}/pos`)}>
            <MonitorSmartphone size={18} /> Punto de Venta
          </AdminNavLink>
          <AdminNavLink to={`${adminPrefix}/cash-registers`} active={isActive(`${adminPrefix}/cash-registers`)}>
            <Archive size={18} /> Historial de Cajas
          </AdminNavLink>
        </>
      )}
      <AdminNavLink to={adminPrefix} active={isActive(adminPrefix)}>
        <Package size={18} /> Mis Productos
      </AdminNavLink>
      <AdminNavLink to={`${adminPrefix}/categories`} active={isActive(`${adminPrefix}/categories`)}>
        <LayoutGrid size={18} /> Categorías
      </AdminNavLink>
      <AdminNavLink to={`${adminPrefix}/appearance`} active={isActive(`${adminPrefix}/appearance`)}>
        <Palette size={18} /> Aspecto
      </AdminNavLink>
      {storeData?.hasModifiers && (
        <AdminNavLink to={`${adminPrefix}/modifiers`} active={isActive(`${adminPrefix}/modifiers`)}>
          <Sandwich size={18} /> Modificadores
        </AdminNavLink>
      )}
      <AdminNavLink to={`${adminPrefix}/qr`} active={isActive(`${adminPrefix}/qr`)}>
        <QrCode size={18} /> Código QR
      </AdminNavLink>
      <AdminNavLink to={`${adminPrefix}/settings`} active={isActive(`${adminPrefix}/settings`)}>
        <Settings size={18} /> Mi Tienda
      </AdminNavLink>

      {storeData?.hasWhatsAppOrders && (
        <AdminNavLink to={`${adminPrefix}/orders-online`} active={isActive(`${adminPrefix}/orders-online`)}>
          <MessageSquare size={18} /> Pedidos Online
        </AdminNavLink>
      )}

      <AdminNavLink to={`${adminPrefix}/orders-history`} active={isActive(`${adminPrefix}/orders-history`)}>
        <History size={18} /> Historial de Pedidos
      </AdminNavLink>

      {(storeData?.hasOrderManagement || storeData?.hasPOS) && (
        <>
          <Divider label="Personal" labelPosition="center" my="sm" />
          <AdminNavLink to={`${adminPrefix}/staff`} active={isActive(`${adminPrefix}/staff`)}>
            <UserCog size={18} /> Gestión de Personal
          </AdminNavLink>
        </>
      )}
    </>
  );

  return (
    <div className="admin-shell">

      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-inner">
            <div className="admin-sidebar-logo">
              <Store size={22} />
            </div>
            <h2 className="admin-sidebar-title">
               {user.role === 'SUPERADMIN' ? 'Admin Maestro' : 'Backoffice'}
            </h2>
          </div>
        </div>

        <nav className="admin-nav">
          {navLinks}
        </nav>

        <div className="admin-sidebar-user">
          <div className="admin-sidebar-user-inner">
            <Avatar
              src={user.role === 'STORE_ADMIN' ? storeData?.logoUrl : null}
              radius="xl"
              size="sm"
              color="blue"
            >
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </Avatar>
            <div className="admin-sidebar-user-meta">
              <Text size="xs" fw={700} truncate>{user.name || 'Admin'}</Text>
              <Text size="10px" c="dimmed" truncate>{user.email}</Text>
            </div>
          </div>
        </div>
      </aside>

      <Drawer
        opened={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        size="xs"
        padding="md"
        title={
          <Group gap="sm">
            <div className="admin-sidebar-logo">
              <Store size={18} />
            </div>
            <Text fw={800} size="sm">{user.role === 'SUPERADMIN' ? 'Admin Maestro' : 'Backoffice'}</Text>
          </Group>
        }
      >
        <Stack gap="xs" mt="md">
          {navLinks}
        </Stack>
      </Drawer>

      <div className="admin-main">

        <header className="admin-header">
          <Group gap="md">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => setMobileNavOpen(true)}
              className="mobile-menu-btn"
            >
              <MenuIcon size={22} />
            </ActionIcon>

            {user.role === 'STORE_ADMIN' && storeData && (
              <Badge variant="dot" color="blue" size="lg" radius="sm">
                TIENDA ACTIVA: {storeData.name.toUpperCase()}
              </Badge>
            )}
            {user.role === 'SUPERADMIN' && (
              <Badge variant="filled" color="dark" size="lg" radius="sm">MODO MAESTRO</Badge>
            )}
          </Group>

          <Group gap="lg">
            {user.role === 'STORE_ADMIN' && (
              <Tooltip label="Ver Previsualización Pública">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  onClick={() => window.open(`/s/${storeData?.slug}`, '_blank')}
                >
                  <ExternalLink size={20} />
                </ActionIcon>
              </Tooltip>
            )}

            <Indicator inline size={12} offset={7} position="top-end" color="red" withBorder>
              <ActionIcon variant="transparent" color="gray" size="lg">
                <Bell size={20} />
              </ActionIcon>
            </Indicator>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Group gap="sm" className="admin-header-profile">
                   <Stack gap={0} align="flex-end" className="desktop-only">
                     <Text size="sm" fw={700} c="#0f172a">{user.name || 'Admin User'}</Text>
                     <Text size="xs" c="dimmed">{user.email}</Text>
                   </Stack>
                   <Avatar
                     src={user.role === 'STORE_ADMIN' ? storeData?.logoUrl : null}
                     radius="xl"
                     size="md"
                     color="blue"
                     className="cursor-pointer"
                   >
                     {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                   </Avatar>
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Mi Cuenta</Menu.Label>
                <Menu.Item leftSection={<User size={16} />} onClick={openProfileModal}>
                  Editar Perfil
                </Menu.Item>
                <Menu.Item leftSection={<KeyRound size={16} />} onClick={openProfileModal}>
                  Cambiar Contraseña
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<LogOut size={16} />} onClick={handleLogout}>
                  Cerrar Sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </header>

        <main className="admin-content">
          <Outlet context={{ user, storeData }} />
        </main>
      </div>

      <Modal
        opened={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Editar Mi Perfil"
        radius="md"
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Tu nombre completo"
          />
          <TextInput
            label="Email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            placeholder="tu@email.com"
          />
          <PasswordInput
            label="Nueva Contraseña (opcional)"
            value={profilePassword}
            onChange={(e) => setProfilePassword(e.target.value)}
            placeholder="Dejar vacío para mantener la actual"
            description="Mínimo 6 caracteres"
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="light" color="gray" onClick={() => setProfileModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProfile}>Guardar Cambios</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
