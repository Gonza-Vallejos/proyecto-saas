import { useEffect, useState, Fragment } from 'react';
import { Title, Text, TextInput, Button, Group, Stack, Card, ActionIcon, Center, Loader, Box, Select, Badge } from '@mantine/core';
import { Plus, Trash2, LayoutGrid, AlertCircle, ChevronRight, Pencil, X } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { name: string };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await api.get('/admin/categories');
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}`, { name, parentId: parentId || 'none' });
        Swal.fire({ title: 'Categoría Actualizada', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/admin/categories', { name, parentId });
        Swal.fire({ title: 'Categoría Creada', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      
      setName('');
      setParentId(null);
      setEditingId(null);
      loadData();
    } catch (e: any) {
      // Si el error es manejado por el back (con mensaje legible), mostramos ese
      Swal.fire('Error', e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parentId || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setParentId(null);
  };

  const handleDelete = async (id: string, catName: string) => {
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
       await Swal.fire('Error', 'Esta categoría tiene subcategorías asociadas. Debes eliminarlas primero.', 'error');
       return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `La categoría "${catName}" será eliminada. Los productos asociados quedarán sin categoría asignada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/categories/${id}`);
        loadData();
        Swal.fire('Eliminada', 'La categoría ha sido borrada.', 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  if (loading) return (
    <Center className="h-[60vh]">
      <Stack align="center">
        <Loader size="lg" />
        <Text color="dimmed">Cargando tus categorías...</Text>
      </Stack>
    </Center>
  );

  // Solo permitir asignar como padre a categorías que NO son subcategorías ellas mismas (máximo 1 nivel)
  // Y evitar que una categoría sea su propio padre durante la edición
  const potentialParents = categories
    .filter(c => !c.parentId && c.id !== editingId)
    .map(c => ({ value: c.id, label: c.name }));

  return (
    <Box className="admin-page mx-auto max-w-[800px]">
      <Group justify="space-between" mb="2.5rem" align="flex-end">
        <div>
          <Group gap="xs" mb={4}>
            <LayoutGrid size={20} color="#0ea5e9" />
            <Text fw={700} size="xs" tt="uppercase" color="blue">Gestión de Catálogo</Text>
          </Group>
          <Title order={1}>Categorías y Subcategorías</Title>
          <Text color="dimmed" size="sm" mt={4}>
            Estructura tu menú de forma jerárquica para una mejor experiencia de compra.
          </Text>
        </div>
      </Group>

      {/* Formulario de Creación/Edición */}
      <Card withBorder radius="md" p="xl" shadow="sm" mb="2.5rem" style={{ 
        borderColor: editingId ? 'var(--mantine-color-blue-4)' : undefined,
        backgroundColor: editingId ? '#f0f9ff' : undefined
      }}>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Text fw={700} color={editingId ? 'blue' : 'dark'}>
              {editingId ? 'Editando Categoría' : 'Crear Nueva Categoría'}
            </Text>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput 
                label="Nombre de la categoría"
                placeholder="Ej. Hamburguesas, Cervezas, Entradas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                size="md"
                radius="md"
              />
              <Select 
                label="Pertenece a (Opcional)"
                placeholder="Es categoría principal"
                data={potentialParents}
                value={parentId}
                onChange={(val) => setParentId(val)}
                clearable
                size="md"
                radius="md"
                searchable
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {editingId && (
                <Button 
                  variant="light" 
                  color="gray" 
                  onClick={cancelEdit}
                  leftSection={<X size={18} />}
                  size="md"
                  radius="md"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button 
                  type="submit" 
                  leftSection={editingId ? <Pencil size={18} /> : <Plus size={18} />} 
                  loading={creating}
                  disabled={!name.trim()}
                  color={editingId ? 'blue' : undefined}
                  size="md"
                  radius="md"
                  className="flex-1"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </div>
          </Stack>
        </form>
      </Card>

      {/* Tabla de Resultados (para Tablets y Computadoras) - Oculta en celulares */}
      <div className="hidden md:block admin-table-shell">
        <table className="admin-table">
          <thead className="admin-table-head">
            <tr>
              <th className="admin-th">Nombre de Categoría</th>
              <th className="admin-th">Tipo</th>
              <th className="admin-th text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center">
                  <Center className="flex flex-col gap-4">
                    <AlertCircle size={32} color="#94a3b8" />
                    <Text color="dimmed">No tienes categorías creadas todavía.</Text>
                  </Center>
                </td>
              </tr>
            ) : (
              // Mostrar primero padres, luego sus hijos
              [...categories.filter(c => !c.parentId)].map(parent => (
                <Fragment key={parent.id}>
                  <tr className={`border-b border-slate-100 ${editingId === parent.id ? 'bg-sky-50' : 'bg-[#fcfcfc]'}`}>
                    <td className="admin-td">
                      <Text fw={700} color="#0f172a">{parent.name}</Text>
                    </td>
                    <td className="admin-td">
                       <Badge color="blue" variant="light" radius="sm">Principal</Badge>
                    </td>
                    <td className="admin-td text-center">
                      <Group gap="xs" justify="center">
                        <ActionIcon 
                          variant="subtle" 
                          color="blue" 
                          onClick={() => handleEdit(parent)}
                          size="lg"
                        >
                          <Pencil size={18} />
                        </ActionIcon>
                        <ActionIcon 
                          variant="subtle" 
                          color="red" 
                          onClick={() => handleDelete(parent.id, parent.name)}
                          size="lg"
                        >
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                  {categories.filter(c => c.parentId === parent.id).map(child => (
                    <tr key={child.id} className={`border-b border-slate-100 ${editingId === child.id ? 'bg-sky-50' : ''}`}>
                      <td className="admin-td pl-12">
                        <Group gap="xs">
                          <ChevronRight size={14} color="#94a3b8" />
                          <Text fw={500} color="#475569">{child.name}</Text>
                        </Group>
                      </td>
                      <td className="admin-td">
                         <Badge color="gray" variant="outline" radius="sm">Subcategoría</Badge>
                      </td>
                      <td className="admin-td text-center">
                        <Group gap="xs" justify="center">
                          <ActionIcon 
                            variant="subtle" 
                            color="blue" 
                            onClick={() => handleEdit(child)}
                            size="lg"
                          >
                            <Pencil size={18} />
                          </ActionIcon>
                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={() => handleDelete(child.id, child.name)}
                            size="lg"
                          >
                            <Trash2 size={18} />
                          </ActionIcon>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas (para Celulares) - Oculta en pantallas medianas y grandes */}
      <div className="block md:hidden space-y-3">
        {categories.length === 0 ? (
          <Card withBorder radius="xl" p="xl" className="text-center py-12 bg-white border-slate-100">
            <Stack align="center" gap="sm">
              <AlertCircle size={32} color="#94a3b8" />
              <Text color="dimmed" size="sm">No tienes categorías creadas todavía.</Text>
            </Stack>
          </Card>
        ) : (
          [...categories.filter(c => !c.parentId)].map(parent => (
            <Fragment key={parent.id}>
              {/* Categoría Principal */}
              <Card 
                withBorder 
                radius="xl" 
                p="md" 
                className={`bg-white shadow-sm border-slate-100 ${editingId === parent.id ? 'border-sky-400 bg-sky-50/20' : ''}`}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2}>
                    <Text fw={700} color="#0f172a" size="md">{parent.name}</Text>
                    <Badge color="blue" variant="light" size="xs" radius="sm">Principal</Badge>
                  </Stack>
                  
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="blue" 
                      onClick={() => handleEdit(parent)}
                      size="md"
                      radius="md"
                    >
                      <Pencil size={14} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="red" 
                      onClick={() => handleDelete(parent.id, parent.name)}
                      size="md"
                      radius="md"
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>

              {/* Subcategorías asociadas */}
              {categories.filter(c => c.parentId === parent.id).map(child => (
                <Card 
                  key={child.id}
                  withBorder 
                  radius="xl" 
                  p="md" 
                  className={`bg-white shadow-sm border-slate-100 ml-8 ${editingId === child.id ? 'border-sky-400 bg-sky-50/20' : ''}`}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <ChevronRight size={14} color="#94a3b8" className="shrink-0" />
                      <Stack gap={2}>
                        <Text fw={600} color="#475569" size="sm">{child.name}</Text>
                        <Badge color="gray" variant="outline" size="xs" radius="sm">Subcategoría</Badge>
                      </Stack>
                    </Group>
                    
                    <Group gap="xs">
                      <ActionIcon 
                        variant="light" 
                        color="blue" 
                        onClick={() => handleEdit(child)}
                        size="md"
                        radius="md"
                      >
                        <Pencil size={14} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="light" 
                        color="red" 
                        onClick={() => handleDelete(child.id, child.name)}
                        size="md"
                        radius="md"
                      >
                        <Trash2 size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Fragment>
          ))
        )}
      </div>
    </Box>
  );
}
