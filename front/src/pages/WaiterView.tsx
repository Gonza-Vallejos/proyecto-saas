import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Title, Text, Card, Group, Stack, Button, SimpleGrid, Badge, Box, ActionIcon, Modal, NumberInput, Divider, ScrollArea, Paper, Center, Loader, TextInput, SegmentedControl } from '@mantine/core';
import { ShoppingCart, Utensils, Trash2, ArrowLeft, Send, CheckCircle2, User, LogOut, Package, Plus, MessageSquare, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import Swal from 'sweetalert2';
import { socket } from '../utils/socket';

interface Table {
  id: string;
  number: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface CartItem {
  productId: string;
  name: string;
  priceAtTime: number;
  quantity: number;
  observations?: string;
}

interface Order {
  id: string;
  status: string;
  table?: { number: string };
  createdAt: string;
  items: any[];
}

export default function WaiterView() {
  const [step, setStep] = useState<'table' | 'catalog'>('table');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Nuevos estados para seguimiento
  const [activeTab, setActiveTab] = useState<'new' | 'orders'>('new');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [prevReadyOrderIds, setPrevReadyOrderIds] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const u = await api.get('/auth/profile');
      setUser(u);
      fetchInitialData();
    } catch (e) {
      navigate('/login');
    }
  };

  const fetchInitialData = async () => {
    try {
      const [tablesData, storeData] = await Promise.all([
        api.get('/tables'),
        api.get('/stores/my-store')
      ]);
      
      if (!storeData) {
        throw new Error('No tienes una tienda asignada. Contacta al administrador.');
      }

      setStore(storeData);
      setTables(tablesData.filter((t: any) => t.isActive));
      
      // Enriquecer productos desde el catálogo público de la tienda
      const catalog = await api.get(`/stores/public/${storeData.slug}/catalog`);
      setProducts(catalog.products || []);
    } catch (e: any) {
      console.error('Error al cargar datos iniciales:', e);
      Swal.fire({
        title: 'Error de Configuración',
        text: e.message || 'No se pudo cargar la información de la tienda.',
        icon: 'error',
        confirmButtonText: 'Reintentar'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setStep('catalog');
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        priceAtTime: product.price, 
        quantity: 1,
        observations: '' 
      }];
    });
  };

  const updateItemNote = (productId: string, note: string) => {
    setCart(prev => prev.map(item => 
      item.productId === productId ? { ...item, observations: note } : item
    ));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId === id) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.productId !== id));
  };

  const handleSendOrder = async () => {
    if (cart.length === 0 || !selectedTable) return;
    try {
      await api.post('/orders', {
        tableId: selectedTable.id,
        items: cart,
        observations: '' 
      });
      Swal.fire({
        title: '¡Pedido Enviado!',
        text: 'La comanda ya está en proceso en la cocina.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setCart([]);
      setShowCart(false);
      setStep('table');
      setSelectedTable(null);
    } catch (e: any) {
      console.error('Error al enviar pedido:', e);
      Swal.fire('Error al enviar', e.message || 'No se pudo conectar con la cocina', 'error');
    }
  };

  // Agrupar productos por categoría
  const groupedProducts = products.reduce((acc: any, product: any) => {
    const catName = product.category?.name || 'Varios';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {});

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchMyOrders = useCallback(async (silent = false) => {
    try {
      const data = await api.get('/orders');
      // Filtramos por el mozo actual si tenemos sus datos (simplificado: mostramos activos de la tienda)
      setMyOrders(data);
      
      // Lógica de notificaciones
      const readyOrders = data.filter((o: any) => o.status === 'READY');
      readyOrders.forEach((order: any) => {
        if (!prevReadyOrderIds.has(order.id)) {
          Swal.fire({
            title: `¡Pedido Listo! 🍽️`,
            text: `El pedido para la Mesa ${order.table?.number || '?' } ya está listo para ser retirado.`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true
          });
          // Opcional: Reproducir sonido de notificación
          try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e) {}
        }
      });
      setPrevReadyOrderIds(new Set(readyOrders.map((o: any) => o.id)));
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }, [prevReadyOrderIds]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab, fetchMyOrders]);

  useEffect(() => {
    if (store?.id) {
      socket.connect();
      socket.emit('joinStore', store.id);

      const handleUpdate = () => {
        fetchMyOrders(true);
      };

      socket.on('ordersUpdated', handleUpdate);

      return () => {
        socket.off('ordersUpdated', handleUpdate);
        socket.disconnect();
      };
    }
  }, [store?.id, fetchMyOrders]);

  if (loading) return (
    <Center h="100vh" style={{ backgroundColor: '#f8fafc', flexDirection: 'column', gap: '1rem' }}>
      <Loader color="blue" size="xl" type="dots" />
      <Text fw={600} color="blue">Preparando salón...</Text>
    </Center>
  );

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: cart.length > 0 ? '120px' : '40px' }}>
      {/* Header Premium */}
      <Box bg="white" p="md" style={{ borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="md">
              {step === 'catalog' && activeTab === 'new' && (
                <ActionIcon variant="light" onClick={() => setStep('table')} color="gray" radius="xl" size="lg">
                  <ArrowLeft size={20} />
                </ActionIcon>
              )}
              <Box>
                <Text fw={900} size="xl" color="blue" style={{ letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  {store?.name || 'Cargando...'}
                </Text>
                <Group gap={6} mt={2}>
                  <Badge size="xs" color="blue" variant="light" leftSection={<User size={10} />}>
                    {user?.name || 'Mozo'}
                  </Badge>
                  {step === 'catalog' && selectedTable && activeTab === 'new' && (
                    <Badge size="xs" color="green" variant="filled">
                      {selectedTable.number}
                    </Badge>
                  )}
                </Group>
              </Box>
            </Group>
            <ActionIcon variant="light" color="red" onClick={handleLogout} radius="md" size="lg">
              <LogOut size={20} />
            </ActionIcon>
          </Group>

          {/* Selector de Pestañas Principal */}
          <SegmentedControl 
            fullWidth 
            radius="xl"
            size="md"
            value={activeTab}
            onChange={(val: any) => setActiveTab(val)}
            data={[
              { label: 'Tomar Pedido', value: 'new' },
              { label: 'Seguimiento', value: 'orders' }
            ]}
            color="blue"
          />
        </Stack>
      </Box>

      <div style={{ padding: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        {activeTab === 'new' ? (
          step === 'table' ? (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            <Group justify="space-between" mb="lg">
              <Box>
                <Title order={3} style={{ fontSize: '1.5rem', fontWeight: 800 }}>Mesas del Salón</Title>
                <Text size="sm" color="dimmed">Selecciona una mesa para iniciar el pedido</Text>
              </Box>
              <Utensils size={32} color="#cbd5e1" />
            </Group>

            {tables.length === 0 ? (
              <Paper withBorder p="xl" radius="lg" style={{ textAlign: 'center', background: 'transparent', borderStyle: 'dashed' }}>
                <Stack align="center" gap="xs">
                  <Package size={48} color="#94a3b8" />
                  <Text fw={700}>No hay mesas configuradas</Text>
                  <Text size="sm" color="dimmed">Pide al administrador que cargue las mesas de la tienda.</Text>
                </Stack>
              </Paper>
            ) : (
              <SimpleGrid cols={2} spacing="lg">
                {tables.map(table => (
                  <Card 
                    key={table.id} 
                    withBorder 
                    radius="xl" 
                    p="xl" 
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleSelectTable(table)}
                    shadow="sm"
                    className="waiter-card"
                  >
                    <Stack align="center" gap="xs">
                      <Box style={{ background: '#eff6ff', borderRadius: '50%', padding: '12px' }}>
                        <Utensils size={28} color="#3b82f6" />
                      </Box>
                      <Text fw={800} size="xl" style={{ marginTop: '5px' }}>{table.number}</Text>
                      <Badge color="gray" variant="dot" size="xs">Disponible</Badge>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </div>
        ) : (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            <Group justify="space-between" mb="lg" align="flex-end">
              <Box>
                <Title order={3} style={{ fontWeight: 800 }}>Tomar Pedido</Title>
                <Text size="sm" color="dimmed">Agregando productos a la {selectedTable?.number}</Text>
              </Box>
              <Badge color="blue" size="lg" radius="sm" variant="outline">
                Menú de la Casa
              </Badge>
            </Group>
            
            <Stack gap="xl">
              {products.length === 0 ? (
                <Text ta="center" color="dimmed" mt="xl">No hay productos disponibles en el catálogo.</Text>
              ) : (
                Object.entries(groupedProducts).map(([catName, items]: [string, any]) => (
                  <Box key={catName}>
                    <Divider 
                      label={catName} 
                      labelPosition="left" 
                      mb="md" 
                      styles={{ label: { fontWeight: 900, fontSize: '1.1rem', color: 'black' } }} 
                    />
                    <Stack gap="md">
                      {items.map((product: any) => (
                        <Card key={product.id} withBorder radius="lg" p="md" shadow="xs" className="product-item-waiter">
                          <Group justify="space-between" wrap="nowrap">
                            <Box style={{ flex: 1 }}>
                              <Text fw={800} size="md" mb={2}>{product.name}</Text>
                              <Text fw={900} size="lg" color="blue" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.8em', opacity: 0.7 }}>$</span>
                                {product.price}
                              </Text>
                            </Box>
                            <Button 
                              size="sm" 
                              radius="xl" 
                              color="blue"
                              onClick={() => addToCart(product)}
                              leftSection={<Plus size={16} />}
                              style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                            >
                              Sumar
                            </Button>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                ))
              )}
            </Stack>
          </div>
        )) : (
          /* VISTA: MIS PEDIDOS / SEGUIMIENTO */
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            <Group justify="space-between" mb="lg">
              <Box>
                <Title order={3} style={{ fontWeight: 800 }}>Pedidos en Curso</Title>
                <Text size="sm" color="dimmed">Seguimiento en tiempo real de tus comandas</Text>
              </Box>
              <ActionIcon variant="light" color="blue" onClick={() => fetchMyOrders()} size="lg" radius="md">
                <RefreshCw size={20} className={loading ? 'rotating' : ''} />
              </ActionIcon>
            </Group>

            {myOrders.length === 0 ? (
              <Paper withBorder p="3rem" radius="md" ta="center" bg="gray.0">
                <Utensils size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <Text fw={600} color="dimmed">No tienes pedidos activos en este momento.</Text>
              </Paper>
            ) : (
              <Stack gap="xl">
                {[
                  { status: 'READY', label: '🍽️ Listos para Servir', color: 'green' },
                  { status: 'PREPARING', label: '🔥 En Cocina', color: 'orange' },
                  { status: 'PENDING', label: '⏳ Pendientes', color: 'red' }
                ].map(group => {
                  const filtered = myOrders.filter(o => o.status === group.status);
                  if (filtered.length === 0) return null;
                  
                  return (
                    <Box key={group.status}>
                      <Divider 
                        label={<Text fw={900} color={group.color} size="sm">{group.label}</Text>} 
                        labelPosition="left" 
                        mb="md" 
                      />
                      <Stack gap="md">
                        {filtered.map(order => (
                          <Card key={order.id} withBorder radius="md" shadow="sm" p={0} style={{ borderLeft: `4px solid var(--mantine-color-${group.color}-filled)` }}>
                            <Box p="md">
                              <Group justify="space-between" mb="xs">
                                <Group gap="xs">
                                  <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
                                    <Text fw={900} color="blue">Mesa {order.table?.number}</Text>
                                  </Box>
                                  <Text size="xs" color="dimmed">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </Group>
                                <Badge color={group.color} variant="light">
                                  {group.label.split(' ')[1]}
                                </Badge>
                              </Group>
                              
                              <Stack gap={4}>
                                {order.items.map((item: any, idx: number) => (
                                  <Text key={idx} size="sm" fw={500}>
                                    • {item.quantity}x {item.product?.name || 'Producto'}
                                  </Text>
                                ))}
                              </Stack>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </div>
        )}
      </div>

      {/* Cart Review Modal */}
      <Modal 
        opened={showCart} 
        onClose={() => setShowCart(false)} 
        title={<Text fw={900} size="xl">Resumen de Comanda</Text>}
        size="lg"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <Stack gap="lg">
          <Box bg="blue.0" p="md" style={{ borderRadius: '12px' }}>
            <Group justify="space-between">
              <Text fw={700}>Mesa Seleccionada:</Text>
              <Badge color="blue" size="xl">{selectedTable?.number}</Badge>
            </Group>
          </Box>

          <ScrollArea h={350} offsetScrollbars>
            <Stack gap="md">
              {cart.map((item) => (
                <Paper key={item.productId} withBorder p="md" radius="md">
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Text fw={800} size="md">{item.name}</Text>
                        <Group gap={5} mt={4}>
                          <Text fw={900} color="blue" size="sm">
                            ${item.priceAtTime * item.quantity}
                          </Text>
                          <Text size="xs" color="dimmed">({item.quantity} x ${item.priceAtTime})</Text>
                        </Group>
                      </Box>
                      <Group gap="xs">
                        <ActionIcon variant="light" color="gray" onClick={() => updateQty(item.productId, -1)}><Text fw={900}>-</Text></ActionIcon>
                        <Text fw={900} size="lg" w={20} ta="center">{item.quantity}</Text>
                        <ActionIcon variant="light" color="blue" onClick={() => updateQty(item.productId, 1)}><Plus size={16} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => removeItem(item.productId)} ml={5}><Trash2 size={16} /></ActionIcon>
                      </Group>
                    </Group>
                    
                    <TextInput
                      label="Aclaración especial (opcional)"
                      placeholder="Ej: Jugosa, sin cebolla, etc."
                      size="xs"
                      leftSection={<MessageSquare size={14} color="#94a3b8" />}
                      value={item.observations}
                      onChange={(e) => updateItemNote(item.productId, e.currentTarget.value)}
                      styles={{
                        input: { backgroundColor: '#f8fafc', fontWeight: 600 }
                      }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>

          <Divider />

          <Group justify="space-between" px="xs">
            <Box>
              <Text size="sm" color="dimmed" fw={600}>Total a pagar</Text>
              <Text fw={900} size="2rem" color="blue" style={{ lineHeight: 1 }}>
                ${cart.reduce((a, b) => a + b.priceAtTime * b.quantity, 0)}
              </Text>
            </Box>
            <Button 
              size="lg" 
              radius="xl" 
              color="blue" 
              leftSection={<Send size={20} />}
              onClick={handleSendOrder}
              disabled={cart.length === 0}
              style={{ paddingLeft: '30px', paddingRight: '30px' }}
            >
              Enviar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Cart Floating Button */}
      {cart.length > 0 && !showCart && (
        <Paper 
          shadow="0 -5px 20px rgba(0,0,0,0.1)" 
          p="sm" 
          style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #e2e8f0',
            zIndex: 1000,
            borderRadius: '16px 16px 0 0'
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Group justify="space-between" align="center">
              <Box>
                <Text size="xs" fw={800} color="dimmed" tt="uppercase" mb={2}>Pedido actual</Text>
                <Group gap={8}>
                  <Text fw={900} size="xl" color="blue">
                    ${cart.reduce((a, b) => a + b.priceAtTime * b.quantity, 0)}
                  </Text>
                  <Badge color="blue" variant="light" radius="sm">{cart.reduce((a, b) => a + b.quantity, 0)} ítems</Badge>
                </Group>
              </Box>
              <Button 
                color="blue" 
                leftSection={<ShoppingCart size={20} />} 
                size="lg"
                radius="xl"
                onClick={() => setShowCart(true)}
                style={{ height: '48px', padding: '0 20px', boxShadow: '0 8px 12px -3px rgba(59, 130, 246, 0.2)' }}
              >
                Ver Pedido
              </Button>
            </Group>
          </div>
        </Paper>
      )}


      <style>{`
        .waiter-card:hover { transform: translateY(-4px); }
        .product-item-waiter { transition: background-color 0.2s; }
        .product-item-waiter:active { background-color: #f1f5f9; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
