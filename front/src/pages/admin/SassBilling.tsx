import { useEffect, useState } from 'react';
import { Title, Text, Card, Group, Stack, Button, TextInput, NumberInput, SimpleGrid, ThemeIcon, Divider, Box } from '@mantine/core';
import { CreditCard, KeyRound, Settings, Coins } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

export default function SassBilling() {
  const [superadminMpAccessToken, setSuperadminMpAccessToken] = useState('');
  const [superadminMpPublicKey, setSuperadminMpPublicKey] = useState('');
  const [defaultSubscriptionPrice, setDefaultSubscriptionPrice] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/stores/master/system-settings');
      setSuperadminMpAccessToken(data.superadminMpAccessToken || '');
      setSuperadminMpPublicKey(data.superadminMpPublicKey || '');
      setDefaultSubscriptionPrice(data.defaultSubscriptionPrice || 10000);
    } catch (e) {
      console.error('Error fetching system settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/stores/master/system-settings', {
        superadminMpAccessToken,
        superadminMpPublicKey,
        defaultSubscriptionPrice: Number(defaultSubscriptionPrice)
      });
      Swal.fire({
        title: '¡Guardado!',
        text: 'Configuración global de facturación SaaS actualizada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', e.message || 'Error al guardar la configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader-container">Cargando configuración global SaaS...</div>;

  return (
    <Box className="admin-page mx-auto max-w-[800px]">
      <Group gap="xs" mb={4}>
        <Settings size={20} color="#6366f1" />
        <Text fw={700} size="xs" tt="uppercase" color="indigo">Configuraciones del SaaS</Text>
      </Group>
      <Title order={1} mb="2rem">Cobros y Suscripciones SaaS</Title>

      <Card withBorder radius="xl" p="2rem" shadow="sm" className="bg-white border-slate-100">
        <Stack gap="xl">
          <Group gap="md">
            <ThemeIcon color="indigo" size="lg" radius="xl" variant="light">
              <CreditCard size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={800} size="md" color="#1e1b4b">Mercado Pago de la Plataforma</Text>
              <Text size="xs" color="dimmed">Introduce las credenciales de tu cuenta de Mercado Pago para recibir de manera automatizada los cobros de las suscripciones de tus clientes.</Text>
            </Box>
          </Group>

          <Divider color="slate.1" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              label="Access Token de la Plataforma (Producción/Pruebas)"
              placeholder="APP_USR-..."
              value={superadminMpAccessToken}
              onChange={(e) => setSuperadminMpAccessToken(e.target.value)}
              required
              type="password"
              size="md"
              radius="md"
              leftSection={<KeyRound size={16} color="#94a3b8" />}
            />
            <TextInput
              label="Public Key de la Plataforma"
              placeholder="APP_USR-..."
              value={superadminMpPublicKey}
              onChange={(e) => setSuperadminMpPublicKey(e.target.value)}
              required
              size="md"
              radius="md"
              leftSection={<KeyRound size={16} color="#94a3b8" />}
            />
          </SimpleGrid>

          <Divider color="slate.1" />

          <Group gap="md">
            <ThemeIcon color="teal" size="lg" radius="xl" variant="light">
              <Coins size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={800} size="md" color="#1e1b4b">Tarifa de Suscripción Base</Text>
              <Text size="xs" color="dimmed">Monto mensual en pesos ($ ARS) que cobrarás a las tiendas para renovar su servicio pro.</Text>
            </Box>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <NumberInput
              label="Monto de Suscripción Mensual ($ ARS)"
              placeholder="10000"
              value={defaultSubscriptionPrice}
              onChange={(val) => setDefaultSubscriptionPrice(Number(val) || 0)}
              prefix="$ "
              decimalScale={2}
              thousandSeparator="."
              decimalSeparator=","
              hideControls
              required
              size="md"
              radius="md"
            />
            <Button
              color="indigo"
              size="md"
              radius="md"
              onClick={handleSave}
              loading={saving}
              className="h-[42px] hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Guardar Configuración SaaS
            </Button>
          </SimpleGrid>
        </Stack>
      </Card>
    </Box>
  );
}
