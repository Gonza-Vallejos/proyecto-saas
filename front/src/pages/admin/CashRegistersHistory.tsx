import { useState, useEffect } from 'react';
import { Title, Card, Table, Badge, Group, Text, Loader, Stack } from '@mantine/core';
import { Archive } from 'lucide-react';
import { api } from '../../utils/api';

export default function CashRegistersHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await api.get('/cash-registers/history');
      setHistory(data);
    } catch (error) {
      console.error('Error fetching cash registers history', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <Group mb="xl">
        <Archive size={32} className="text-slate-700" />
        <div>
          <Title order={2}>Historial de Cajas</Title>
          <Text color="dimmed">Auditoría de todos los turnos abiertos y cerrados por los empleados.</Text>
        </div>
      </Group>

      <Card withBorder radius="md" p={0} shadow="sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader size="lg" />
          </div>
        ) : history.length === 0 ? (
          <Stack align="center" gap="xs" py="xl">
            <Text color="dimmed">Aún no hay registros de cajas en esta tienda.</Text>
          </Stack>
        ) : (
          <>
            {/* Vista de Tabla (para Tablets y Computadoras) - Oculta en celulares */}
            <div className="hidden md:block">
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead className="bg-slate-50">
                  <Table.Tr>
                    <Table.Th className="!pl-6">Fecha y Hora</Table.Th>
                    <Table.Th>Cajero</Table.Th>
                    <Table.Th>Apertura</Table.Th>
                    <Table.Th>Cierre</Table.Th>
                    <Table.Th>Efectivo Inicial</Table.Th>
                    <Table.Th>Efectivo Final (Esperado)</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {history.map((reg) => (
                    <Table.Tr key={reg.id}>
                      <Table.Td className="!pl-6">
                        <Text size="sm" fw={500}>
                          {new Date(reg.openedAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {reg.openedBy ? (
                          <Stack gap={0}>
                            <Text size="sm" fw={600}>{reg.openedBy.name}</Text>
                            <Text size="xs" color="dimmed">{reg.openedBy.email}</Text>
                          </Stack>
                        ) : (
                          <Text size="sm" color="dimmed" fs="italic">Desconocido</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(reg.openedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
                      </Table.Td>
                      <Table.Td>
                        {reg.closedAt ? (
                          <Text size="sm">{new Date(reg.closedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
                        ) : (
                          <Text size="sm" color="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">${reg.initialCash?.toLocaleString() || 0}</Text>
                      </Table.Td>
                      <Table.Td>
                        {reg.expectedCash !== null ? (
                          <Text size="sm" fw={700} color="green">${reg.expectedCash.toLocaleString()}</Text>
                        ) : (
                          <Text size="sm" color="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {reg.closedAt ? (
                          <Badge color="gray" variant="light">Cerrada</Badge>
                        ) : (
                          <Badge color="green" variant="filled">En Curso</Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {/* Vista de Tarjetas (para Celulares) - Oculta en pantallas medianas y grandes */}
            <div className="block md:hidden space-y-4 p-4">
              {history.map((reg) => (
                <Card key={reg.id} withBorder radius="xl" p="md" className="bg-white shadow-sm border-slate-100">
                  <Group justify="space-between" mb="xs" align="center">
                    <Text size="sm" fw={700} color="#1e293b">
                      {new Date(reg.openedAt).toLocaleDateString()}
                    </Text>
                    {reg.closedAt ? (
                      <Badge color="gray" variant="light" size="sm">Cerrada</Badge>
                    ) : (
                      <Badge color="green" variant="filled" size="sm">En Curso</Badge>
                    )}
                  </Group>

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                      <Text size="xs" color="dimmed" fw={600}>Cajero:</Text>
                      {reg.openedBy ? (
                        <Stack gap={0} align="flex-end">
                          <Text size="sm" fw={700} color="#0f172a">{reg.openedBy.name}</Text>
                          <Text size="10px" color="dimmed">{reg.openedBy.email}</Text>
                        </Stack>
                      ) : (
                        <Text size="sm" color="dimmed" fs="italic">Desconocido</Text>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                      <div>
                        <Text size="xs" color="dimmed" fw={600}>Apertura:</Text>
                        <Text size="sm" fw={600} color="#334155">
                          {new Date(reg.openedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed" fw={600}>Cierre:</Text>
                        <Text size="sm" fw={600} color="#334155">
                          {reg.closedAt ? (
                            new Date(reg.closedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                          ) : (
                            '-'
                          )}
                        </Text>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <Text size="xs" color="dimmed" fw={600}>Ef. Inicial:</Text>
                        <Text size="sm" fw={700} color="#334155">
                          ${reg.initialCash?.toLocaleString() || 0}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed" fw={600}>Ef. Final (Esp):</Text>
                        <Text size="sm" fw={700} color="green">
                          {reg.expectedCash !== null ? `$${reg.expectedCash.toLocaleString()}` : '-'}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
