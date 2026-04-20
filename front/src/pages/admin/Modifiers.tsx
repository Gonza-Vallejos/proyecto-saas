import { useEffect, useState } from 'react';
import { Title, Text, Button, Card, Group, Stack, Badge, Table, ActionIcon, Modal, TextInput, NumberInput, Switch, Box } from '@mantine/core';
import { Plus, Edit3, Trash2, Sandwich, PlusCircle } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface Option {
  name: string;
  price: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: Option[];
}

export default function Modifiers() {
  const [modifiers, setModifiers] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<ModifierGroup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [minSelected, setMinSelected] = useState(0);
  const [maxSelected, setMaxSelected] = useState(1);
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<Option[]>([{ name: '', price: 0 }]);

  const fetchModifiers = async () => {
    try {
      const data = await api.get('/modifiers');
      setModifiers(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModifiers();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setMinSelected(0);
    setMaxSelected(1);
    setIsRequired(false);
    setOptions([{ name: '', price: 0 }]);
    setModalOpened(true);
  };

  const openEditModal = (item: ModifierGroup) => {
    setEditingItem(item);
    setName(item.name);
    setMinSelected(item.minSelected);
    setMaxSelected(item.maxSelected);
    setIsRequired(item.isRequired);
    setOptions(item.options.length > 0 ? [...item.options] : [{ name: '', price: 0 }]);
    setModalOpened(true);
  };

  const handleAddOption = () => {
    setOptions(prev => [...prev, { name: '', price: 0 }]);
  };

  const handleUpdateOption = (index: number, field: keyof Option, value: any) => {
    const newOptions = [...options];
    (newOptions[index] as any)[field] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const sanitizedOptions = options
      .filter(o => o.name.trim() !== '')
      .map((o: any) => ({
        id: o.id,
        name: o.name,
        price: Number(o.price) || 0
      }));

    if (sanitizedOptions.length === 0) {
      Swal.fire('Error', 'Debes incluir al menos una opción válida.', 'error');
      return;
    }
    
    const payload = { 
      name, 
      minSelected, 
      maxSelected, 
      isRequired, 
      options: sanitizedOptions 
    };

    try {
      if (editingItem) {
        await api.patch(`/modifiers/${editingItem.id}`, payload);
        Swal.fire('¡Éxito!', 'Grupo de opciones actualizado.', 'success');
      } else {
        await api.post('/modifiers', payload);
        Swal.fire('¡Éxito!', 'Grupo de opciones creado.', 'success');
      }
      setModalOpened(false);
      fetchModifiers();
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará de todos los productos en los que esté asociado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });
    if (res.isConfirmed) {
      try {
        await api.delete(`/modifiers/${id}`);
        fetchModifiers();
        Swal.fire('Eliminado', '', 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  if (loading) return <div className="loader-container">Cargando Modificadores...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="3rem">
        <div>
          <Title order={1}>Experiencias Gastronómicas</Title>
          <Text color="dimmed">Crea grupos de opciones (Salsas, Tamaño, Extras) para personalizar tus productos.</Text>
        </div>
        <Button leftSection={<Plus size={18} />} onClick={openAddModal} size="md" radius="md">
          Crear Nuevo Grupo
        </Button>
      </Group>

      <Card withBorder radius="md" p={0} shadow="sm">
        <Table verticalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: '#f8fafc' }}>
            <Table.Tr>
              <Table.Th style={{ paddingLeft: '1.5rem' }}>Nombre del Grupo</Table.Th>
              <Table.Th>Opciones</Table.Th>
              <Table.Th>Reglas</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {modifiers.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} align="center" style={{ padding: '2rem' }}>
                  <Sandwich size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                  <Text color="dimmed">No tienes grupos de personalización.</Text>
                  <Button variant="light" mt="sm" onClick={openAddModal}>Añadir el primero</Button>
                </Table.Td>
              </Table.Tr>
            ) : (
              modifiers.map(mod => (
                <Table.Tr key={mod.id}>
                  <Table.Td style={{ paddingLeft: '1.5rem', fontWeight: 600 }}>{mod.name}</Table.Td>
                  <Table.Td>
                    <Group gap={5}>
                      {mod.options.map((opt, i) => (
                        <Badge key={i} variant="outline" color={opt.price > 0 ? "blue" : "gray"}>
                          {opt.name} {opt.price > 0 && `(+$${opt.price})`}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      {mod.isRequired && <Badge size="xs" color="red">Obligatorio</Badge>}
                      <Text size="xs" color="dimmed">Mín: {mod.minSelected} / Máx: {mod.maxSelected}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Group justify="center" gap="sm">
                      <ActionIcon variant="light" color="blue" onClick={() => openEditModal(mod)}>
                        <Edit3 size={18} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(mod.id)}>
                        <Trash2 size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={<Title order={4}>{editingItem ? 'Editar Grupo' : 'Nuevo Grupo de Opciones'}</Title>} size="xl" radius="md">
        <Stack gap="lg">
          <TextInput label="Nombre Interno/Público" description="Ej: Tipos de Pan, Elegí tu Salsa, Extras" placeholder="Ej: Aderezos Clásicos" value={name} onChange={e => setName(e.target.value)} required />
          
          <Group grow>
            <NumberInput label="Selección Mínima" description="0 si es opcional" value={minSelected} onChange={(v) => setMinSelected(Number(v) || 0)} min={0} />
            <NumberInput label="Selección Máxima" description="Cuántos puede elegir como máximo" value={maxSelected} onChange={(v) => setMaxSelected(Number(v) || 1)} min={1} />
          </Group>
          <Switch label="Obligatorio" description="El cliente debe elegir opciones para poder continuar" checked={isRequired} onChange={e => setIsRequired(e.currentTarget.checked)} />

          <Box mt="md">
            <Group justify="space-between" mb="xs">
              <Title order={5}>Opciones</Title>
              <Button size="xs" variant="light" leftSection={<PlusCircle size={14} />} onClick={handleAddOption}>Agregar Opción</Button>
            </Group>
            <Stack gap="xs">
              {options.map((opt, idx) => (
                <Group key={idx} grow align="flex-end">
                  <TextInput style={{ flex: 2 }} label={idx === 0 ? "Nombre" : ""} placeholder="Ej: Mayonesa" value={opt.name} onChange={e => handleUpdateOption(idx, 'name', e.target.value)} />
                  <NumberInput style={{ flex: 1 }} label={idx === 0 ? "Costo Adicional ($)" : ""} value={opt.price} onChange={v => handleUpdateOption(idx, 'price', Number(v) || 0)} min={0} />
                  <ActionIcon color="red" variant="subtle" size="lg" mb="4px" style={{ flex: 0 }} onClick={() => handleRemoveOption(idx)} disabled={options.length === 1}>
                    <Trash2 size={18} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Box>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => setModalOpened(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Grupo</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
