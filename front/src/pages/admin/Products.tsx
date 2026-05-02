import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Edit3, Boxes, Search, Filter, X, Barcode } from 'lucide-react';
import { Modal, Button, TextInput, NumberInput, Select, MultiSelect, Textarea, Group, ActionIcon, Tooltip, Switch, Badge, Text, Stack, Box, Title, Card, Transition } from '@mantine/core';
import FileUploader from '../../components/FileUploader';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
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
  barcode?: string;
  isBundle?: boolean;
  bundleItems?: any[];
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [stockFilter, setStockFilter] = useState<string | null>('all');

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = !p.trackStock || p.stock > 0;
    if (stockFilter === 'out_of_stock') matchesStock = p.trackStock && p.stock <= 0;
    if (stockFilter === 'low_stock') matchesStock = p.trackStock && p.stock > 0 && p.stock <= 10;

    return matchesSearch && matchesCategory && matchesStock;
  });

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
      <Group justify="space-between" mb="2rem">
        <div>
          <Title order={1} style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>Gestión de Productos</Title>
          <Text color="dimmed" mt={4} size="sm">
            Administra tu catálogo {storeInfo?.hasStockControl ? 'con control de stock activo' : ''}.
          </Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          onClick={() => setShowAddForm(true)} 
          size="md" 
          radius="md"
          variant="filled"
          color="blue"
          style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
        >
          Nuevo Producto
        </Button>
      </Group>

      <Card withBorder radius="md" p="md" mb="xl" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}>
        <Group align="flex-end" gap="md">
          <TextInput
            placeholder="Buscar por nombre o descripción..."
            label="Buscar producto"
            leftSection={<Search size={16} color="#94a3b8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
            radius="md"
            rightSection={searchQuery && (
              <ActionIcon variant="transparent" onClick={() => setSearchQuery('')}>
                <X size={14} color="#94a3b8" />
              </ActionIcon>
            )}
          />
          <Select
            label="Categoría"
            placeholder="Todas"
            leftSection={<Filter size={16} color="#94a3b8" />}
            data={[
              { value: 'all', label: 'Todas las categorías' },
              ...categories
                .filter(c => !c.parentId)
                .flatMap(parent => [
                  { value: parent.id, label: parent.name },
                  ...categories
                    .filter(child => child.parentId === parent.id)
                    .map(child => ({ value: child.id, label: `↳ ${child.name}` }))
                ])
            ]}
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            radius="md"
            style={{ minWidth: '220px' }}
            searchable
          />
          <Select
            label="Disponibilidad"
            placeholder="Todos"
            leftSection={<Boxes size={16} color="#94a3b8" />}
            data={[
              { value: 'all', label: 'Todos' },
              { value: 'in_stock', label: 'Con Stock' },
              { value: 'out_of_stock', label: 'Sin Stock' },
              { value: 'low_stock', label: 'Stock Bajo (≤10)' },
            ]}
            value={stockFilter}
            onChange={(val) => setStockFilter(val)}
            radius="md"
            style={{ minWidth: '180px' }}
          />
          {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all') && (
            <Button variant="light" color="gray" radius="md" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStockFilter('all'); }}>
              Limpiar
            </Button>
          )}
        </Group>
      </Card>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>Vista</th>
              <th style={thStyle}>Nombre</th>
              {storeInfo?.hasStockControl && <th style={thStyle}>Stock</th>}
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Precio</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <tr key={p.id} className="product-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  <td style={tdStyle}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} color="#94a3b8" />}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Text fw={700} size="sm" color="#1e293b">{p.name}</Text>
                        {p.isBundle && <Badge color="green" size="xs" variant="filled">PROMO</Badge>}
                      </Group>
                      {p.description && <Text size="xs" color="dimmed" lineClamp={1} style={{ maxWidth: '300px' }}>{p.description}</Text>}
                      {p.barcode && <Group gap="xs"><Barcode size={12} color="#94a3b8" /><Text size="xs" color="dimmed">{p.barcode}</Text></Group>}
                    </Stack>
                  </td>
                  {storeInfo?.hasStockControl && (
                    <td style={tdStyle}>
                      {p.trackStock ? (
                        <Badge 
                          variant="dot" 
                          color={p.stock > 10 ? 'green' : p.stock > 0 ? 'orange' : 'red'}
                          size="md"
                        >
                          {p.stock} unidades
                        </Badge>
                      ) : (
                        <Badge variant="dot" color="gray" size="md">Ilimitado</Badge>
                      )}
                    </td>
                  )}
                  <td style={tdStyle}>
                    <Badge variant="light" color="blue" radius="md">{p.category?.name || 'Sin Categoría'}</Badge>
                  </td>
                  <td style={{ ...tdStyle, color: '#0f172a', fontWeight: 800, fontSize: '1rem' }}>${p.price.toFixed(2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Group justify="flex-end" gap="xs">
                      <Tooltip label="Editar">
                        <ActionIcon variant="subtle" color="blue" radius="md" size="lg" onClick={() => setEditingProduct(p)}><Edit3 size={18} /></ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <ActionIcon variant="subtle" color="red" radius="md" size="lg" onClick={() => handleDelete(p.id)}><Trash2 size={18} /></ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                  <Stack align="center" gap="sm">
                    <Boxes size={48} color="#cbd5e1" strokeWidth={1.5} />
                    <Text fw={600} color="dimmed">No se encontraron productos</Text>
                    <Text size="sm" color="dimmed">Prueba ajustando los filtros o creando uno nuevo.</Text>
                  </Stack>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal 
        opened={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handleAddProduct}
        categories={categories} modifiers={modifiers} products={products} storeInfo={storeInfo} title="Subir Producto"
      />

      <ProductFormModal 
        opened={!!editingProduct} onClose={() => setEditingProduct(null)} onSubmit={handleUpdateProduct}
        categories={categories} modifiers={modifiers} products={products} product={editingProduct} storeInfo={storeInfo} title="Modificar Producto"
      />
    </div>
  );
}

function ProductFormModal({ opened, onClose, onSubmit, categories, modifiers, products, product, storeInfo, title }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [trackStock, setTrackStock] = useState(false);
  const [stock, setStock] = useState<number | string>(0);
  const [barcode, setBarcode] = useState('');
  const [isBundle, setIsBundle] = useState(false);
  const [bundleItems, setBundleItems] = useState<{ productId: string, quantity: number }[]>([]);

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
      setBarcode(product.barcode || '');
      setIsBundle(product.isBundle || false);
      setBundleItems(product.bundleItems?.map((bi: any) => ({ productId: bi.productId, quantity: bi.quantity })) || []);
    } else {
      setName('');
      setPrice(0);
      setDescription('');
      setImageUrl('');
      setCategoryId(null);
      setModifierGroupIds([]);
      setTrackStock(false);
      setStock(0);
      setBarcode('');
      setIsBundle(false);
      setBundleItems([]);
    }
  }, [product, opened]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={800} size="xl">{title}</Text>} 
      radius="lg" 
      size="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="lg" p="xs">
        <Group grow align="flex-start">
          <TextInput 
            label="Nombre del Producto" 
            description="Escribe un nombre llamativo para el menú"
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="Ej: Hamburguesa con Queso" 
            radius="md"
          />
          <TextInput 
            label="Código de Barras" 
            description="Opcional. Para el escáner del mostrador"
            value={barcode} 
            onChange={e => setBarcode(e.target.value)} 
            placeholder="Ej: 7791234567890" 
            radius="md"
            leftSection={<Barcode size={16} />}
          />
        </Group>
        
        <Group grow align="flex-start">
          <NumberInput 
            label="Precio de Venta" 
            value={price} 
            onChange={val => setPrice(val)} 
            prefix="$" 
            decimalScale={2} 
            required 
            radius="md"
            hideControls
          />
          <Select 
            label="Categoría" 
            placeholder="Seleccionar..."
            data={categories
              .filter((c: any) => !c.parentId)
              .flatMap((parent: any) => [
                { value: parent.id, label: parent.name },
                ...categories
                  .filter((child: any) => child.parentId === parent.id)
                  .map((child: any) => ({ value: child.id, label: `↳ ${child.name}` }))
              ])
            } 
            value={categoryId} 
            onChange={(val) => setCategoryId(val)} 
            clearable 
            radius="md"
            searchable
          />
        </Group>

        <Box>
          <Text fw={500} size="sm" mb={4}>Imagen del Producto</Text>
          <Box p="md" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
             <FileUploader 
               label="" 
               defaultValue={imageUrl} 
               onUploadSuccess={setImageUrl} 
             />
          </Box>
        </Box>

        {storeInfo?.hasModifiers && modifiers?.length > 0 && (
          <MultiSelect
            label="Aderezos y Personalizaciones"
            description="Grupos de opciones que el cliente puede elegir"
            placeholder="Seleccionar grupos"
            data={modifiers.map((m: any) => ({ value: m.id, label: m.name }))}
            value={modifierGroupIds}
            onChange={(val) => setModifierGroupIds(val)}
            searchable
            clearable
            radius="md"
          />
        )}
        
        {storeInfo?.hasStockControl && (
          <Box p="md" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Stack gap={0}>
                <Text fw={700} size="sm">Control de Inventario</Text>
                <Text size="xs" color="dimmed">Activa para gestionar unidades disponibles</Text>
              </Stack>
              <Switch 
                checked={trackStock} 
                onChange={(e) => setTrackStock(e.currentTarget.checked)} 
                color="blue"
              />
            </Group>
            {trackStock && (
              <Transition mounted={trackStock} transition="fade" duration={200}>
                {(styles) => (
                  <div style={styles}>
                    <NumberInput 
                      label="Cantidad Inicial" 
                      value={stock} 
                      onChange={val => setStock(val)} 
                      min={0} 
                      radius="md"
                    />
                  </div>
                )}
              </Transition>
            )}
          </Box>
        )}

        {/* Sección de Promo / Combo */}
        <Box p="md" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Group justify="space-between" mb="xs">
            <Stack gap={0}>
              <Text fw={700} size="sm">Es una Promo / Combo</Text>
              <Text size="xs" color="dimmed">Compone este producto con otros de tu lista</Text>
            </Stack>
            <Switch 
              checked={isBundle} 
              onChange={(e) => setIsBundle(e.currentTarget.checked)} 
              color="green"
            />
          </Group>
          {isBundle && (
            <Stack gap="sm" mt="md">
              {bundleItems.map((item, index) => (
                <Group key={index} grow align="flex-end">
                  <Select
                    label="Producto Componente"
                    placeholder="Elegir..."
                    data={products
                      .filter((p: any) => p.id !== product?.id && !p.isBundle)
                      .map((p: any) => ({ 
                        value: p.id, 
                        label: p.name,
                        group: p.category?.name || 'Sin Categoría'
                      }))}
                    value={item.productId}
                    onChange={(val) => {
                      const newItems = [...bundleItems];
                      newItems[index].productId = val || '';
                      setBundleItems(newItems);
                    }}
                    radius="md"
                    searchable
                  />
                  <NumberInput
                    label="Cantidad"
                    value={item.quantity}
                    onChange={(val) => {
                      const newItems = [...bundleItems];
                      newItems[index].quantity = Number(val) || 1;
                      setBundleItems(newItems);
                    }}
                    min={1}
                    radius="md"
                    style={{ maxWidth: '100px' }}
                  />
                  <ActionIcon color="red" variant="subtle" onClick={() => setBundleItems(bundleItems.filter((_, i) => i !== index))}>
                    <Trash2 size={18} />
                  </ActionIcon>
                </Group>
              ))}
              <Button 
                variant="light" 
                color="green" 
                size="xs" 
                leftSection={<Plus size={14} />}
                onClick={() => setBundleItems([...bundleItems, { productId: '', quantity: 1 }])}
              >
                Agregar Producto a la Promo
              </Button>
            </Stack>
          )}
        </Box>

        <Textarea 
          label="Descripción (Opcional)" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Ingredientes, detalles de preparación..." 
          minRows={3} 
          radius="md"
        />

        <Group justify="flex-end" mt="xl" gap="sm">
          <Button variant="subtle" color="gray" onClick={onClose} radius="md">Cancelar</Button>
          <Button 
            size="md" 
            radius="md" 
            onClick={() => onSubmit({ name, price, description, imageUrl, categoryId, modifierGroupIds, trackStock, stock, barcode, isBundle, bundleItems })}
            style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
          >
            {product ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

const thStyle = { padding: '1.25rem 1.5rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' as const, textAlign: 'left' as const };
const tdStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle' };
