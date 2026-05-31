import { useEffect, useState } from 'react';
import { Plus, Edit3, User, Globe, Store, BarChart3, Database, Package, LayoutGrid, Trash2, Settings, X } from 'lucide-react';
import { 
  Title, Text, Button, Card, Group, Stack, Badge, Table, 
  ActionIcon, Tooltip, SimpleGrid, Paper, Modal, TextInput, 
  PasswordInput, Select, Switch, Box, Divider 
} from '@mantine/core';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  hasStockControl: boolean;
  hasPayments: boolean;
  hasCart: boolean;
  isCatalogOnly: boolean;
  hasModifiers: boolean;
  showObservations: boolean;
  hasConnectivity: boolean;
  hasOrderManagement: boolean;
  hasWhatsAppOrders: boolean;
  hasPOS: boolean;
  hasMercadoPago: boolean;
  users: { email: string; name: string }[];
  _count: { products: number; categories: number; users: number };
}

export default function StoreManagement() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

  // SaaS Subscription settings states
  const [superadminMpAccessToken, setSuperadminMpAccessToken] = useState('');
  const [superadminMpPublicKey, setSuperadminMpPublicKey] = useState('');
  const [defaultSubscriptionPrice, setDefaultSubscriptionPrice] = useState(10000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);

  const fetchStores = async () => {
    try {
      const data = await api.get('/stores');
      setStores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get('/stores/master/system-settings');
      setSuperadminMpAccessToken(data.superadminMpAccessToken || '');
      setSuperadminMpPublicKey(data.superadminMpPublicKey || '');
      setDefaultSubscriptionPrice(data.defaultSubscriptionPrice || 10000);
    } catch (e) {
      console.error('Error fetching system settings', e);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.patch('/stores/master/system-settings', {
        superadminMpAccessToken,
        superadminMpPublicKey,
        defaultSubscriptionPrice: Number(defaultSubscriptionPrice)
      });
      Swal.fire({
        title: '¡Guardado!',
        text: 'Configuración de plataforma guardada correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setShowSettingsCard(false);
    } catch (e: any) {
      Swal.fire('Error', e.message || 'Error al guardar configuración', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      if (!values.ownerPassword || String(values.ownerPassword).trim().length < 6) {
        Swal.fire('Error', 'La contraseña del dueño debe tener al menos 6 caracteres.', 'error');
        return;
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
        Swal.fire('Error', 'El slug solo puede tener minúsculas, números y guiones (ej: mi-tienda).', 'error');
        return;
      }
      await api.post('/stores', values);
      setShowAddModal(false);
      fetchStores();
      Swal.fire('¡Éxito!', 'Tienda creada correctamente.', 'success');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      await api.patch(`/stores/${editingStore.id}`, values);
      setEditingStore(null);
      fetchStores();
      Swal.fire('Actualizado', 'La tienda ha sido modificada.', 'success');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDelete = async (store: StoreItem) => {
    const result = await Swal.fire({
      title: '¿Eliminar tienda?',
      html: `<p>Se eliminará <strong>${store.name}</strong> junto con todos sus productos, categorías y usuarios.</p><p style="color:red;font-weight:bold">Esta acción es irreversible.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/stores/${store.id}`);
        fetchStores();
        Swal.fire('Eliminada', `La tienda "${store.name}" fue eliminada.`, 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  if (loading) return <div className="loader-container">Analizando red de tiendas...</div>;

  return (
    <div className="admin-page">
      <Group justify="space-between" mb="3rem">
        <div>
          <Title order={1}>Gestión Maestra de Tiendas</Title>
          <Text color="dimmed">Administra todos los inquilinos de la plataforma y sus configuraciones SaaS.</Text>
        </div>
        <Group>
          <Button 
            variant="light" 
            color="indigo" 
            leftSection={<Settings size={18} />} 
            onClick={() => setShowSettingsCard(!showSettingsCard)} 
            size="md" 
            radius="md"
          >
            {showSettingsCard ? 'Ocultar Config. SaaS' : 'Configurar SaaS / MP'}
          </Button>
          <Button leftSection={<Plus size={18} />} onClick={() => setShowAddModal(true)} size="md" radius="md">
            Crear Nueva Tienda
          </Button>
        </Group>
      </Group>

      {/* Card de Configuración SaaS y Mercado Pago de la Plataforma */}
      {showSettingsCard && (
        <Card withBorder radius="xl" p="xl" shadow="md" mb="2.5rem" style={{ borderLeft: '5px solid var(--mantine-color-indigo-6)' }} className="bg-white">
          <Stack gap="md">
            <Group justify="space-between">
              <Box>
                <Text fw={800} size="lg" color="#1e1b4b">Configuración de Cobros SaaS (Mercado Pago de la Plataforma)</Text>
                <Text size="xs" color="dimmed">Introduce tus llaves de Mercado Pago para recibir de forma automatizada los pagos de suscripción de todos tus inquilinos de la plataforma.</Text>
              </Box>
              <ActionIcon variant="light" color="gray" radius="xl" onClick={() => setShowSettingsCard(false)}><X size={16} /></ActionIcon>
            </Group>
            
            <Divider />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Access Token de la Plataforma"
                placeholder="APP_USR-..."
                value={superadminMpAccessToken}
                onChange={(e) => setSuperadminMpAccessToken(e.target.value)}
                required
                type="password"
                size="md"
                radius="md"
              />
              <TextInput
                label="Public Key de la Plataforma"
                placeholder="APP_USR-..."
                value={superadminMpPublicKey}
                onChange={(e) => setSuperadminMpPublicKey(e.target.value)}
                required
                size="md"
                radius="md"
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Monto de Suscripción Mensual Base ($ ARS)"
                placeholder="10000"
                type="number"
                value={defaultSubscriptionPrice}
                onChange={(e) => setDefaultSubscriptionPrice(Number(e.target.value))}
                required
                size="md"
                radius="md"
              />
              <Box className="flex items-end">
                <Button 
                  fullWidth 
                  color="indigo" 
                  onClick={handleSaveSettings} 
                  loading={savingSettings}
                  size="md"
                  radius="md"
                  className="h-[42px]"
                >
                  Guardar Configuración SaaS
                </Button>
              </Box>
            </SimpleGrid>
          </Stack>
        </Card>
      )}

      {/* Resumen de estadísticas rápidas */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="blue.0" p="xs" className="rounded-lg">
              <Store size={24} color="#0ea5e9" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Total Tiendas</Text>
              <Text fw={700} size="xl">{stores.length}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
           <Group>
            <Box bg="green.0" p="xs" className="rounded-lg">
              <Database size={24} color="#10b981" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Productos en Red</Text>
              <Text fw={700} size="xl">{stores.reduce((acc, s) => acc + s._count.products, 0)}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="violet.0" p="xs" className="rounded-lg">
              <User size={24} color="#8b5cf6" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Usuarios Pro</Text>
              <Text fw={700} size="xl">{stores.length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Vista de Tabla (para Tablets y Computadoras) - Oculta en celulares */}
      <div className="hidden md:block">
        <Card withBorder radius="md" p={0} shadow="sm">
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead className="bg-slate-50">
              <Table.Tr>
                <Table.Th className="!pl-6">Tienda</Table.Th>
                <Table.Th>Dueño Responsable</Table.Th>
                <Table.Th>Rubro / SaaS</Table.Th>
                <Table.Th>Estadísticas</Table.Th>
                <Table.Th className="text-center">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {stores.map(store => (
                <Table.Tr key={store.id}>
                  <Table.Td className="!pl-6">
                    <Stack gap={0}>
                      <Text fw={700} size="sm">{store.name}</Text>
                      <Group gap={4} wrap="nowrap">
                        <Globe size={12} color="#94a3b8" />
                        <Text size="xs" color="dimmed">{store.slug}</Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>{store.users[0]?.name || 'N/A'}</Text>
                      <Text size="xs" color="dimmed">{store.users[0]?.email || 'N/A'}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Badge variant="light" color="gray" size="xs">{store.businessType}</Badge>
                      {store.hasCart && <Badge color="blue" size="xs" variant="outline">Carrito</Badge>}
                      {store.hasStockControl && <Badge color="orange" size="xs" variant="outline">Stock</Badge>}
                      {store.hasPayments && <Badge color="green" size="xs" variant="outline">Pagos</Badge>}
                      {store.isCatalogOnly && <Badge color="violet" size="xs" variant="outline">Sólo Catálogo</Badge>}
                      {store.hasConnectivity && <Badge color="cyan" size="xs" variant="outline">WiFi</Badge>}
                      {store.hasOrderManagement && <Badge color="pink" size="xs" variant="outline">Gastro Pro</Badge>}
                      {store.hasWhatsAppOrders && <Badge color="teal" size="xs" variant="outline">Pedidos WA</Badge>}
                      {store.hasPOS && <Badge color="indigo" size="xs" variant="outline">Punto Venta</Badge>}
                      {store.hasMercadoPago && <Badge color="blue" size="xs" variant="outline">MP Online</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Productos / Categorías">
                      <Group gap="xs">
                        <Badge variant="light" color="blue" leftSection={<Package size={10} />}>{store._count.products}</Badge>
                        <Badge variant="light" color="violet" leftSection={<LayoutGrid size={10} />}>{store._count.categories}</Badge>
                      </Group>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td className="text-center">
                    <Group justify="center" gap="sm">
                       <Tooltip label="Ver Catálogo Público">
                         <ActionIcon variant="light" color="teal" onClick={() => window.open(`/s/${store.slug}`, '_blank')}><Globe size={18} /></ActionIcon>
                       </Tooltip>
                       <Tooltip label="Ver Estadísticas Detalladas">
                         <ActionIcon variant="subtle" color="blue"><BarChart3 size={18} /></ActionIcon>
                       </Tooltip>
                       <Tooltip label="Configuración Maestra">
                         <ActionIcon variant="light" color="blue" onClick={() => setEditingStore(store)}><Edit3 size={18} /></ActionIcon>
                       </Tooltip>
                       <Tooltip label="Eliminar Tienda">
                         <ActionIcon variant="light" color="red" onClick={() => handleDelete(store)}><Trash2 size={18} /></ActionIcon>
                       </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </div>

      {/* Vista de Tarjetas (para Celulares) - Oculta en pantallas medianas y grandes */}
      <div className="block md:hidden space-y-4">
        {stores.map(store => (
          <Card key={store.id} withBorder radius="xl" p="md" className="bg-white shadow-sm border-slate-100">
            <Group justify="space-between" align="center" mb="xs">
              <Stack gap={2}>
                <Text fw={800} size="md" color="#1e293b">{store.name}</Text>
                <Group gap={4} wrap="nowrap">
                  <Globe size={12} color="#94a3b8" />
                  <Text size="xs" color="dimmed">{store.slug}</Text>
                </Group>
              </Stack>
              <Badge variant="light" color="gray" size="sm">{store.businessType}</Badge>
            </Group>

            <div className="mt-3 space-y-2 border-t border-slate-50 pt-2">
              <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                <Text size="xs" color="dimmed" fw={600}>Dueño:</Text>
                <Stack gap={0} align="flex-end">
                  <Text size="sm" fw={700} color="#0f172a">{store.users[0]?.name || 'N/A'}</Text>
                  <Text size="10px" color="dimmed">{store.users[0]?.email || 'N/A'}</Text>
                </Stack>
              </div>

              <div className="border-b border-slate-50 pb-2">
                <Text size="xs" color="dimmed" fw={600} mb={6}>Módulos Activos:</Text>
                <Group gap={4} wrap="wrap">
                  {store.hasCart && <Badge color="blue" size="xs" variant="outline">Carrito</Badge>}
                  {store.hasStockControl && <Badge color="orange" size="xs" variant="outline">Stock</Badge>}
                  {store.hasPayments && <Badge color="green" size="xs" variant="outline">Pagos</Badge>}
                  {store.isCatalogOnly && <Badge color="violet" size="xs" variant="outline">Sólo Catálogo</Badge>}
                  {store.hasConnectivity && <Badge color="cyan" size="xs" variant="outline">WiFi</Badge>}
                  {store.hasOrderManagement && <Badge color="pink" size="xs" variant="outline">Gastro Pro</Badge>}
                  {store.hasWhatsAppOrders && <Badge color="teal" size="xs" variant="outline">Pedidos WA</Badge>}
                  {store.hasPOS && <Badge color="indigo" size="xs" variant="outline">Punto Venta</Badge>}
                  {store.hasMercadoPago && <Badge color="blue" size="xs" variant="outline">MP Online</Badge>}
                </Group>
              </div>

              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <Text size="xs" color="dimmed" fw={600}>Contenido:</Text>
                <Group gap="xs">
                  <Badge variant="light" color="blue" size="xs" leftSection={<Package size={10} />}>{store._count.products} prod.</Badge>
                  <Badge variant="light" color="violet" size="xs" leftSection={<LayoutGrid size={10} />}>{store._count.categories} cat.</Badge>
                </Group>
              </div>

              <div className="flex justify-between items-center pt-2 gap-2">
                {/* Botón para ver catálogo público */}
                <Button 
                  variant="light" 
                  color="teal" 
                  size="xs" 
                  radius="md" 
                  leftSection={<Globe size={14} />}
                  onClick={() => window.open(`/s/${store.slug}`, '_blank')}
                  className="flex-1"
                >
                  Ver Catálogo
                </Button>
                
                <Group gap="xs" className="shrink-0">
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    onClick={() => setEditingStore(store)}
                    size="md"
                    radius="md"
                  >
                    <Edit3 size={14} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="light" 
                    color="red" 
                    onClick={() => handleDelete(store)}
                    size="md"
                    radius="md"
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <StoreFormModal 
        opened={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleCreate} 
        title="Configurar Nueva Tienda"
      />

      <StoreFormModal 
        opened={!!editingStore} 
        onClose={() => setEditingStore(null)} 
        onSubmit={handleUpdate} 
        store={editingStore}
        title="Editar Configuración Maestra"
      />
    </div>
  );
}

function StoreFormModal({ opened, onClose, onSubmit, store, title }: any) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [hasStockControl, setHasStockControl] = useState(false);
  const [hasPayments, setHasPayments] = useState(false);
  const [hasCart, setHasCart] = useState(false);
  const [isCatalogOnly, setIsCatalogOnly] = useState(false);
  const [hasModifiers, setHasModifiers] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [hasConnectivity, setHasConnectivity] = useState(false);
  const [hasOrderManagement, setHasOrderManagement] = useState(false);
  const [hasWhatsAppOrders, setHasWhatsAppOrders] = useState(false);
  const [hasPOS, setHasPOS] = useState(false);
  const [hasMercadoPago, setHasMercadoPago] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setSlug(store.slug || '');
      setOwnerName(store.users?.[0]?.name || '');
      setOwnerEmail(store.users?.[0]?.email || '');
      setBusinessType(store.businessType || 'retail');
      setHasStockControl(store.hasStockControl || false);
      setHasPayments(store.hasPayments || false);
      setHasCart(store.hasCart || false);
      setIsCatalogOnly(store.isCatalogOnly || false);
      setHasModifiers(store.hasModifiers || false);
      setShowObservations(store.showObservations || false);
      setHasConnectivity(store.hasConnectivity || false);
      setHasOrderManagement(store.hasOrderManagement || false);
      setHasWhatsAppOrders(store.hasWhatsAppOrders || false);
      setHasPOS(store.hasPOS || false);
      setHasMercadoPago(store.hasMercadoPago || false);
      setOwnerPassword('');
    } else {
      setName('');
      setSlug('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setBusinessType('retail');
      setHasStockControl(false);
      setHasPayments(false);
      setHasCart(false);
      setIsCatalogOnly(false);
      setHasModifiers(false);
      setShowObservations(false);
      setHasConnectivity(false);
      setHasOrderManagement(false);
      setHasWhatsAppOrders(false);
      setHasPOS(false);
      setHasMercadoPago(false);
    }
  }, [store, opened]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} radius="md" size="lg">
      <Stack gap="md">
        <SimpleGrid cols={2}>
          <TextInput label="Nombre de la Tienda" value={name} onChange={e => setName(e.target.value)} required />
          <TextInput label="Slug (URL)" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="ej: mi-tienda" />
        </SimpleGrid>

        <Stack gap={4} p="md" className="admin-muted-stack">
          <Text size="xs" fw={700} color="dimmed" tt="uppercase">Datos del Dueño</Text>
          <TextInput label="Nombre Completo" value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="Raúl Ivanes" />
          <TextInput label="Email de Acceso" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required />
          <PasswordInput 
            label={store ? "Cambiar Contraseña (opcional)" : "Contraseña Inicial"} 
            value={ownerPassword} 
            onChange={e => setOwnerPassword(e.target.value)} 
          />
        </Stack>

        <Select 
          label="Rubro del Negocio" 
          data={['retail', 'gastronomia', 'servicios', 'kiosco', 'panaderia']} 
          value={businessType} 
          onChange={(val) => setBusinessType(val || 'retail')} 
        />

        <Divider label="Módulos SaaS Principales" labelPosition="center" />
        
        <Stack gap="xs">
          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between">
              <Box>
                <Text size="sm" fw={700}>Carrito de Compras</Text>
                <Text size="xs" color="dimmed">Permite a los clientes seleccionar productos y gestionar un pedido.</Text>
              </Box>
              <Switch 
                checked={hasCart} 
                onChange={(e) => {
                  const val = e.currentTarget.checked;
                  setHasCart(val);
                  if (!val) {
                    setHasStockControl(false);
                    setHasPayments(false);
                  }
                  if (val) setIsCatalogOnly(false);
                }} 
              />
            </Group>
          </Paper>

          <Group grow>
            <Paper withBorder p="sm" radius="md" className={!hasCart ? 'opacity-50' : ''}>
              <Switch 
                label="Control de Stock" 
                disabled={!hasCart}
                checked={hasStockControl} 
                onChange={(e) => setHasStockControl(e.currentTarget.checked)} 
                description="Requiere Carrito activo"
              />
            </Paper>
            <Paper withBorder p="sm" radius="md" className={!hasCart ? 'opacity-50' : ''}>
              <Switch 
                label="Pasarela de Pagos" 
                disabled={!hasCart}
                checked={hasPayments} 
                onChange={(e) => setHasPayments(e.currentTarget.checked)} 
                description="Habilita Mercado Pago"
              />
            </Paper>
          </Group>
        </Stack>

        <Divider label="Operación y Experiencia" labelPosition="center" />

        <SimpleGrid cols={2}>
           <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Modo Catálogo Exclusivo" 
              checked={isCatalogOnly} 
              onChange={(e) => {
                const val = e.currentTarget.checked;
                setIsCatalogOnly(val);
                if (val) {
                  setHasCart(false);
                  setHasStockControl(false);
                  setHasPayments(false);
                }
              }} 
              description="Anula carrito y pagos"
            />
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Experiencia Gastronómica" 
              checked={hasModifiers} 
              onChange={(e) => setHasModifiers(e.currentTarget.checked)} 
              description="Habilita aderezos y extras"
            />
          </Paper>
        </SimpleGrid>

        <Paper withBorder p="sm" radius="md">
          <Switch 
            label="Permitir Observaciones Libres" 
            checked={showObservations} 
            onChange={(e) => setShowObservations(e.currentTarget.checked)} 
            description="Campo de texto para aclaraciones del cliente en el pedido"
          />
        </Paper>

        <Divider label="Módulos Pro Externos" labelPosition="center" />

        <SimpleGrid cols={2}>
           <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Módulo de Conectividad (WiFi)" 
              checked={hasConnectivity} 
              onChange={(e) => setHasConnectivity(e.currentTarget.checked)} 
              description="Activa portal de WiFi y QR"
            />
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Módulo Gastro Pro" 
              checked={hasOrderManagement} 
              onChange={(e) => setHasOrderManagement(e.currentTarget.checked)} 
              description="Mesas, Mozos y Cocina"
            />
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Pedidos por WhatsApp" 
              checked={hasWhatsAppOrders} 
              onChange={(e) => setHasWhatsAppOrders(e.currentTarget.checked)} 
              description="Habilita monitor de pedidos online"
            />
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Punto de Venta (POS)" 
              checked={hasPOS} 
              onChange={(e) => setHasPOS(e.currentTarget.checked)} 
              description="Terminal de cobro en mostrador"
            />
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Switch 
              label="Mercado Pago Online" 
              checked={hasMercadoPago} 
              onChange={(e) => setHasMercadoPago(e.currentTarget.checked)} 
              description="Cobros online automatizados"
            />
          </Paper>
        </SimpleGrid>

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
            const payload: any = { 
              name: name.trim(), slug: normalizedSlug, ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim(),
              businessType, hasStockControl, hasPayments, hasCart, 
              isCatalogOnly, hasModifiers, showObservations,
              hasConnectivity, hasOrderManagement, hasWhatsAppOrders,
              hasPOS, hasMercadoPago
            };
            if (store) {
              if (ownerPassword && ownerPassword.trim().length > 0) {
                if (ownerPassword.trim().length < 6) {
                  Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
                  return;
                }
                payload.ownerPassword = ownerPassword;
              }
            } else {
              payload.ownerPassword = ownerPassword;
            }
            onSubmit(payload);
          }}>
            {store ? 'Guardar Cambios SaaS' : 'Lanzar Tienda'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
