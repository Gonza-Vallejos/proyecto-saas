import { useState, useEffect } from 'react';
import { Title, Text, Card, Group, Stack, TextInput, Button, Table, ActionIcon, Divider, Badge, Modal, Loader, Popover } from '@mantine/core';
import { ShoppingCart, Search, Trash2, CreditCard, Banknote, X } from 'lucide-react';
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

  // Mercado Pago QR State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

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
            setPendingOrderId(null);
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
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const processOrder = async () => {
    try {
      await api.post('/orders', {
        customerName: 'Cliente Mostrador',
        origin: 'POS',
        status: 'PAID',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.price
        }))
      });

      setCart([]);
      setQrModalOpen(false);
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
        const orderRes = await api.post('/orders', {
          customerName: 'Cliente Mostrador',
          origin: 'POS',
          status: 'PENDING',
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtTime: item.price
          }))
        });

        setPendingOrderId(orderRes.id);

        const res = await api.post('/mercado-pago/preference', {
          items: cart,
          returnUrl: window.location.href,
          orderId: orderRes.id
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

      processOrder();
    }
  };

  return (
    <div className="admin-page">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Punto de Venta</Title>
          <Text color="dimmed">Escanea productos y cobra en mostrador.</Text>
        </div>
        <Badge size="lg" color="indigo" variant="outline">Caja Abierta</Badge>
      </Group>

      {/* 👇 Buscador FUERA del grid, arriba de todo */}
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
                      <Text size="sm" fw={600}>{product.name}</Text>
                      <Text size="xs" color="dimmed">{product.category?.name ?? 'Sin categoría'}</Text>
                    </div>
                    <Text size="sm" fw={700} color="blue">${product.price.toLocaleString()}</Text>
                  </Group>
                </div>
              ))
            ) : (
              <Text size="sm" color="dimmed" ta="center" p="md">
                No se encontraron productos
              </Text>
            )}
          </Popover.Dropdown>
        </Popover>
      </Card>

      <div className="admin-pos-grid">
        {/* Lado Izquierdo: solo la tabla */}
        <Stack gap="md">
          <Card withBorder radius="md" p={0} shadow="sm" className="min-h-[400px] flex-1">
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
                      <Table.Td className="!pl-6">{item.name}</Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          <ActionIcon size="sm" variant="light" color="gray" radius="xl" onClick={() => updateQuantity(idx, -1)}>
                            <Text size="xs" fw={700}>-</Text>
                          </ActionIcon>
                          <Text fw={700} size="sm" style={{ minWidth: '16px', textAlign: 'center' }}>{item.quantity}</Text>
                          <ActionIcon size="sm" variant="light" color="gray" radius="xl" onClick={() => updateQuantity(idx, 1)}>
                            <Text size="xs" fw={700}>+</Text>
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                      <Table.Td>${(item.price * item.quantity).toLocaleString()}</Table.Td>
                      <Table.Td className="text-center">
                        <ActionIcon color="red" variant="subtle" onClick={() => handleRemove(idx)}>
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Stack>

        {/* Lado Derecho: Resumen y Cobro */}
        <Card withBorder radius="md" p="xl" shadow="sm" className="h-fit">
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
                disabled={cart.length === 0}
                onClick={() => handleCheckout('Efectivo')}
              >
                Cobrar en Efectivo
              </Button>
              <Button
                size="xl"
                radius="md"
                color="blue"
                variant="light"
                leftSection={<CreditCard size={24} />}
                disabled={cart.length === 0}
                onClick={() => handleCheckout('Mercado Pago')}
              >
                Cobrar con Mercado Pago
              </Button>
            </Stack>
          </Stack>
        </Card>
      </div>

      {/* Modal QR Mercado Pago — sin cambios */}
      <Modal
        opened={qrModalOpen}
        onClose={async () => {
          setQrModalOpen(false);
          if (pendingOrderId) {
            try {
              await api.patch(`/orders/${pendingOrderId}/status`, { status: 'CANCELLED' });
            } catch (e) {
              console.error('Error cancelling pending order:', e);
            }
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
            <>
              <Loader color="blue" size="xl" />
              <Text>Generando QR de pago...</Text>
            </>
          ) : qrUrl ? (
            <>
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              <Text ta="center" size="sm" color="dimmed">
                Pídele al cliente que escanee este código desde la app de Mercado Pago o con su cámara.
              </Text>
              <Button
                fullWidth
                color="green"
                size="md"
                onClick={async () => {
                  if (!pendingOrderId) return;
                  try {
                    await api.patch(`/orders/${pendingOrderId}/status`, { status: 'PAID' });
                    setCart([]);
                    setQrModalOpen(false);
                    setPendingOrderId(null);
                    Swal.fire({
                      title: '¡Venta Registrada!',
                      icon: 'success',
                      timer: 1500,
                      showConfirmButton: false
                    });
                  } catch (e: any) {
                    Swal.fire('Error', 'No se pudo registrar el pago.', 'error');
                  }
                }}
                loading={loadingQr}
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