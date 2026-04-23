import { useEffect, useState, Fragment } from 'react';
import { Title, Text, TextInput, Button, Group, Stack, Card, ActionIcon, Center, Loader, Box, Select, Badge } from '@mantine/core';
import { Plus, Trash2, LayoutGrid, AlertCircle, ChevronRight } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  parent?: { name: string };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      await api.post('/admin/categories', { name, parentId });
      setName('');
      setParentId(null);
      loadData();
      Swal.fire({
        title: 'Categoría Creada',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setCreating(false);
    }
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
    <Center style={{ height: '60vh' }}>
      <Stack align="center">
        <Loader size="lg" />
        <Text color="dimmed">Cargando tus categorías...</Text>
      </Stack>
    </Center>
  );

  // Solo permitir asignar como padre a categorías que NO son subcategorías ellas mismas (máximo 1 nivel)
  const potentialParents = categories.filter(c => !c.parentId).map(c => ({ value: c.id, label: c.name }));

  return (
    <Box style={{ maxWidth: '800px', animation: 'fadeUp 0.5s ease-out' }}>
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

      {/* Formulario de Creación */}
      <Card withBorder radius="md" p="xl" shadow="sm" mb="2.5rem">
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <Group align="flex-end">
              <TextInput 
                label="Nombre de la nueva categoría"
                placeholder="Ej. Hamburguesas, Cervezas, Entradas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ flex: 1 }}
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
                style={{ flex: 1 }}
                clearable
                size="md"
                radius="md"
                searchable
              />
            </Group>
            <Button 
                type="submit" 
                leftSection={<Plus size={18} />} 
                loading={creating}
                disabled={!name.trim()}
                size="md"
                radius="md"
                fullWidth
              >
                Crear Categoría
              </Button>
          </Stack>
        </form>
      </Card>

      {/* Tabla de Resultados */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>Nombre de Categoría</th>
              <th style={thStyle}>Tipo</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}>
                  <Center style={{ flexDirection: 'column', gap: '1rem' }}>
                    <AlertCircle size={32} color="#94a3b8" />
                    <Text color="dimmed">No tienes categorías creadas todavía.</Text>
                  </Center>
                </td>
              </tr>
            ) : (
              // Mostrar primero padres, luego sus hijos
              [...categories.filter(c => !c.parentId)].map(parent => (
                <Fragment key={parent.id}>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fcfcfc' }}>
                    <td style={tdStyle}>
                      <Text fw={700} color="#0f172a">{parent.name}</Text>
                    </td>
                    <td style={tdStyle}>
                       <Badge color="blue" variant="light" radius="sm">Principal</Badge>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <ActionIcon 
                        variant="subtle" 
                        color="red" 
                        onClick={() => handleDelete(parent.id, parent.name)}
                        size="lg"
                      >
                        <Trash2 size={18} />
                      </ActionIcon>
                    </td>
                  </tr>
                  {categories.filter(c => c.parentId === parent.id).map(child => (
                    <tr key={child.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...tdStyle, paddingLeft: '3rem' }}>
                        <Group gap="xs">
                          <ChevronRight size={14} color="#94a3b8" />
                          <Text fw={500} color="#475569">{child.name}</Text>
                        </Group>
                      </td>
                      <td style={tdStyle}>
                         <Badge color="gray" variant="outline" radius="sm">Subcategoría</Badge>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <ActionIcon 
                          variant="subtle" 
                          color="red" 
                          onClick={() => handleDelete(child.id, child.name)}
                          size="lg"
                        >
                          <Trash2 size={18} />
                        </ActionIcon>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Box>
  );
}

const thStyle = { padding: '1.25rem 1.5rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' as const, textAlign: 'left' as const };
const tdStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle' };
