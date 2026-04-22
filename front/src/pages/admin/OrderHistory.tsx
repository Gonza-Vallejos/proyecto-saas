import { useEffect, useState, useCallback } from 'react';
import { 
  Title, Text, Card, Group, Stack, Badge, Button, 
  SimpleGrid, Paper, Box, Table, ActionIcon, 
  TextInput, Select, Divider, ScrollArea, Tooltip
} from '@mantine/core';
import { 
  History, Calendar, Filter, Search, Eye, 
  Download, ShoppingBag, Utensils, CheckCircle2, 
  XCircle, Clock
} from 'lucide-react';
import { api } from '../../utils/api';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 7 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/orders?status=${statusFilter}`;
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
  }, [fetchHistory]);

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
    return <Tooltip label="Mesa"><Utensils size={14} color="#0ea5e9" /></Tooltip>;
  };

  // Stats
  const stats = {
    total: orders.reduce((acc, o) => acc + o.total, 0),
    count: orders.length,
    paid: orders.filter(o => o.status === 'PAID').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={28} color="#6366f1" /> Historial de Pedidos
          </Title>
          <Text color="dimmed" size="sm">Consulta el registro histórico de todas tus ventas.</Text>
        </div>
      </Group>

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
          <Select 
            label="Origen"
            data={[
              { value: 'all', label: 'Todos los canales' },
              { value: 'WHATSAPP', label: 'Ventas WhatsApp' },
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
                     <ActionIcon variant="light" color="blue">
                       <Eye size={16} />
                     </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
