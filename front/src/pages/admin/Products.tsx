import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Edit3, Boxes, AlertCircle } from 'lucide-react';
import { Modal, Button, TextInput, NumberInput, Select, MultiSelect, Textarea, Group, ActionIcon, Tooltip, Switch, Badge, Text, Stack, Box, Title } from '@mantine/core';
import FileUploader from '../../components/FileUploader';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  category?: Category;
  trackStock: boolean;
  stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<{ hasStockControl: boolean, hasModifiers: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, storeRes, modRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories'),
        api.get('/stores/my-store'),
        api.get('/modifiers').catch(() => []) // Catching in case it fails or unsupported
      ]);
      
      setProducts(prodRes);
      setCategories(catRes);
      setStoreInfo(storeRes);
      setModifiers(modRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async (values: any) => {
    try {
      await api.post('/admin/products', values);
      setShowAddForm(false);
      fetchData();
      Swal.fire({ title: '¡Creado!', text: 'El producto se agregó correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleUpdateProduct = async (values: any) => {
    if (!editingProduct) return;
    try {
      await api.patch(`/admin/products/${editingProduct.id}`, values);
      setEditingProduct(null);
      fetchData();
      Swal.fire({ title: '¡Actualizado!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Eliminarás este producto permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchData();
        Swal.fire('Borrado', 'El producto ha sido eliminado.', 'success');
      } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
      }
    }
  };

  if (loading) return <div className="loader-container">Cargando inventario...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={1}>Gestión de Productos</Title>
          <Text color="dimmed" mt={4}>
            Administra tu catálogo {storeInfo?.hasStockControl ? 'con control de stock activo' : ''}.
          </Text>
        </div>
        <Button leftSection={<Plus size={18} />} onClick={() => setShowAddForm(true)} size="md" radius="md">
          Nuevo Producto
        </Button>
      </Group>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>Vista</th>
              <th style={thStyle}>Nombre</th>
              {storeInfo?.hasStockControl && <th style={thStyle}>Stock</th>}
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Precio</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                    {p.imageUrl ? <img src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={18} color="#94a3b8" />}
                  </div>
                </td>
                <td style={tdStyle}>
                  <Text fw={700}>{p.name}</Text>
                </td>
                {storeInfo?.hasStockControl && (
                  <td style={tdStyle}>
                    {p.trackStock ? (
                      <Badge 
                        variant="light" 
                        color={p.stock > 10 ? 'green' : p.stock > 0 ? 'orange' : 'red'}
                        leftSection={p.stock > 0 ? <Boxes size={12} /> : <AlertCircle size={12} />}
                      >
                        {p.stock} Unid.
                      </Badge>
                    ) : (
                      <Text size="xs" color="dimmed">Ilimitado</Text>
                    )}
                  </td>
                )}
                <td style={tdStyle}>
                  <Badge variant="outline" color="gray" radius="sm">{p.category?.name || 'Gral'}</Badge>
                </td>
                <td style={{ ...tdStyle, color: '#0ea5e9', fontWeight: 800 }}>${p.price.toFixed(2)}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <Group justify="center" gap="xs">
                    <Tooltip label="Editar">
                      <ActionIcon variant="light" color="blue" onClick={() => setEditingProduct(p)}><Edit3 size={18} /></ActionIcon>
                    </Tooltip>
                    <Tooltip label="Borrar">
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(p.id)}><Trash2 size={18} /></ActionIcon>
                    </Tooltip>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormModal 
        opened={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handleAddProduct}
        categories={categories} modifiers={modifiers} storeInfo={storeInfo} title="Subir Producto"
      />

      <ProductFormModal 
        opened={!!editingProduct} onClose={() => setEditingProduct(null)} onSubmit={handleUpdateProduct}
        categories={categories} modifiers={modifiers} product={editingProduct} storeInfo={storeInfo} title="Modificar Producto"
      />
    </div>
  );
}

function ProductFormModal({ opened, onClose, onSubmit, categories, modifiers, product, storeInfo, title }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [trackStock, setTrackStock] = useState(false);
  const [stock, setStock] = useState<number | string>(0);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price || 0);
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setCategoryId(product.categoryId || null);
      setModifierGroupIds(product.modifierGroups ? product.modifierGroups.map((mg: any) => mg.modifierGroupId) : []);
      setTrackStock(product.trackStock || false);
      setStock(product.stock || 0);
    } else {
      setName('');
      setPrice(0);
      setDescription('');
      setImageUrl('');
      setCategoryId(null);
      setModifierGroupIds([]);
      setTrackStock(false);
      setStock(0);
    }
  }, [product, opened]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} radius="md" size="lg">
      <Stack gap="md">
        <TextInput label="Nombre" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre del producto" />
        
        <Group grow>
          <NumberInput label="Precio" value={price} onChange={val => setPrice(val)} prefix="$" decimalScale={2} required />
          <Select label="Categoría" data={categories.map((c: any) => ({ value: c.id, label: c.name }))} value={categoryId} onChange={setCategoryId} clearable />
        </Group>

        <Box p="md" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
           <FileUploader 
             label="Imagen del Producto" 
             defaultValue={imageUrl} 
             onUploadSuccess={setImageUrl} 
           />
        </Box>

        {storeInfo?.hasModifiers && modifiers?.length > 0 && (
          <MultiSelect
            label="Aderezos y Personalizaciones"
            placeholder="Seleccionar grupos (opcional)"
            data={modifiers.map((m: any) => ({ value: m.id, label: m.name }))}
            value={modifierGroupIds}
            onChange={setModifierGroupIds}
            searchable
            clearable
          />
        )}
        
        {storeInfo?.hasStockControl && (
          <Box p="md" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} size="sm">Inventario</Text>
              <Switch checked={trackStock} onChange={(e) => setTrackStock(e.currentTarget.checked)} label="Rastrear Stock" />
            </Group>
            {trackStock && (
              <NumberInput label="Cantidad Disponible" value={stock} onChange={val => setStock(val)} min={0} />
            )}
          </Box>
        )}

        <Textarea label="Descripción" value={description} onChange={e => setDescription(e.target.value)} placeholder="..." minRows={3} />

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSubmit({ name, price, description, imageUrl, categoryId, modifierGroupIds, trackStock, stock })}>
            {product ? 'Actualizar' : 'Guardar Producto'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

const thStyle = { padding: '1.25rem 1.5rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' as const, textAlign: 'left' as const };
const tdStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle' };
