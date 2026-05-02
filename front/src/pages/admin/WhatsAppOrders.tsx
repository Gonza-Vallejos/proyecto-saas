import { useEffect, useState, useCallback } from 'react';
import { Title, Text, Card, Group, Stack, Badge, Button, SimpleGrid, Paper, Box, ScrollArea, ActionIcon, Tabs } from '@mantine/core';
import { Clock, CheckCircle2, PlayCircle, MessageSquare, RefreshCw, ShoppingBag, CreditCard } from 'lucide-react';
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
  paymentStatus: string;
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
      const data = await api.get('/orders');
      // Filtrar por origen y estados activos
      const filtered = data.filter((o: any) => 
        (o.origin === 'WHATSAPP' || o.origin === 'CATALOG') && 
        ['PENDING', 'PREPARING', 'READY'].includes(o.status)
      );
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
      case 'READY': return 'Listo';
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
          <Title order={3} size="h4">{order.customerName || 'Cliente Externo'}</Title>
          {order.customerPhone && (
            <Text size="xs" color="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
               {order.customerPhone}
            </Text>
          )}

          <Group gap="xs" mt="xs">
            {order.observations && (order.observations.includes('CON ENVÍO') || order.observations.includes('Envío a domicilio')) && (
              <Badge color="teal" variant="light" size="xs">🚚 Envío</Badge>
            )}
            {order.observations && (order.observations.includes('RETIRO EN LOCAL') || order.observations.includes('Retiro en el local')) && (
              <Badge color="violet" variant="light" size="xs">🏪 Retiro</Badge>
            )}
            {order.paymentStatus === 'PAID' ? (
              <Badge color="green" variant="filled" size="xs" leftSection={<CreditCard size={10} />}>PAGADO</Badge>
            ) : (
              <Badge color="orange" variant="outline" size="xs" leftSection={<Clock size={10} />}>PENDIENTE DE PAGO</Badge>
            )}
          </Group>
          {order.observations && (
            <Text size="xs" color="dimmed" mt="4px" fs="italic">
              Obs: {order.observations}
            </Text>
          )}
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
                if (order.paymentStatus === 'PAID') {
                  const confirmPaid = await Swal.fire({
                    title: '¡Atención: Pedido Pagado!',
                    text: 'Este pedido ya fue cobrado por Mercado Pago. Si lo rechazas, deberás realizar la devolución del dinero manualmente desde tu cuenta de MP. ¿Deseas continuar?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Sí, rechazar igual',
                    cancelButtonText: 'Cancelar'
                  });
                  if (!confirmPaid.isConfirmed) return;
                }

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
          {order.status === 'READY' && (
            <Button fullWidth variant="light" color="gray" onClick={() => handleUpdateStatus(order.id, 'PAID')}>
              Archivar Pedido
            </Button>
          )}
        </Stack>
      </Box>
    </Card>
  );

  const renderOrderGrid = (ordersList: Order[]) => {
    const pending = ordersList.filter(o => o.status === 'PENDING');
    const preparing = ordersList.filter(o => o.status === 'PREPARING');
    const ready = ordersList.filter(o => o.status === 'READY');

    if (ordersList.length === 0) {
      return (
        <Paper withBorder p="3rem" radius="md" ta="center" mt="xl">
          <Stack align="center" gap="md">
            <MessageSquare size={48} opacity={0.3} />
            <Text fw={700} size="xl">Sin pedidos en esta sección</Text>
            <Text color="dimmed">Cuando entren pedidos aparecerán organizados aquí.</Text>
          </Stack>
        </Paper>
      );
    }

    return (
      <Stack gap="2.5rem" mt="xl">
        {pending.length > 0 && (
          <Box>
            <Badge color="blue" size="lg" mb="lg">NUEVOS PEDIDOS ({pending.length})</Badge>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {pending.map(order => renderOrderCard(order))}
            </SimpleGrid>
          </Box>
        )}

        {preparing.length > 0 && (
          <Box>
            <Badge color="orange" size="lg" mb="lg">EN PREPARACIÓN ({preparing.length})</Badge>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {preparing.map(order => renderOrderCard(order))}
            </SimpleGrid>
          </Box>
        )}

        {ready.length > 0 && (
          <Box>
            <Badge color="green" size="lg" mb="lg">LISTOS / TERMINADOS ({ready.length})</Badge>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {ready.map(order => renderOrderCard(order))}
            </SimpleGrid>
          </Box>
        )}
      </Stack>
    );
  };

  if (loading) return <div className="loader-container">Cargando pedidos externos...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag size={28} color="#25D366" /> Monitor de Pedidos
          </Title>
          <Text color="dimmed" size="sm">Supervisa pedidos externos y gestiona estados de cocina.</Text>
        </div>
        <Button variant="light" leftSection={<RefreshCw size={18} className={isRefreshing ? 'rotating' : ''} />} onClick={() => fetchOrders()}>
          Refrescar
        </Button>
      </Group>

      <Tabs defaultValue="whatsapp" color="teal">
        <Tabs.List>
          <Tabs.Tab value="whatsapp" leftSection={<MessageSquare size={16} />}>
            Pedidos WhatsApp
          </Tabs.Tab>
          <Tabs.Tab value="mp" leftSection={<CreditCard size={16} />}>
            Pedidos Online (Mercado Pago)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="whatsapp">
          {renderOrderGrid(orders.filter(o => o.origin === 'WHATSAPP'))}
        </Tabs.Panel>

        <Tabs.Panel value="mp">
          {renderOrderGrid(orders.filter(o => o.origin === 'CATALOG'))}
        </Tabs.Panel>
      </Tabs>

      <style>{`
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .rotating { animation: rotate 1s linear infinite; }
      `}</style>
    </div>
  );
}
