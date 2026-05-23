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
  role: 'CASHIER';
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
  const [role, setRole] = useState<'CASHIER'>('CASHIER');

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
    setRole('CASHIER');
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
    if (role === 'CASHIER') return <Badge color="indigo" variant="light">Cajero / Vendedor</Badge>;
    return <Badge color="gray" variant="light">{role}</Badge>;
  };

  if (loading) return <div className="loader-container">Convocando al equipo...</div>;

  return (
    <div className="admin-page">
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Gestión de Personal</Title>
          <Text color="dimmed" size="sm">Administra los accesos para tus cajeros.</Text>
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

      <SimpleGrid cols={1} spacing="lg" mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <Box bg="blue.0" p="xs" className="rounded-lg">
              <Plus size={24} color="#3b82f6" />
            </Box>
            <div>
              <Text size="xs" color="dimmed" fw={700} tt="uppercase">Cajeros / POS Activos</Text>
              <Text fw={700} size="xl">{staff.filter(u => u.role === 'CASHIER').length}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Card withBorder radius="md" p={0} shadow="sm">
        <Table verticalSpacing="md" highlightOnHover>
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="!pl-6">Nombre</Table.Th>
              <Table.Th>Email de Acceso</Table.Th>
              <Table.Th>Rol / Puesto</Table.Th>
              <Table.Th className="text-center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {staff.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} className="py-12 text-center">
                  <Text color="dimmed">No has registrado personal todavía.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              staff.map(user => (
                <Table.Tr key={user.id}>
                  <Table.Td className="!pl-6"><Text fw={700}>{user.name}</Text></Table.Td>
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
            data={[
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
