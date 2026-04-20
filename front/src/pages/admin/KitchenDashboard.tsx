import { useEffect, useState, useCallback } from 'react';
import { Title, Text, Card, Group, Stack, Badge, Button, SimpleGrid, Paper, Box, ScrollArea, Divider } from '@mantine/core';
import { ChefHat, Clock, CheckCircle2, PlayCircle, Utensils, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { socket } from '../../utils/socket';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  observations?: string;
  selectedModifiers?: string; // Almacenado como JSON
  product?: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  observations?: string;
  createdAt: string;
  table?: { number: string };
  waiter?: { name: string };
  items: OrderItem[];
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [storeId, setStoreId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsRefreshing(true);
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isAuto) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // Obtenemos el perfil para saber a qué storeId pertenece la cocina
    api.get('/auth/profile')
       .then((user: any) => {
         if (user?.storeId) setStoreId(user.storeId);
       })
       .catch(console.error);

    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (storeId) {
      socket.connect();
      socket.emit('joinStore', storeId);

      const handleUpdate = () => {
        fetchOrders(true);
      };

      socket.on('ordersUpdated', handleUpdate);

      return () => {
        socket.off('ordersUpdated', handleUpdate);
        socket.disconnect();
      };
    }
  }, [storeId, fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(true); // Refresco silencioso
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'PREPARING': return 'En Cocina';
      case 'READY': return 'Listo';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'red';
      case 'PREPARING': return 'orange';
      case 'READY': return 'green';
      default: return 'gray';
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} withBorder radius="md" shadow="sm" p={0} style={{ 
      borderTop: `4px solid var(--mantine-color-${getStatusColor(order.status)}-6)`,
      overflow: 'visible'
    }}>
      {/* Header de la Card */}
      <Box p="md" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Group justify="space-between" mb="xs">
          <Badge color={getStatusColor(order.status)} variant="filled">
            {getStatusLabel(order.status)}
          </Badge>
          <Group gap={5}>
            <Clock size={14} color="#94a3b8" />
            <Text size="xs" color="dimmed">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </Group>
        </Group>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Utensils size={18} color="#0ea5e9" />
            <Title order={3} size="h4">{order.table?.number || 'Sin Mesa'}</Title>
          </Group>
          {order.waiter?.name && (
            <Badge variant="outline" color="gray" size="sm">
              Mozo: {order.waiter.name}
            </Badge>
          )}
        </Group>
      </Box>

      {/* Contenido (Items) */}
      <ScrollArea h={250} p="md">
        <Stack gap="md">
          {order.items.map((item, idx) => {
            const modifiers = item.selectedModifiers ? JSON.parse(item.selectedModifiers) : [];
            return (
              <Box key={item.id}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text fw={800} size="md" style={{ flex: 1 }}>{item.quantity}x {item.product?.name || `Producto #${idx + 1}`}</Text>
                </Group>
                {modifiers.length > 0 && (
                  <Stack gap={2} mt="4px" pl="md">
                    {modifiers.map((mod: any, mIdx: number) => (
                      <Text key={mIdx} size="xs" color="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        • {mod.options.map((o: any) => o.name).join(', ')}
                      </Text>
                    ))}
                  </Stack>
                )}
                {item.observations && (
                  <Paper withBorder p="xs" mt="xs" bg="red.0" style={{ borderColor: 'var(--mantine-color-red-2)' }}>
                    <Text size="xs" color="red.9" fw={800} style={{ textTransform: 'uppercase' }}>
                      ⚠️ Nota: {item.observations}
                    </Text>
                  </Paper>
                )}
                {idx < order.items.length - 1 && <Divider mt="sm" variant="dotted" />}
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Footer de la Card (Acciones) */}
      <Box p="md" bg="gray.0" style={{ borderTop: '1px solid #f1f5f9' }}>
        {order.status === 'PENDING' && (
          <Button 
            fullWidth 
            color="orange" 
            leftSection={<PlayCircle size={18} />}
            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
          >
            Empezar Preparación
          </Button>
        )}
        {order.status === 'PREPARING' && (
          <Button 
            fullWidth 
            color="green" 
            leftSection={<CheckCircle2 size={18} />}
            onClick={() => handleUpdateStatus(order.id, 'READY')}
          >
            Marcar como LISTO
          </Button>
        )}
        {order.status === 'READY' && (
          <Stack gap="xs">
            <Text size="xs" color="green" fw={700} ta="center">¡PEDIDO LISTO!</Text>
            <Button 
              fullWidth 
              variant="outline" 
              color="gray"
              onClick={() => handleUpdateStatus(order.id, 'PENDING')}
            >
              Regresar a Pendiente
            </Button>
          </Stack>
        )}
      </Box>
    </Card>
  );

  if (loading) return <div className="loader-container">Calentando motores...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ChefHat size={28} color="#ef4444" /> Monitor de Cocina
          </Title>
          <Text color="dimmed" size="sm">Gestión de pedidos en tiempo real.</Text>
        </div>
        <Button 
          variant="light" 
          leftSection={<RefreshCw size={18} className={isRefreshing ? 'rotating' : ''} />} 
          onClick={() => fetchOrders()}
        >
          Refrescar Ahora
        </Button>
      </Group>

      {orders.length === 0 ? (
        <Paper withBorder p="3rem" radius="md" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Box opacity={0.3}><ChefHat size={64} /></Box>
            <Text fw={700} size="xl">No hay pedidos pendientes</Text>
            <Text color="dimmed">En cuanto los mozos carguen algo, aparecerá aquí.</Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="3rem">
          {/* SECCIÓN: PENDIENTES */}
          {orders.filter(o => o.status === 'PENDING').length > 0 && (
            <Box>
              <Group mb="lg" gap="xs">
                <Badge color="red" size="lg" variant="dot" p="md">PENDIENTES</Badge>
                <Divider style={{ flex: 1 }} />
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {orders.filter(o => o.status === 'PENDING').map(order => renderOrderCard(order))}
              </SimpleGrid>
            </Box>
          )}

          {/* SECCIÓN: EN PREPARACIÓN */}
          {orders.filter(o => o.status === 'PREPARING').length > 0 && (
            <Box>
              <Group mb="lg" gap="xs">
                <Badge color="orange" size="lg" variant="dot" p="md">EN COCINA / PREPARANDO</Badge>
                <Divider style={{ flex: 1 }} />
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {orders.filter(o => o.status === 'PREPARING').map(order => renderOrderCard(order))}
              </SimpleGrid>
            </Box>
          )}

          {/* SECCIÓN: LISTOS */}
          {orders.filter(o => o.status === 'READY').length > 0 && (
            <Box>
              <Group mb="lg" gap="xs">
                <Badge color="green" size="lg" variant="dot" p="md">LISTOS PARA SERVIR</Badge>
                <Divider style={{ flex: 1 }} />
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {orders.filter(o => o.status === 'READY').map(order => renderOrderCard(order))}
              </SimpleGrid>
            </Box>
          )}
        </Stack>
      )}

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
