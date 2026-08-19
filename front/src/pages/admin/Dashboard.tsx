import { useEffect, useState } from 'react';
import { Title, Grid, Card, Text, Group, Stack, Badge, Paper, Select } from '@mantine/core';
import { TrendingUp, ShoppingBag, Package, DollarSign } from 'lucide-react';
import Chart from 'react-apexcharts';
import { api } from '../../utils/api';

interface DashboardOverview {
  totalRevenue: number;
  totalOrders: number;
  revenueByDate: { date: string; amount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/statistics/overview?days=${days}`);
        setData(res);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading || !data) {
    return <div className="loader-container">Cargando métricas...</div>;
  }

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
    },
    colors: ['#0ea5e9'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: data.revenueByDate.map(d => d.date),
      labels: {
        style: { colors: '#64748b', fontFamily: 'Inter' },
        formatter: (val) => val ? val.split('-').slice(1).join('/') : val
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontFamily: 'Inter' },
        formatter: (value) => `$${value.toLocaleString()}`,
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `$${val.toLocaleString()}` }
    },
  };

  const chartSeries = [
    {
      name: 'Ingresos',
      data: data.revenueByDate.map(d => d.amount),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <Group justify="space-between" align="flex-end" className="mb-6">
        <div>
          <Title order={2} className="text-slate-800">Panel General</Title>
          <Text c="dimmed" size="sm">Resumen del rendimiento de tu tienda</Text>
        </div>
        <Select
          value={days}
          onChange={(v) => setDays(v || '30')}
          data={[
            { value: '7', label: 'Últimos 7 días' },
            { value: '30', label: 'Últimos 30 días' },
            { value: '90', label: 'Últimos 90 días' },
          ]}
          w={150}
        />
      </Group>

      <Grid gutter="lg">
        {/* Total Revenue */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder className="border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign size={80} />
            </div>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={600} c="dimmed" size="sm">INGRESOS TOTALES</Text>
              <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                <TrendingUp size={18} />
              </div>
            </Group>
            <Text fw={800} size="32px" c="dark.8">
              ${data.totalRevenue.toLocaleString()}
            </Text>
            <Badge color="green" variant="light" mt="sm">
              Periodo seleccionado
            </Badge>
          </Card>
        </Grid.Col>

        {/* Total Orders */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder className="border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShoppingBag size={80} />
            </div>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={600} c="dimmed" size="sm">PEDIDOS TOTALES</Text>
              <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                <Package size={18} />
              </div>
            </Group>
            <Text fw={800} size="32px" c="dark.8">
              {data.totalOrders}
            </Text>
            <Badge color="blue" variant="light" mt="sm">
              Periodo seleccionado
            </Badge>
          </Card>
        </Grid.Col>

        {/* Revenue Chart */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder className="border-slate-100 h-full">
            <Text fw={700} size="lg" mb="lg">Evolución de Ingresos</Text>
            <div className="w-full" style={{ minHeight: '300px' }}>
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="area"
                height={300}
                width="100%"
              />
            </div>
          </Card>
        </Grid.Col>

        {/* Top Products */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder className="border-slate-100 h-full">
            <Text fw={700} size="lg" mb="lg">Productos Estrella</Text>
            {data.topProducts.length === 0 ? (
              <Text c="dimmed" fs="italic">No hay ventas registradas en este periodo.</Text>
            ) : (
              <Stack gap="md">
                {data.topProducts.map((p, idx) => (
                  <Paper key={idx} p="sm" radius="md" className="bg-slate-50 border border-slate-100">
                    <Group justify="space-between" wrap="nowrap">
                      <div className="flex-1 overflow-hidden">
                        <Text size="sm" fw={600} truncate>{p.name}</Text>
                        <Text size="xs" c="dimmed">{p.quantity} vendidos</Text>
                      </div>
                      <Text size="sm" fw={700} c="blue.6">
                        ${p.revenue.toLocaleString()}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}
