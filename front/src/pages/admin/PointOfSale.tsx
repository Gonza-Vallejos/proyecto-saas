import { useState, useEffect } from 'react';
import { Title, Text, Card, Group, Stack, TextInput, Button, Table, ActionIcon, Divider, Badge, Modal, Loader, Popover, NumberInput, Grid } from '@mantine/core';
import { ShoppingCart, Search, Trash2, CreditCard, Banknote, X, Package, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../utils/api';

export default function PointOfSale() {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Cash Register State
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [initialCashInput, setInitialCashInput] = useState<number | ''>('');
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  
  const [closeRegisterModal, setCloseRegisterModal] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<any>(null);

  // Ready Orders
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [selectedReadyOrder, setSelectedReadyOrder] = useState<any>(null);

  // Mercado Pago QR State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchCashRegister();
    fetchReadyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCashRegister = async () => {
    try {
      const current = await api.get('/cash-registers/current');
      if (current) {
        setCashRegister(current);
        setOpenRegisterModal(false);
      } else {
        setCashRegister(null);
        setOpenRegisterModal(true);
      }
    } catch (e) {
      console.error('Error fetching cash register', e);
    }
  };

  const fetchReadyOrders = async () => {
    try {
      const orders = await api.get('/admin/orders?status=READY');
      setReadyOrders(orders);
    } catch (e) {
      console.error('Error fetching ready orders', e);
    }
  };

  const handleOpenRegister = async () => {
    try {
      await api.post('/cash-registers/open', { initialCash: Number(initialCashInput) || 0 });
      fetchCashRegister();
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleShowCloseRegister = async () => {
    try {
      const summary = await api.get('/cash-registers/summary');
      setShiftSummary(summary);
      setCloseRegisterModal(true);
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleCloseRegister = async () => {
    try {
      await api.post('/cash-registers/close', {});
      setCloseRegisterModal(false);
      setCashRegister(null);
      setOpenRegisterModal(true);
      Swal.fire('Caja Cerrada', 'El turno ha finalizado.', 'success');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  // Polling para Mercado Pago
  useEffect(() => {
    let interval: any;
    if (qrModalOpen && pendingOrderId) {
      interval = setInterval(async () => {
        try {
          const order = await api.get(`/orders/${pendingOrderId}`);
          if (order.status === 'PAID') {
            setQrModalOpen(false);
            setCart([]);
            setSelectedReadyOrder(null);
            setPendingOrderId(null);
            fetchReadyOrders();
            Swal.fire({
              title: '¡Pago Confirmado!',
              text: 'Mercado Pago ha procesado el pago correctamente.',
              icon: 'success',
              timer: 2500,
              showConfirmButton: false
            });
          }
        } catch (e) {
          console.error('Error polling order status', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [qrModalOpen, pendingOrderId]);

  // Búsqueda de productos por nombre con debounce
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const results = await api.get(`/admin/products/search/${encodeURIComponent(searchInput.trim())}`);
        setSearchResults(results);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const addProductToCart = (product: any) => {
    if (selectedReadyOrder) {
      Swal.fire('Atención', 'No puedes mezclar productos nuevos con un pedido online. Cobra el pedido online primero o cancélalo.', 'warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchInput('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const updateQuantity = (index: number, change: number) => {
    if (selectedReadyOrder) return;
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = item.quantity + change;
      if (newQty <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index] = { ...item, quantity: newQty };
      }
      return newCart;
    });
  };

  const handleRemove = (index: number) => {
    if (selectedReadyOrder) return;
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectReadyOrder = (order: any) => {
    if (cart.length > 0 && !selectedReadyOrder) {
      Swal.fire('Atención', 'Tienes productos en el carrito. Vácialo antes de cobrar un pedido online.', 'warning');
      return;
    }
    setSelectedReadyOrder(order);
    setCart(order.items.map((item: any) => ({
      id: item.productId,
      name: item.product?.name || 'Producto eliminado',
      price: item.priceAtTime,
      quantity: item.quantity,
      flavor: item.product?.flavor
    })));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedReadyOrder(null);
  };

  const processOrder = async (method: string) => {
    try {
      if (selectedReadyOrder) {
        await api.post(`/orders/${selectedReadyOrder.id}/pay`, { paymentMethod: method });
      } else {
        await api.post('/orders', {
          customerName: 'Cliente Mostrador',
          origin: 'POS',
          status: 'PAID',
          paymentStatus: 'PAID',
          paymentMethod: method,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtTime: item.price
          }))
        });
      }

      setCart([]);
      setSelectedReadyOrder(null);
      setQrModalOpen(false);
      fetchReadyOrders();

      Swal.fire({
        title: '¡Venta Registrada!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo procesar la venta.', 'error');
    }
  };

  const handleCheckout = async (method: 'Efectivo' | 'Mercado Pago') => {
    if (cart.length === 0) return;

    if (method === 'Mercado Pago') {
      setLoadingQr(true);
      setQrModalOpen(true);
      try {
        let orderId = pendingOrderId;
        
        if (selectedReadyOrder) {
          orderId = selectedReadyOrder.id;
        } else if (!orderId) {
          const orderRes = await api.post('/orders', {
            customerName: 'Cliente Mostrador',
            origin: 'POS',
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: 'MERCADOPAGO',
            items: cart.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              priceAtTime: item.price
            }))
          });
          orderId = orderRes.id;
          setPendingOrderId(orderId);
        }

        const res = await api.post('/mercado-pago/preference', {
          items: cart,
          returnUrl: window.location.href,
          orderId: orderId
        });

        setQrUrl(res.init_point);
      } catch (e: any) {
        setQrModalOpen(false);
        Swal.fire('Error', 'No se pudo generar el QR de Mercado Pago. Verifica si tienes la cuenta vinculada en Ajustes.', 'error');
      } finally {
        setLoadingQr(false);
      }
      return;
    }

    if (method === 'Efectivo') {
      const { value: amountReceived, isConfirmed: firstConfirmed } = await Swal.fire({
        title: 'Cobro en Efectivo',
        input: 'number',
        inputLabel: `Total a cobrar: $${total}`,
        inputPlaceholder: 'Monto que entrega el cliente',
        showCancelButton: true,
        confirmButtonText: 'Calcular',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) return 'Debes ingresar el monto';
          if (Number(value) < total) return 'El monto no alcanza para cubrir el total';
          return null;
        }
      });

      if (!firstConfirmed || !amountReceived) return;

      const vuelto = Number(amountReceived) - total;

      const { isConfirmed: secondConfirmed } = await Swal.fire({
        title: `Vuelto: $${vuelto}`,
        text: 'Presiona Enter o haz clic para confirmar la venta.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Venta',
        cancelButtonText: 'Cancelar'
      });

      if (!secondConfirmed) return;

      processOrder('CASH');
    }
  };

  return (
    <div className="admin-page">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Punto de Venta</Title>
          <Text color="dimmed">Escanea productos y cobra en mostrador.</Text>
        </div>
        {cashRegister ? (
          <Button color="red" variant="light" onClick={handleShowCloseRegister} leftSection={<Lock size={16} />}>
            Cerrar Caja
          </Button>
        ) : (
          <Badge size="lg" color="red" variant="filled">Caja Cerrada</Badge>
        )}
      </Group>

      <div className="admin-pos-grid">
        {/* Lado Izquierdo: Buscador y Tabla */}
        <Stack gap="md">
          <Card withBorder radius="md" p="md" shadow="sm" mb="md" style={{ overflow: 'visible' }}>
            <Popover
              opened={showDropdown && (searchResults.length > 0 || (!loadingSearch && searchInput.trim() !== ''))}
              withinPortal
              zIndex={1000}
              width="target"
              position="bottom-start"
              shadow="md"
            >
              <Popover.Target>
                <TextInput
                  label="Buscar producto por nombre"
                  placeholder="Escribí el nombre del producto..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  leftSection={loadingSearch ? <Loader size={16} /> : <Search size={18} />}
                  rightSection={
                    searchInput ? (
                      <ActionIcon variant="subtle" onClick={() => { setSearchInput(''); setShowDropdown(false); }}>
                        <X size={16} />
                      </ActionIcon>
                    ) : null
                  }
                  size="lg"
                  autoFocus
                  disabled={!!selectedReadyOrder || !cashRegister}
                />
              </Popover.Target>

              <Popover.Dropdown p={0}>
                {searchResults.length > 0 ? (
                  searchResults.map((product: any) => (
                    <div
                      key={product.id}
                      onClick={() => addProductToCart(product)}
                      style={{ cursor: 'pointer', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <Group justify="space-between">
                        <div>
                          <Group gap={6} align="center" mb={2}>
                            <Text size="sm" fw={600}>{product.name}</Text>
                            {product.flavor && (
                              <Badge variant="light" color="blue" size="sm" radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                                Sabor {product.flavor}
                              </Badge>
                            )}
                          </Group>
                          <Text size="xs" color="dimmed">{product.category?.name ?? 'Sin categoría'}</Text>
                        </div>
                        <Text size="sm" fw={700} color="blue">${product.price.toLocaleString()}</Text>
                      </Group>
                    </div>
                  ))
                ) : (
                  <Text size="sm" color="dimmed" ta="center" p="md">No se encontraron productos</Text>
                )}
              </Popover.Dropdown>
            </Popover>
          </Card>

          <Card withBorder radius="md" p={0} shadow="sm" className="min-h-[400px]">
            {selectedReadyOrder && (
              <div className="bg-orange-50 p-3 border-b border-orange-100 flex justify-between items-center">
                <Group gap="sm">
                  <Package size={20} className="text-orange-500" />
                  <Text fw={700} color="orange.8">Cobrando Pedido Online #{selectedReadyOrder.id.substring(0,6).toUpperCase()}</Text>
                  <Text size="sm" color="orange.8">({selectedReadyOrder.customerName})</Text>
                </Group>
                <ActionIcon color="orange" variant="subtle" onClick={clearCart}>
                  <X size={18} />
                </ActionIcon>
              </div>
            )}
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead className="bg-slate-50">
                <Table.Tr>
                  <Table.Th className="!pl-6">Producto</Table.Th>
                  <Table.Th>Cant.</Table.Th>
                  <Table.Th>Precio</Table.Th>
                  <Table.Th className="text-center">X</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cart.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="py-12 text-center">
                      <ShoppingCart size={48} color="#e2e8f0" className="mx-auto mb-4 block" />
                      <Text color="dimmed">El carrito está vacío. Buscá un producto por nombre.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  cart.map((item, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td className="!pl-6">
                        <Group gap={6} align="center">
                          <Text size="sm">{item.name}</Text>
                          {item.flavor && (
                            <Badge variant="light" color="blue" size="sm" radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                              Sabor {item.flavor}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {selectedReadyOrder ? (
                          <Text fw={700} size="sm" ta="center">{item.quantity}</Text>
                        ) : (
                          <Group gap={6} wrap="nowrap">
                            <ActionIcon size="sm" variant="light" color="gray" radius="xl" onClick={() => updateQuantity(idx, -1)}>
                              <Text size="xs" fw={700}>-</Text>
                            </ActionIcon>
                            <NumberInput
                              value={item.quantity}
                              onChange={(val) => {
                                const newCart = [...cart];
                                newCart[idx].quantity = Number(val) || 1;
                                setCart(newCart);
                              }}
                              min={1}
                              hideControls
                              styles={{ input: { width: '45px', textAlign: 'center', padding: '0 4px', height: '26px', minHeight: '26px' } }}
                            />
                            <ActionIcon size="sm" variant="light" color="gray" radius="xl" onClick={() => updateQuantity(idx, 1)}>
                              <Text size="xs" fw={700}>+</Text>
                            </ActionIcon>
                          </Group>
                        )}
                      </Table.Td>
                      <Table.Td>${(item.price * item.quantity).toLocaleString()}</Table.Td>
                      <Table.Td className="text-center">
                        {!selectedReadyOrder && (
                          <ActionIcon color="red" variant="subtle" onClick={() => handleRemove(idx)}>
                            <Trash2 size={16} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Stack>

        {/* Lado Derecho: Resumen y Pedidos Listos */}
        <Stack gap="md" className="h-fit">
            <Card withBorder radius="md" p="xl" shadow="sm">
              <Stack gap="lg">
                <Title order={3}>Resumen</Title>
                <Group justify="space-between">
                  <Text size="lg" color="dimmed">Total a Pagar</Text>
                  <Title order={1} className="text-sky-500">${total.toLocaleString()}</Title>
                </Group>
                <Divider />
                <Stack gap="sm">
                  <Button
                    size="xl"
                    radius="md"
                    color="green"
                    leftSection={<Banknote size={24} />}
                    disabled={cart.length === 0 || !cashRegister}
                    onClick={() => handleCheckout('Efectivo')}
                  >
                    Efectivo
                  </Button>
                  <Button
                    size="xl"
                    radius="md"
                    color="blue"
                    variant="light"
                    leftSection={<CreditCard size={24} />}
                    disabled={cart.length === 0 || !cashRegister}
                    onClick={() => handleCheckout('Mercado Pago')}
                  >
                    Mercado Pago
                  </Button>
                </Stack>
              </Stack>
            </Card>

            {readyOrders.length > 0 && (
              <Card withBorder radius="md" p="md" shadow="sm" className="border-orange-200">
                <Group gap="xs" mb="md">
                  <Package size={20} className="text-orange-500" />
                  <Title order={4} className="text-orange-600">Pedidos para Retirar</Title>
                  <Badge color="orange" variant="filled">{readyOrders.length}</Badge>
                </Group>
                <Stack gap="xs">
                  {readyOrders.map(order => (
                    <Card key={order.id} withBorder p="sm" radius="md" className="cursor-pointer hover:bg-orange-50" onClick={() => handleSelectReadyOrder(order)}>
                      <Group justify="space-between" mb="xs">
                        <Text fw={700} size="sm">{order.customerName}</Text>
                        <Text fw={700} color="orange.6">${order.total.toLocaleString()}</Text>
                      </Group>
                      <Text size="xs" color="dimmed" lineClamp={1}>
                        {order.items.length} productos • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
      </div>

      {/* Modal Apertura de Caja */}
      <Modal
        opened={openRegisterModal}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        title={<Title order={3}>Apertura de Caja</Title>}
        centered
        overlayProps={{ blur: 5 }}
      >
        <Stack gap="md" mt="sm">
          <Text size="sm" color="dimmed">
            Ingresa el monto de cambio inicial con el que abres la caja para este turno. Puedes dejarlo en 0.
          </Text>
          <NumberInput
            label="Monto Inicial en Efectivo"
            placeholder="0"
            value={initialCashInput}
            onChange={(val) => setInitialCashInput(Number(val) || '')}
            min={0}
            leftSection={<Text size="sm">$</Text>}
            size="md"
          />
          <Button size="md" color="blue" onClick={handleOpenRegister} fullWidth mt="sm">
            Abrir Caja y Comenzar
          </Button>
        </Stack>
      </Modal>

      {/* Modal Cierre de Caja */}
      <Modal
        opened={closeRegisterModal}
        onClose={() => setCloseRegisterModal(false)}
        title={<Title order={3}>Resumen de Turno</Title>}
        centered
      >
        {shiftSummary && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text>Fondo Inicial:</Text>
              <Text fw={700}>${shiftSummary.initialCash.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Ventas en Efectivo:</Text>
              <Text fw={700} color="green">${shiftSummary.cashSales.toLocaleString()}</Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text size="lg">Efectivo Esperado en Caja:</Text>
              <Text size="xl" fw={900} color="blue">${shiftSummary.expectedCash.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between" mt="md">
              <Text size="sm" color="dimmed">Ventas Mercado Pago:</Text>
              <Text size="sm" color="dimmed" fw={700}>${shiftSummary.mpSales.toLocaleString()}</Text>
            </Group>
            
            <Button color="red" size="md" mt="xl" onClick={handleCloseRegister}>
              Confirmar Cierre de Caja
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Modal QR Mercado Pago */}
      <Modal
        opened={qrModalOpen}
        onClose={async () => {
          setQrModalOpen(false);
          if (pendingOrderId && !selectedReadyOrder) {
            try {
              await api.patch(`/orders/${pendingOrderId}/status`, { status: 'CANCELLED' });
            } catch (e) {}
            setPendingOrderId(null);
          }
        }}
        title={
          <Group gap="xs">
            <CreditCard size={20} color="#0ea5e9" />
            <Text fw={700}>Cobro con Mercado Pago</Text>
          </Group>
        }
        centered
        size="sm"
      >
        <Stack align="center" gap="lg" py="md">
          {loadingQr ? (
            <Loader color="blue" size="xl" />
          ) : qrUrl ? (
            <>
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              <Text ta="center" size="sm" color="dimmed">
                Pídele al cliente que escanee este código desde la app de Mercado Pago.
              </Text>
              <Button
                fullWidth
                color="green"
                size="md"
                onClick={async () => {
                  try {
                    await processOrder('MERCADOPAGO');
                  } catch (e) {}
                }}
              >
                Confirmar Pago Recibido
              </Button>
            </>
          ) : null}
        </Stack>
      </Modal>
    </div>
  );
}