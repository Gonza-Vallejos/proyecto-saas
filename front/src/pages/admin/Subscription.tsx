// Módulo de Suscripción SaaS para el Comercio - Facturación de la Plataforma
import { useEffect, useState } from 'react';
import { Title, Text, Card, Group, Stack, Badge, Button, Paper, ThemeIcon, Box, Divider, SimpleGrid } from '@mantine/core';
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'TRIAL';
  subscriptionExpiresAt: string | null;
  subscriptionPrice: number;
}

export default function Subscription() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const location = useLocation();

  const loadSubscriptionInfo = async () => {
    try {
      const data = await api.get('/stores/my-store');
      setStore(data);
    } catch (e) {
      console.error('Error fetching subscription info', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  useEffect(() => {
    // Detectar retorno exitoso de Mercado Pago
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      Swal.fire({
        title: '¡Pago Recibido con Éxito!',
        text: 'Tu pago de suscripción ha sido procesado de forma segura. La plataforma está actualizando tu fecha de vencimiento. Esto puede tardar unos segundos en impactar.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4f46e5'
      });
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      loadSubscriptionInfo();
    } else if (params.get('payment') === 'failure') {
      Swal.fire({
        title: 'Pago Cancelado o Fallido',
        text: 'No se pudo completar el pago de la suscripción. Por favor, intenta de nuevo.',
        icon: 'error',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ef4444'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handlePay = async () => {
    if (!store) return;
    setPaying(true);
    try {
      // Usar URL absoluta de retorno apuntando al mismo panel
      const returnUrl = window.location.href.split('?')[0];
      const res = await api.post('/mercado-pago/subscription-preference', { returnUrl });
      
      if (res?.init_point) {
        window.location.href = res.init_point;
      } else {
        throw new Error('No se recibió la URL de pago de Mercado Pago');
      }
    } catch (e: any) {
      Swal.fire({
        title: 'Error de Conexión',
        text: e.message || 'No se pudo generar el enlace de pago de Mercado Pago. Asegúrate de que el Superadministrador haya vinculado sus credenciales.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="loader-container">Obteniendo detalles de facturación...</div>;
  if (!store) return <div className="loader-container">Error cargando detalles del comercio.</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'teal';
      case 'TRIAL': return 'blue';
      case 'PENDING_PAYMENT': return 'orange';
      case 'EXPIRED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Suscripción Activa';
      case 'TRIAL': return 'Prueba Gratuita';
      case 'PENDING_PAYMENT': return 'Pago Pendiente';
      case 'EXPIRED': return 'Suscripción Vencida';
      default: return status;
    }
  };

  const formattedExpiry = store.subscriptionExpiresAt 
    ? new Date(store.subscriptionExpiresAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'Sin fecha de vencimiento';

  const isExpired = store.subscriptionStatus === 'EXPIRED';

  return (
    <Box className="admin-page mx-auto max-w-[800px]">
      <Group gap="xs" mb={4}>
        <CreditCard size={20} color="#6366f1" />
        <Text fw={700} size="xs" tt="uppercase" color="indigo">SaaS Platform Billing</Text>
      </Group>
      <Title order={1} mb="2rem">Gestión de Suscripción</Title>

      <Stack gap="xl">
        {/* Banner de alerta si está expirado */}
        {isExpired && (
          <Paper withBorder p="md" radius="xl" bg="red.0" style={{ borderColor: 'var(--mantine-color-red-3)' }} className="flex gap-4 items-center">
            <ThemeIcon color="red" variant="light" size="xl" radius="xl">
              <AlertTriangle size={24} />
            </ThemeIcon>
            <Box>
              <Text fw={700} color="red.9" size="sm">¡Tu suscripción ha vencido!</Text>
              <Text size="xs" color="red.8">Para restablecer la plena conectividad y seguir utilizando los módulos pro de tu backoffice y Punto de Venta, por favor realiza el pago de la renovación.</Text>
            </Box>
          </Paper>
        )}

        {/* Tarjeta de Suscripción Principal */}
        <Card withBorder radius="xl" p="2rem" shadow="sm" className="bg-white border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-[150px] w-[150px] bg-indigo-50/30 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
          
          <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xl">
            <Stack gap="xs">
              <Badge color={getStatusColor(store.subscriptionStatus)} variant="filled" size="lg" radius="sm">
                {getStatusLabel(store.subscriptionStatus)}
              </Badge>
              <Title order={2} size="h3" className="text-slate-800">Plan Mensual Gastro/Retail Pro</Title>
              <Text size="sm" color="dimmed">Acceso total a todos tus módulos habilitados por el Superadmin.</Text>
            </Stack>

            <ThemeIcon color="indigo" size={54} radius="xl" variant="light">
              <ShieldCheck size={28} />
            </ThemeIcon>
          </Group>

          <Divider mb="xl" color="slate.1" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" mb="xl">
            <Group gap="md">
              <ThemeIcon color="slate" variant="light" size="lg" radius="xl">
                <Calendar size={18} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xs" color="dimmed" fw={600} tt="uppercase">Fecha de Vencimiento</Text>
                <Text size="md" fw={700} color="slate.8">{formattedExpiry}</Text>
              </Stack>
            </Group>

            <Group gap="md">
              <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
                <CheckCircle2 size={18} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xs" color="dimmed" fw={600} tt="uppercase">Monto de la Suscripción</Text>
                <Text size="lg" fw={900} color="teal.8">$ {store.subscriptionPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ mes</span></Text>
              </Stack>
            </Group>
          </SimpleGrid>

          <Divider mb="xl" color="slate.1" />

          <Stack gap="xs">
            <Button
              color="indigo"
              size="lg"
              radius="md"
              fullWidth
              leftSection={<CreditCard size={20} />}
              loading={paying}
              onClick={handlePay}
              className="hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Renovar Suscripción con Mercado Pago
            </Button>
            <Text size="10px" color="dimmed" ta="center">
              El pago se procesa de forma instantánea a través de la pasarela segura de Mercado Pago. Al completarse, tu tienda se extenderá automáticamente por 30 días de servicio pro.
            </Text>
          </Stack>
        </Card>

        {/* FAQ o Ayuda Corta */}
        <Paper withBorder p="xl" radius="xl" bg="slate.0" className="border-slate-100">
          <Group gap="sm" mb="xs">
            <HelpCircle size={20} color="#6366f1" />
            <Text fw={700} size="sm" color="slate.8">Preguntas Frecuentes sobre Facturación</Text>
          </Group>
          <Stack gap="sm">
            <Box>
              <Text fw={700} size="xs" color="slate.7">¿Qué sucede si expira mi suscripción?</Text>
              <Text size="xs" color="dimmed">El backoffice y tu catálogo web siguen abiertos en modo de lectura, pero se bloquea la toma de nuevos pedidos de clientes en Punto de Venta o pedidos WhatsApp hasta registrar el pago.</Text>
            </Box>
            <Box>
              <Text fw={700} size="xs" color="slate.7">¿Puedo renovar antes de la fecha de vencimiento?</Text>
              <Text size="xs" color="dimmed">¡Sí! Si renuevas de manera anticipada, sumaremos 30 días de forma exacta al final de tu fecha de expiración actual, por lo que nunca perderás días de servicio activo.</Text>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
