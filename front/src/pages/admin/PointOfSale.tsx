import { useState } from 'react';
import { Title, Text, Card, Group, Stack, TextInput, Button, Table, ActionIcon, Divider, Badge } from '@mantine/core';
import { ShoppingCart, Barcode, Trash2, CreditCard, Banknote } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../utils/api';

export default function PointOfSale() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const product = await api.get(`/admin/products/barcode/${barcodeInput.trim()}`);
      
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
      
      setTotal(prev => prev + product.price);
      setBarcodeInput('');
    } catch (error: any) {
      Swal.fire({
        title: 'No encontrado',
        text: 'El código escaneado no corresponde a ningún producto.',
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
      });
      setBarcodeInput('');
    }
  };

  const handleRemove = (index: number) => {
    const newCart = [...cart];
    const removed = newCart.splice(index, 1)[0];
    setCart(newCart);
    setTotal(prev => prev - removed.price);
  };

  const handleCheckout = async (method: 'Efectivo' | 'Mercado Pago') => {
    if (cart.length === 0) return;
    
    if (method === 'Mercado Pago') {
      Swal.fire('Próximamente', 'La integración con Mercado Pago está en desarrollo.', 'info');
      return;
    }

    try {
      await api.post('/orders', {
        customerName: 'Cliente Mostrador',
        origin: 'POS',
        status: 'PAID',
        orderItems: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          options: []
        }))
      });

      setCart([]);
      setTotal(0);
      Swal.fire({
        title: '¡Pagado!',
        text: 'El ticket se ha registrado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo procesar la venta.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Punto de Venta</Title>
          <Text color="dimmed">Escanea productos y cobra en mostrador.</Text>
        </div>
        <Badge size="lg" color="indigo" variant="outline">Caja Abierta</Badge>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Lado Izquierdo: Escáner y Lista de Productos */}
        <Stack gap="md">
          <Card withBorder radius="md" p="md" shadow="sm">
            <form onSubmit={handleScan}>
              <TextInput
                label="Escanear Código de Barras"
                placeholder="Haz clic aquí y usa el lector..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                leftSection={<Barcode size={18} />}
                size="lg"
                autoFocus
              />
            </form>
          </Card>

          <Card withBorder radius="md" p={0} shadow="sm" style={{ flex: 1, minHeight: '400px' }}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th style={{ paddingLeft: '1.5rem' }}>Producto</Table.Th>
                  <Table.Th>Cant.</Table.Th>
                  <Table.Th>Precio</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>X</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {cart.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                      <ShoppingCart size={48} color="#e2e8f0" style={{ margin: '0 auto', display: 'block', marginBottom: '1rem' }} />
                      <Text color="dimmed">El carrito está vacío. Escanea un producto.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  cart.map((item, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td style={{ paddingLeft: '1.5rem' }}>{item.name}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>${item.price.toLocaleString()}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
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
        <Card withBorder radius="md" p="xl" shadow="sm" style={{ height: 'fit-content' }}>
          <Stack gap="lg">
            <Title order={3}>Resumen</Title>
            
            <Group justify="space-between">
              <Text size="lg" color="dimmed">Total a Pagar</Text>
              <Title order={1} style={{ color: '#0ea5e9' }}>${total.toLocaleString()}</Title>
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
    </div>
  );
}
