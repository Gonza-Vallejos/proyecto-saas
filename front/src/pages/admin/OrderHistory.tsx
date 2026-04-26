import { useEffect, useState, useCallback } from 'react';
import { 
  Title, Text, Card, Group, Stack, Badge, 
  SimpleGrid, Paper, Table, ActionIcon, 
  TextInput, Select, ScrollArea, Tooltip,
  Tabs, Modal, Divider
} from '@mantine/core';
import { 
  History, Calendar, Eye, 
  ShoppingBag, Utensils, MonitorSmartphone
} from 'lucide-react';
import { api } from '../../utils/api';
import { useOutletContext } from 'react-router-dom';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  product?: { name: string };
}

interface Order {
  id: string;
  status: string;
  origin: string;
  total: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  table?: { number: string };
  waiter?: { name: string };
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState<string | null>('orders');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 7 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const currentStatus = activeTab === 'sales' ? 'PAID' : statusFilter;
      let url = `/orders?status=${currentStatus}`;
      if (originFilter !== 'all') url += `&origin=${originFilter}`;
      if (startDate) url += `&startDate=${startDate}T00:00:00Z`;
      if (endDate) url += `&endDate=${endDate}T23:59:59Z`;

      const data = await api.get(url);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, originFilter, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge color="blue" variant="light">Pendiente</Badge>;
      case 'PREPARING': return <Badge color="orange" variant="light">En Cocina</Badge>;
      case 'READY': return <Badge color="green" variant="light">Listo</Badge>;
      case 'PAID': return <Badge color="teal" variant="filled">Pagado</Badge>;
      case 'CANCELLED': return <Badge color="red" variant="filled">Cancelado</Badge>;
      default: return <Badge color="gray">{status}</Badge>;
    }
  };

  const getOriginIcon = (origin: string) => {
    if (origin === 'WHATSAPP') return <Tooltip label="WhatsApp"><ShoppingBag size={14} color="#25D366" /></Tooltip>;
    if (origin === 'POS') return <Tooltip label="Punto de Venta"><MonitorSmartphone size={14} color="#3b82f6" /></Tooltip>;
    return <Tooltip label="Mesa"><Utensils size={14} color="#0ea5e9" /></Tooltip>;
  };

  // Stats
  const stats = {
    total: orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + o.total, 0),
    count: orders.length,
    paid: orders.filter(o => o.status === 'PAID').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={28} color="#6366f1" /> {activeTab === 'sales' ? 'Reporte de Ventas' : 'Historial de Pedidos'}
          </Title>
          <Text color="dimmed" size="sm">
            {activeTab === 'sales' 
              ? 'Consulta las ventas concretadas (pagadas) por WhatsApp y Punto de Venta.' 
              : 'Consulta el registro histórico de todas tus ventas.'}
          </Text>
        </div>
      </Group>

      <Tabs value={activeTab} onChange={(val) => { setActiveTab(val); setStatusFilter('all'); }} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="orders" leftSection={<History size={16} />}>
            Historial General
          </Tabs.Tab>
          <Tabs.Tab value="sales" leftSection={<ShoppingBag size={16} />}>
            Reporte de Ventas (Pagados)
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Filters */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="gray.0">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <TextInput 
            label="Desde" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            leftSection={<Calendar size={16} />}
          />
          <TextInput 
            label="Hasta" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            leftSection={<Calendar size={16} />}
          />
          {activeTab !== 'sales' ? (
            <Select 
              label="Estado"
              data={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'PENDING', label: 'Pendientes' },
                { value: 'READY', label: 'Listos' },
                { value: 'PAID', label: 'Pagados' },
                { value: 'CANCELLED', label: 'Cancelados' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || 'all')}
            />
          ) : (
            <TextInput 
              label="Estado"
              value="Pagado"
              disabled
            />
          )}
          <Select 
            label="Origen"
            data={[
              { value: 'all', label: 'Todos los canales' },
              { value: 'WHATSAPP', label: 'Ventas WhatsApp' },
              { value: 'POS', label: 'Punto de Venta (POS)' },
              { value: 'TABLE', label: 'Ventas de Salón' },
            ]}
            value={originFilter}
            onChange={(val) => setOriginFilter(val || 'all')}
          />
        </SimpleGrid>
      </Paper>

      {/* Stats Summary */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Paper withBorder p="sm" radius="md">
          <Text size="xs" color="dimmed" fw={700} tt="uppercase">Facturación Total</Text>
          <Text fw={700} size="xl" color="blue.7">$ {stats.total.toLocaleString()}</Text>
        </Paper>
        <Paper withBorder p="sm" radius="md">
          <Text size="xs" color="dimmed" fw={700} tt="uppercase">Total Pedidos</Text>
          <Text fw={700} size="xl">{stats.count}</Text>
        </Paper>
        <Paper withBorder p="sm" radius="md">
          <Text size="xs" color="dimmed" fw={700} tt="uppercase">Pagados</Text>
          <Text fw={700} size="xl" color="teal.7">{stats.paid}</Text>
        </Paper>
        <Paper withBorder p="sm" radius="md">
          <Text size="xs" color="dimmed" fw={700} tt="uppercase">Cancelados</Text>
          <Text fw={700} size="xl" color="red.7">{stats.cancelled}</Text>
        </Paper>
      </SimpleGrid>

      <Card withBorder radius="md" p={0}>
        <ScrollArea>
           <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: '1.5rem' }}>Fecha</Table.Th>
                <Table.Th>Canal</Table.Th>
                <Table.Th>Cliente / Mesa</Table.Th>
                <Table.Th>Productos</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th ta="center">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                   <Table.Td colSpan={7} ta="center" py="xl">Obteniendo registros...</Table.Td>
                </Table.Tr>
              ) : orders.length === 0 ? (
                <Table.Tr>
                   <Table.Td colSpan={7} ta="center" py="xl">No se encontraron pedidos en este periodo.</Table.Td>
                </Table.Tr>
              ) : orders.map(order => (
                <Table.Tr key={order.id}>
                  <Table.Td style={{ paddingLeft: '1.5rem' }}>
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>{getOriginIcon(order.origin)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {order.origin === 'TABLE' ? `Mesa ${order.table?.number}` : order.customerName || 'Cliente WA'}
                    </Text>
                    {order.waiter && <Text size="xs" color="dimmed">Mozo: {order.waiter.name}</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={order.items.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}>
                      <Text size="sm">{order.items.length} ítem(s)</Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={700} size="sm">$ {order.total.toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(order.status)}</Table.Td>
                  <Table.Td ta="center">
                     <ActionIcon 
                       variant="light" 
                       color="blue" 
                       onClick={() => {
                         setSelectedOrder(order);
                         setOrderModalOpen(true);
                       }}
                     >
                       <Eye size={16} />
                     </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Modal de Detalle de Venta */}
      <Modal
        opened={orderModalOpen}
        onClose={() => {
          setOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Detalle de Venta #${selectedOrder?.id.slice(-6)}`}
        centered
        radius="md"
        size="md"
      >
        {selectedOrder && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={700}>Fecha:</Text>
              <Text size="sm">{new Date(selectedOrder.createdAt).toLocaleDateString('es-AR')} {new Date(selectedOrder.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" fw={700}>Canal / Origen:</Text>
              <Badge color="blue" variant="light">{selectedOrder.origin}</Badge>
            </Group>

            <Group justify="space-between">
              <Text size="sm" fw={700}>Cliente:</Text>
              <Text size="sm">{selectedOrder.customerName || 'Cliente Mostrador'}</Text>
            </Group>

            {selectedOrder.customerPhone && (
              <Group justify="space-between">
                <Text size="sm" fw={700}>Teléfono:</Text>
                <Text size="sm">{selectedOrder.customerPhone}</Text>
              </Group>
            )}

            <Divider label="Productos" labelPosition="center" my="xs" />

            {selectedOrder.items.map((item) => (
              <Group key={item.id} justify="space-between">
                <Text size="sm" fw={500}>{item.quantity}x {item.product?.name || 'Producto Eliminado'}</Text>
                <Text size="sm" fw={700}>$ {(item.priceAtTime * item.quantity).toLocaleString()}</Text>
              </Group>
            ))}

            <Divider my="xs" />

            <Group justify="space-between">
              <Text size="md" fw={900}>Total:</Text>
              <Text size="lg" fw={900} color="teal.8">$ {selectedOrder.total.toLocaleString()}</Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
