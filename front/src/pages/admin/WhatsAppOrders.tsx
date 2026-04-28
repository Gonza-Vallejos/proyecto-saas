import { useEffect, useState, useCallback } from 'react';
import { Title, Text, Card, Group, Stack, Badge, Button, SimpleGrid, Paper, Box, ScrollArea, ActionIcon } from '@mantine/core';
import { Clock, CheckCircle2, PlayCircle, MessageSquare, RefreshCw, ShoppingBag } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { socket } from '../../utils/socket';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  observations?: string;
  selectedModifiers?: string;
  product?: {
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  observations?: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  origin?: string;
  items: OrderItem[];
}

export default function WhatsAppOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsRefreshing(true);
    try {
      // Obtener todos y filtrar en frontend por origen WHATSAPP y CATALOG
      const data = await api.get('/orders');
      const filtered = data.filter((o: any) => o.origin === 'WHATSAPP' || o.origin === 'CATALOG');
      setOrders(filtered);
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
      fetchOrders(true);
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Nuevo';
      case 'PREPARING': return 'En Proceso';
      case 'READY': return 'Listo / Enviado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'blue';
      case 'PREPARING': return 'orange';
      case 'READY': return 'green';
      default: return 'gray';
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} withBorder radius="md" shadow="sm" p={0} style={{ 
      borderTop: `4px solid var(--mantine-color-${getStatusColor(order.status)}-6)`,
    }}>
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
        
        <Stack gap={2}>
          <Title order={3} size="h4">{order.customerName || 'Cliente WhatsApp'}</Title>
          {order.customerPhone && (
            <Text size="xs" color="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
               {order.customerPhone}
            </Text>
          )}

          <Group gap="xs" mt="xs">
            {order.observations && order.observations.includes('CON ENVÍO') && (
              <Badge color="teal" variant="light" size="xs">🚚 Envío</Badge>
            )}
            {order.observations && order.observations.includes('RETIRO EN LOCAL') && (
              <Badge color="violet" variant="light" size="xs">🏪 Retiro</Badge>
            )}
            {order.origin === 'CATALOG' && (
              <Badge color="pink" variant="light" size="xs">💳 Pago Online</Badge>
            )}
          </Group>
        </Stack>
      </Box>

      <ScrollArea style={{ maxHeight: '220px' }} p="md">
        <Stack gap="md">
          {order.items.map((item, idx) => {
            const modifiers = item.selectedModifiers ? JSON.parse(item.selectedModifiers) : [];
            return (
              <Box key={item.id}>
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Group gap="sm" style={{ flex: 1 }}>
                    <Box style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      backgroundColor: '#f1f5f9',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.product?.imageUrl ? (
                        <img 
                          src={item.product.imageUrl} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ShoppingBag size={16} color="#94a3b8" />
                      )}
                    </Box>
                    <Text fw={700} size="sm" lineClamp={2}>{item.quantity}x {item.product?.name || `Producto #${idx + 1}`}</Text>
                  </Group>
                </Group>
                {modifiers.length > 0 && (
                  <Stack gap={2} mt="4px" pl="52px">
                    {modifiers.map((mod: any, mIdx: number) => (
                      <Text key={mIdx} size="xs" color="dimmed">
                        • {mod.options.map((o: any) => o.name).join(', ')}
                      </Text>
                    ))}
                  </Stack>
                )}
                {item.observations && (
                  <Paper withBorder p="xs" mt="xs" ml="52px" bg="gray.0">
                    <Text size="xs" color="dimmed" fs="italic">
                      "{item.observations}"
                    </Text>
                  </Paper>
                )}
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>

      <Box p="md" bg="gray.0" style={{ borderTop: '1px solid #f1f5f9' }}>
        <Group justify="space-between" mb="md">
          <Text fw={800} size="lg">$ {order.total.toLocaleString()}</Text>
          {order.customerPhone && (
            <ActionIcon 
              component="a"
              href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
              target="_blank"
              variant="light" 
              color="green" 
              radius="xl"
            >
              <MessageSquare size={18} />
            </ActionIcon>
          )}
        </Group>

        <Stack gap="xs">
          {order.status === 'PENDING' && (
            <Group grow gap="xs">
              <Button color="blue" leftSection={<PlayCircle size={18} />} onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>
                Aceptar
              </Button>
              <Button variant="light" color="red" onClick={async () => {
                const result = await Swal.fire({
                  title: '¿Rechazar pedido?',
                  text: 'El pedido se cancelará y el stock será devuelto automáticamente.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  confirmButtonText: 'Sí, rechazar',
                  cancelButtonText: 'No, volver'
                });
                if (result.isConfirmed) {
                  handleUpdateStatus(order.id, 'CANCELLED');
                }
              }}>
                Rechazar
              </Button>
            </Group>
          )}
          {order.status === 'PREPARING' && (
            <Button fullWidth color="green" leftSection={<CheckCircle2 size={18} />} onClick={() => handleUpdateStatus(order.id, 'READY')}>
              Marcar como LISTO
            </Button>
          )}
        </Stack>
      </Box>
    </Card>
  );

  if (loading) return <div className="loader-container">Cargando pedidos externos...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag size={28} color="#25D366" /> Pedidos WhatsApp
          </Title>
          <Text color="dimmed" size="sm">Pedidos recibidos desde el catálogo online.</Text>
        </div>
        <Button variant="light" leftSection={<RefreshCw size={18} className={isRefreshing ? 'rotating' : ''} />} onClick={() => fetchOrders()}>
          Refrescar
        </Button>
      </Group>

      {orders.length === 0 ? (
        <Paper withBorder p="3rem" radius="md" ta="center">
          <Stack align="center" gap="md">
            <MessageSquare size={48} opacity={0.3} />
            <Text fw={700} size="xl">Sin pedidos online</Text>
            <Text color="dimmed">Cuando los clientes pidan por el catálogo, aparecerán aquí.</Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="3rem">
          {orders.filter(o => o.status === 'PENDING').length > 0 && (
            <Box>
              <Badge color="blue" size="lg" mb="xl">NUEVOS PEDIDOS</Badge>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {orders.filter(o => o.status === 'PENDING').map(order => renderOrderCard(order))}
              </SimpleGrid>
            </Box>
          )}

          {orders.filter(o => o.status === 'PREPARING').length > 0 && (
            <Box>
              <Badge color="orange" size="lg" mb="xl">EN PREPARACIÓN</Badge>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {orders.filter(o => o.status === 'PREPARING').map(order => renderOrderCard(order))}
              </SimpleGrid>
            </Box>
          )}
        </Stack>
      )}

      <style>{`
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .rotating { animation: rotate 1s linear infinite; }
      `}</style>
    </div>
  );
}
