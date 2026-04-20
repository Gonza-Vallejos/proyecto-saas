import { useEffect, useState } from 'react';
import { Title, Text, Button, Card, Group, Stack, Table, ActionIcon, Tooltip, Modal, TextInput, NumberInput, Badge, Box, SimpleGrid, Paper } from '@mantine/core';
import { Plus, Trash2, Edit3, Utensils, Users } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface TableItem {
  id: string;
  number: string;
  capacity: number;
  isActive: boolean;
}

export default function TablesManager() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);

  // Form states
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState<number | string>(2);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await api.get('/tables');
      setTables(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table?: TableItem) => {
    if (table) {
      setEditingTable(table);
      setNumber(table.number);
      setCapacity(table.capacity);
    } else {
      setEditingTable(null);
      setNumber('');
      setCapacity(2);
    }
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    if (!number) return;
    try {
      if (editingTable) {
        await api.patch(`/tables/${editingTable.id}`, { number, capacity: Number(capacity) });
        Swal.fire('¡Éxito!', 'Mesa actualizada correctamente.', 'success');
      } else {
        await api.post('/tables', { number, capacity: Number(capacity) });
        Swal.fire('¡Éxito!', 'Mesa creada correctamente.', 'success');
      }
      setModalOpened(false);
      fetchTables();
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDelete = async (table: TableItem) => {
    const result = await Swal.fire({
      title: '¿Eliminar mesa?',
      text: `Se eliminará la "${table.number}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/tables/${table.id}`);
        fetchTables();
        Swal.fire('Eliminada', 'La mesa ha sido eliminada.', 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  const toggleStatus = async (table: TableItem) => {
    try {
      await api.patch(`/tables/${table.id}`, { isActive: !table.isActive });
      fetchTables();
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  if (loading) return <div className="loader-container">Organizando salón...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Gestión de Mesas</Title>
          <Text color="dimmed" size="sm">Configura la disposición de tu local para el sistema de comandas.</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          onClick={() => handleOpenModal()}
          size="md"
          radius="md"
        >
          Agregar Mesa
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
              <Utensils size={24} color="#3b82f6" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Mesas Totales</Text>
              <Text fw={700} size="xl">{tables.length}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="green.0" p="xs" style={{ borderRadius: '8px' }}>
              <Users size={24} color="#10b981" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Capacidad Total</Text>
              <Text fw={700} size="xl">{tables.reduce((acc, t) => acc + t.capacity, 0)} cubiertos</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Card withBorder radius="md" p={0} shadow="sm">
        <Table verticalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: '#f8fafc' }}>
            <Table.Tr>
              <Table.Th style={{ paddingLeft: '1.5rem' }}>Número / Nombre</Table.Th>
              <Table.Th>Capacidad</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tables.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Text color="dimmed">No hay mesas configuradas. ¡Crea la primera!</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              tables.map(table => (
                <Table.Tr key={table.id}>
                  <Table.Td style={{ paddingLeft: '1.5rem' }}>
                    <Text fw={700}>{table.number}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Users size={14} color="#94a3b8" />
                      <Text size="sm">{table.capacity} personas</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={table.isActive ? 'green' : 'gray'} 
                      variant="light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleStatus(table)}
                    >
                      {table.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="center" gap="sm">
                      <Tooltip label="Editar">
                        <ActionIcon variant="light" color="blue" onClick={() => handleOpenModal(table)}>
                          <Edit3 size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(table)}>
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        title={editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
        radius="md"
      >
        <Stack gap="md">
          <TextInput 
            label="Identificador de la Mesa" 
            placeholder="Ej: Mesa 1, Barra, VIP 2"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
          <NumberInput 
            label="Capacidad (Personas)" 
            min={1}
            max={50}
            value={capacity}
            onChange={setCapacity}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setModalOpened(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingTable ? 'Guardar Cambios' : 'Crear Mesa'}</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
