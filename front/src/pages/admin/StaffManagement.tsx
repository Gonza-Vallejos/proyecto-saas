import { useEffect, useState } from 'react';
import { Title, Text, Button, Card, Group, Stack, Table, ActionIcon, Tooltip, Modal, TextInput, PasswordInput, Select, Badge, Box, SimpleGrid, Paper } from '@mantine/core';
import { Plus, Trash2, User, ShieldCheck } from 'lucide-react';
import { api } from '../../utils/api';
import { useOutletContext } from 'react-router-dom';
import Swal from 'sweetalert2';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'WAITER' | 'KITCHEN' | 'CASHIER';
}

export default function StaffManagement() {
  const { storeData } = useOutletContext<{ storeData: any }>();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'WAITER' | 'KITCHEN' | 'CASHIER'>('WAITER');

  useEffect(() => {
    if (storeData && !storeData.hasOrderManagement) {
      setRole('CASHIER');
    }
  }, [storeData]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await api.get('/users/staff');
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEmail('');
    setName('');
    setPassword('');
    setRole('WAITER');
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    if (!email || !name || !password) return;
    try {
      await api.post('/users/staff', { email, name, password, role });
      setModalOpened(false);
      fetchStaff();
      Swal.fire('¡Éxito!', 'Miembro del personal creado correctamente.', 'success');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDelete = async (user: StaffUser) => {
    const result = await Swal.fire({
      title: '¿Eliminar acceso?',
      text: `Se revocará el acceso para ${user.name} (${user.role}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/staff/${user.id}`);
        fetchStaff();
        Swal.fire('Eliminado', 'Acceso revocado.', 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'WAITER') return <Badge color="violet" variant="light">Mozo / Mesero</Badge>;
    if (role === 'KITCHEN') return <Badge color="orange" variant="light">Cocinero</Badge>;
    if (role === 'CASHIER') return <Badge color="indigo" variant="light">Cajero / Vendedor</Badge>;
    return <Badge color="gray" variant="light">{role}</Badge>;
  };

  if (loading) return <div className="loader-container">Convocando al equipo...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Gestión de Personal</Title>
          <Text color="dimmed" size="sm">Administra los accesos para tus mozos, cocineros y cajeros.</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          onClick={handleOpenModal}
          size="md"
          radius="md"
          color="blue"
        >
          Nuevo Miembro
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: storeData?.hasOrderManagement ? 3 : 1 }} spacing="lg" mb="xl">
        {storeData?.hasOrderManagement && (
          <>
            <Paper withBorder p="md" radius="md">
              <Group>
                <Box bg="violet.0" p="xs" style={{ borderRadius: '8px' }}>
                  <User size={24} color="#8b5cf6" />
                </Box>
                <div>
                  <Text size="xs" color="dimmed" fw={700} tt="uppercase">Mozos Activos</Text>
                  <Text fw={700} size="xl">{staff.filter(u => u.role === 'WAITER').length}</Text>
                </div>
              </Group>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Group>
                <Box bg="orange.0" p="xs" style={{ borderRadius: '8px' }}>
                  <ShieldCheck size={24} color="#f59e0b" />
                </Box>
                <div>
                  <Text size="xs" color="dimmed" fw={700} tt="uppercase">Equipo de Cocina</Text>
                  <Text fw={700} size="xl">{staff.filter(u => u.role === 'KITCHEN').length}</Text>
                </div>
              </Group>
            </Paper>
          </>
        )}
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
              <Plus size={24} color="#3b82f6" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Cajeros / POS</Text>
              <Text fw={700} size="xl">{staff.filter(u => u.role === 'CASHIER').length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Card withBorder radius="md" p={0} shadow="sm">
        <Table verticalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: '#f8fafc' }}>
            <Table.Tr>
              <Table.Th style={{ paddingLeft: '1.5rem' }}>Nombre</Table.Th>
              <Table.Th>Email de Acceso</Table.Th>
              <Table.Th>Rol / Puesto</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {staff.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Text color="dimmed">No has registrado personal todavía.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              staff.map(user => (
                <Table.Tr key={user.id}>
                  <Table.Td style={{ paddingLeft: '1.5rem' }}><Text fw={700}>{user.name}</Text></Table.Td>
                  <Table.Td>{user.email}</Table.Td>
                  <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                  <Table.Td>
                    <Group justify="center" gap="sm">
                      <Tooltip label="Revocar Acceso">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(user)}>
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

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Agregar Personal" radius="md">
        <Stack gap="md">
          <TextInput label="Nombre Completo" placeholder="Ej: Juan Pérez" value={name} onChange={e => setName(e.target.value)} required />
          <TextInput label="Email de Acceso" placeholder="ejemplo@tienda.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <PasswordInput label="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <Select 
            label="Asignar Rol" 
            data={storeData?.hasOrderManagement ? [
              { value: 'WAITER', label: 'Mozo / Mesero' },
              { value: 'KITCHEN', label: 'Personal de Cocina' },
              { value: 'CASHIER', label: 'Cajero / Vendedor' }
            ] : [
              { value: 'CASHIER', label: 'Cajero / Vendedor' }
            ]} 
            value={role} 
            onChange={(val) => setRole(val as any)} 
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setModalOpened(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Crear Usuario</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
