import { useEffect, useState } from 'react';
import { Plus, Edit3, User, Globe, Store, BarChart3, Database, Package, LayoutGrid, Trash2 } from 'lucide-react';
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
  users: { email: string; name: string }[];
  _count: { products: number; categories: number; users: number };
}

export default function StoreManagement() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

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

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreate = async (values: any) => {
    try {
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
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="3rem">
        <div>
          <Title order={1}>Gestión Maestra de Tiendas</Title>
          <Text color="dimmed">Administra todos los inquilinos de la plataforma y sus configuraciones SaaS.</Text>
        </div>
        <Button leftSection={<Plus size={18} />} onClick={() => setShowAddModal(true)} size="md" radius="md">
          Crear Nueva Tienda
        </Button>
      </Group>

      {/* Resumen de estadísticas rápidas */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
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
            <Box bg="green.0" p="xs" style={{ borderRadius: '8px' }}>
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
            <Box bg="violet.0" p="xs" style={{ borderRadius: '8px' }}>
              <User size={24} color="#8b5cf6" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Usuarios Pro</Text>
              <Text fw={700} size="xl">{stores.length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Card withBorder radius="md" p={0} shadow="sm">
        <Table verticalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: '#f8fafc' }}>
            <Table.Tr>
              <Table.Th style={{ paddingLeft: '1.5rem' }}>Tienda</Table.Th>
              <Table.Th>Dueño Responsable</Table.Th>
              <Table.Th>Rubro / SaaS</Table.Th>
              <Table.Th>Estadísticas</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {stores.map(store => (
              <Table.Tr key={store.id}>
                <Table.Td style={{ paddingLeft: '1.5rem' }}>
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
                <Table.Td style={{ textAlign: 'center' }}>
                  <Group justify="center" gap="sm">
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
    }
  }, [store, opened]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} radius="md" size="lg">
      <Stack gap="md">
        <SimpleGrid cols={2}>
          <TextInput label="Nombre de la Tienda" value={name} onChange={e => setName(e.target.value)} required />
          <TextInput label="Slug (URL)" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="ej: mi-tienda" />
        </SimpleGrid>

        <Stack gap={4} p="md" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
            <Paper withBorder p="sm" radius="md" style={{ opacity: !hasCart ? 0.5 : 1 }}>
              <Switch 
                label="Control de Stock" 
                disabled={!hasCart}
                checked={hasStockControl} 
                onChange={(e) => setHasStockControl(e.currentTarget.checked)} 
                description="Requiere Carrito activo"
              />
            </Paper>
            <Paper withBorder p="sm" radius="md" style={{ opacity: !hasCart ? 0.5 : 1 }}>
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
        </SimpleGrid>

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            const payload: any = { 
              name, slug, ownerName, ownerEmail,
              businessType, hasStockControl, hasPayments, hasCart, 
              isCatalogOnly, hasModifiers, showObservations,
              hasConnectivity, hasOrderManagement
            };
            // Solo enviar la contraseña si tiene contenido
            if (ownerPassword && ownerPassword.trim().length > 0) {
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
