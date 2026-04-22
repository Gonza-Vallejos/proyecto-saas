import { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { Store, Package, LogOut, Settings, ExternalLink, LayoutGrid, Palette, Bell, User, KeyRound, Menu as MenuIcon, QrCode, Sandwich, Utensils, ChefHat, UserCog, MessageSquare } from 'lucide-react';
import { Avatar, Text, Group, Badge, Indicator, Tooltip, Stack, ActionIcon, Menu, Modal, TextInput, PasswordInput, Button, Drawer, Divider } from '@mantine/core';
import { api } from '../utils/api';
import Swal from 'sweetalert2';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'SUPERADMIN' | 'STORE_ADMIN';
  storeId?: string;
}

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [storeData, setStoreData] = useState<{ slug: string, logoUrl?: string, name: string, hasModifiers?: boolean, hasOrderManagement?: boolean } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchProfile(token);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.role === 'STORE_ADMIN' && data.storeId) {
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
      }
    } catch (e) {
      console.error('Error fetching store info', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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
      const payload: any = {};
      if (profileName && profileName !== user?.name) payload.name = profileName;
      if (profileEmail && profileEmail !== user?.email) payload.email = profileEmail;
      if (profilePassword && profilePassword.trim().length > 0) payload.password = profilePassword;

      if (Object.keys(payload).length === 0) {
        setProfileModalOpen(false);
        return;
      }

      const updated = await api.patch('/auth/profile', payload);
      setUser((prev: any) => ({ ...prev, ...updated }));
      setProfileModalOpen(false);

      // Si cambió la contraseña, re-loguear
      if (payload.password) {
        Swal.fire({
          title: '¡Contraseña actualizada!',
          text: 'Tu sesión sigue activa. La próxima vez usarás la nueva contraseña.',
          icon: 'success',
        });
      } else {
        Swal.fire('Guardado', 'Tu perfil fue actualizado.', 'success');
      }
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  if (isAuthenticated === null) return <div className="loader-container">Comprobando credenciales...</div>;
  if (isAuthenticated === false) return <Navigate to="/login" replace />;
  if (!user) return <div className="loader-container">Cargando perfil...</div>;

  const isActive = (path: string) => location.pathname === path;

  const navLinks = user.role === 'SUPERADMIN' ? (
    <>
      <Link to="/admin" style={{ ...navLinkStyle, ...(isActive('/admin') ? activeNavLinkStyle : {}) }}>
        <Store size={18} /> Gestión de Tiendas
      </Link>
    </>
  ) : (
    <>
      <Link to="/admin" style={{ ...navLinkStyle, ...(isActive('/admin') ? activeNavLinkStyle : {}) }}>
        <Package size={18} /> Mis Productos
      </Link>
      <Link to="/admin/categories" style={{ ...navLinkStyle, ...(isActive('/admin/categories') ? activeNavLinkStyle : {}) }}>
        <LayoutGrid size={18} /> Categorías
      </Link>
      <Link to="/admin/appearance" style={{ ...navLinkStyle, ...(isActive('/admin/appearance') ? activeNavLinkStyle : {}) }}>
        <Palette size={18} /> Aspecto
      </Link>
      {storeData?.hasModifiers && (
        <Link to="/admin/modifiers" style={{ ...navLinkStyle, ...(isActive('/admin/modifiers') ? activeNavLinkStyle : {}) }}>
          <Sandwich size={18} /> Modificadores
        </Link>
      )}
      <Link to="/admin/qr" style={{ ...navLinkStyle, ...(isActive('/admin/qr') ? activeNavLinkStyle : {}) }}>
        <QrCode size={18} /> Código QR
      </Link>
      <Link to="/admin/settings" style={{ ...navLinkStyle, ...(isActive('/admin/settings') ? activeNavLinkStyle : {}) }}>
        <Settings size={18} /> Mi Tienda
      </Link>

      {storeData?.hasOrderManagement && (
        <>
          <Divider label="Gastro Pro" labelPosition="center" my="sm" />
          <Link to="/admin/tables" style={{ ...navLinkStyle, ...(isActive('/admin/tables') ? activeNavLinkStyle : {}) }}>
            <Utensils size={18} /> Gestión de Mesas
          </Link>
          <Link to="/admin/kitchen" style={{ ...navLinkStyle, ...(isActive('/admin/kitchen') ? activeNavLinkStyle : {}) }}>
            <ChefHat size={18} /> Monitor de Cocina
          </Link>
          <Link to="/admin/staff" style={{ ...navLinkStyle, ...(isActive('/admin/staff') ? activeNavLinkStyle : {}) }}>
            <UserCog size={18} /> Gestión de Personal
          </Link>
          <Link to="/admin/orders-online" style={{ ...navLinkStyle, ...(isActive('/admin/orders-online') ? activeNavLinkStyle : {}) }}>
            <MessageSquare size={18} /> Pedidos WhatsApp
          </Link>
        </>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* Sidebar - Desktop */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }} className="desktop-sidebar">
        <div style={{ padding: '1.5rem 1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ background: '#0ea5e9', padding: '6px', borderRadius: '8px', color: 'white' }}>
              <Store size={22} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
               {user.role === 'SUPERADMIN' ? 'Admin Maestro' : 'Backoffice'}
            </h2>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          {navLinks}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
            <Avatar 
              src={user.role === 'STORE_ADMIN' ? storeData?.logoUrl : null} 
              radius="xl" 
              size="sm" 
              color="blue"
            >
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Text size="xs" fw={700} truncate>{user.name || 'Admin'}</Text>
              <Text size="10px" color="dimmed" truncate>{user.email}</Text>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Drawer */}
      <Drawer 
        opened={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
        size="xs"
        padding="md"
        title={
          <Group gap="sm">
            <div style={{ background: '#0ea5e9', padding: '4px', borderRadius: '6px', color: 'white' }}>
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

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Modern Header */}
        <header style={{ 
          height: '70px', 
          backgroundColor: '#ffffff', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <Group gap="md">
            {/* Mobile hamburger */}
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

            {/* Profile Menu */}
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Group gap="sm" style={{ paddingLeft: '1rem', borderLeft: '1px solid #f1f5f9', cursor: 'pointer' }}>
                   <Stack gap={0} align="flex-end" className="desktop-only">
                     <Text size="sm" fw={700} color="#0f172a">{user.name || 'Admin User'}</Text>
                     <Text size="xs" color="dimmed">{user.email}</Text>
                   </Stack>
                   <Avatar 
                     src={user.role === 'STORE_ADMIN' ? storeData?.logoUrl : null} 
                     radius="xl" 
                     size="md" 
                     color="blue"
                     style={{ cursor: 'pointer' }}
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

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet context={{ user }} />
        </main>
      </div>

      {/* Profile Edit Modal */}
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

      {/* Responsive CSS */}
      <style>{`
        .desktop-sidebar {
          display: flex !important;
        }
        .mobile-menu-btn {
          display: none !important;
        }
        .desktop-only {
          display: flex !important;
        }
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .desktop-only {
            display: none !important;
          }
          main {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '0.75rem', 
  padding: '0.75rem 1rem', 
  borderRadius: '8px', 
  color: '#64748b',
  fontWeight: 500,
  textDecoration: 'none',
  fontSize: '0.9rem',
  transition: 'all 0.2s'
};

const activeNavLinkStyle: React.CSSProperties = {
  color: '#0ea5e9',
  backgroundColor: '#f0f9ff',
  fontWeight: 600
};
