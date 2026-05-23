import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { 
  ShoppingCart,
  Package, 
  Trash2, 
  Wifi,
  CreditCard
} from 'lucide-react';
import InstagramPng from '../assets/instagram.png';
import WhatsAppPng from '../assets/whatsapp.png';
import UbicacionPng from '../assets/ubicacion.png';
import { 
  Title, 
  Text, 
  Container, 
  SimpleGrid, 
  Card, 
  Image, 
  Badge, 
  Button, 
  Group, 
  Center, 
  Loader,
  Box,
  Stack,
  Divider,
  Transition,
  Drawer,
  NumberInput,
  ScrollArea,
  ActionIcon,
  Modal,
  Textarea,
  Checkbox,
  Radio,
  Paper,
  TextInput
} from '@mantine/core';
import { socket } from '../utils/socket';
import { cn } from '../lib/cn';
import StoreThemeRoot from '../components/StoreThemeRoot';
import { themeFromStore } from '../lib/storeTheme';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: ModifierOption[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  trackStock: boolean;
  stock: number;
  modifierGroups?: {
    modifierGroup: ModifierGroup;
  }[];
  isBundle?: boolean;
  notes?: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
  observations?: string;
  selectedModifiers: {
    groupId: string;
    groupName: string;
    options: ModifierOption[];
  }[];
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  cardStyle: string;
  heroStyle: string;
  hasStockControl: boolean;
  hasPayments: boolean;
  hasCart: boolean;
  isCatalogOnly: boolean;
  hasModifiers: boolean;
  hasWhatsAppOrders: boolean;
  showObservations: boolean;
  heroImageUrl: string | null;
  fontFamily: string;
  logoUrl: string | null;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  businessHours?: string | null;
  hasConnectivity: boolean;
  hasOrderManagement: boolean;
  wifiSSID?: string | null;
  wifiPassword?: string | null;
  mercadoPagoAccessToken?: string | null;
  allowCatalogPayments?: boolean;
  products: Product[];
  categories: Category[];
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Icon components replaced by PNG assets in Catalog.tsx

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const CategoryButton = ({ active, children, onClick, id }: any) => (
  <Button 
    id={id}
    data-active={active}
    variant={active ? 'filled' : 'light'} 
    color={active ? 'var(--primary-color)' : 'gray'}
    radius="xl"
    onClick={onClick}
    className={cn(
      'shrink-0 transition-all duration-300',
      active ? 'scale-105 shadow-md' : 'scale-100 shadow-none',
    )}
  >
    {children}
  </Button>
);

export default function Catalog() {
  const { slug } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpened, setCartOpened] = useState(false);
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const footerTextColor = useMemo(() => {
    const color = store?.primaryColor || '#0ea5e9';
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return yiq >= 128 ? '#1e293b' : '#ffffff';
    }
    return '#ffffff';
  }, [store?.primaryColor]);
  
  // Customer Identity
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'WHATSAPP' | 'MP'>('WHATSAPP');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('siit_customer_name');
    if (savedName) setCustomerName(savedName);
  }, []);

  // Auto scroll el navbar para mostrar la categoria activa
  useEffect(() => {
    if (navRef.current) {
      const activeButton = navRef.current.querySelector('[data-active="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  // Historial para el botón atrás del celular
  useEffect(() => {
    const handlePopState = () => {
      if (cartOpened) {
        setCartOpened(false);
        // Evitar que el navegador retroceda de página realmente
        window.history.pushState(null, '', window.location.pathname);
      }
      if (addingProduct) {
        setAddingProduct(null);
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cartOpened, addingProduct]);

  // Cuando abrimos algo, avisamos al historial
  useEffect(() => {
    if (cartOpened || addingProduct) {
      window.history.pushState({ opened: true }, '');
    }
  }, [cartOpened, !!addingProduct]);


  // Agrupar productos por categoría con filtrado jerárquico
  const groupedProducts = useMemo(() => {
    if (!store) return [];
    
    // Base de categorías con sus productos
    const catsWithProducts = store.categories.map(cat => ({
      ...cat,
      products: store.products.filter(p => p.categoryId === cat.id)
    })).filter(cat => cat.products.length > 0);

    // Agregar Categoría Virtual de Promos al principio si existen
    const bundleProducts = store.products.filter(p => p.isBundle);
    const bundlesCategory = bundleProducts.length > 0 ? [{
      id: 'promos-virtual-cat',
      name: '🔥 Promociones',
      slug: 'promociones',
      products: bundleProducts
    }] : [];

    if (selectedCategory === 'all') {
      // Vista de "Todos": Orden jerárquico tradicional + Promos arriba
      const orderedCats = store.categories
        .filter(c => !c.parentId)
        .flatMap(parent => [
          parent,
          ...store.categories.filter(child => child.parentId === parent.id)
        ]);

      const mainGroups = orderedCats
        .map(cat => catsWithProducts.find(cp => cp.id === cat.id))
        .filter(Boolean) as any[];

      return [...bundlesCategory, ...mainGroups];
    }

    // Caso especial: Seleccionó la categoría virtual de Promos
    if (selectedCategory === 'promos-virtual-cat') {
      return bundlesCategory;
    }

    // Vista filtrada: Determinar qué mostrar
    const selectedCat = store.categories.find(c => c.id === selectedCategory);
    if (!selectedCat) return [];

    let targetIds: string[] = [];
    if (!selectedCat.parentId) {
      // Si seleccionó un PADRE, mostramos el padre + sus hijos
      targetIds = [
        selectedCat.id,
        ...store.categories.filter(child => child.parentId === selectedCat.id).map(child => child.id)
      ];
    } else {
      // Si seleccionó un HIJO, solo mostramos ese hijo
      targetIds = [selectedCat.id];
    }

    // Devolver solo los grupos que coincidan con la selección, manteniendo el orden jerárquico
    return catsWithProducts.filter(group => targetIds.includes(group.id));
  }, [store, selectedCategory]);



  // Categorías principales (Padres) que tienen contenido
  const parentCategories = useMemo(() => {
    if (!store) return [];
    
    const baseParents = store.categories.filter(c => !c.parentId && (
      store.products.some(p => p.categoryId === c.id) ||
      store.categories.some(child => child.parentId === c.id && store.products.some(p => p.categoryId === child.id))
    ));

    // Si hay promos, agregamos el botón virtual al inicio
    if (store.products.some(p => p.isBundle)) {
      return [
        { id: 'promos-virtual-cat', name: 'Promos', slug: 'promociones' },
        ...baseParents
      ];
    }

    return baseParents;
  }, [store]);

  // Subcategorías de la categoría actualmente activa (si es padre) o de su padre (si es hijo)
  const currentSubCategories = useMemo(() => {
    if (!store || activeTab === 'all') return [];
    
    const activeCat = store.categories.find(c => c.id === activeTab);
    const parentId = activeCat?.parentId || activeCat?.id;
    
    if (!parentId) return [];
    
    return store.categories.filter(c => c.parentId === parentId && store.products.some(p => p.categoryId === c.id));
  }, [store, activeTab]);


  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setActiveTab(categoryId);
    
    // Siempre scrolleamos arriba al cambiar el filtro para que se vea el inicio
    window.scrollTo({ top: isMobile ? 300 : 450, behavior: 'smooth' });
  };


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setScrolled(currentScrollY > 50);

      // Solo actualizar activeTab por scroll si estamos en vista "Todos"
      if (selectedCategory !== 'all') return;

      const sections = document.querySelectorAll('.category-section');
      let currentActive = 'all';
      
      sections.forEach((section: any) => {
        const top = section.offsetTop;
        if (window.scrollY >= top - 200) {
          currentActive = section.id.replace('section-', '');
        }
      });
      setActiveTab(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCategory, store]);



  const fetchCatalog = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/stores/public/${slug}/catalog`);
      if (!res.ok) throw new Error('Tienda no encontrada');
      const data: Store = await res.json();
      
      setStore(data);
      
      // Cargar la fuente de Google Fonts dinámicamente
      if (data.fontFamily && data.fontFamily !== 'Inter') {
        const fontLink = document.createElement('link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${data.fontFamily.replace(/\s/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      // Inyectar fuente global en todo el DOM
      document.body.style.fontFamily = `"${data.fontFamily || 'Inter'}", sans-serif`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (store?.id) {
      socket.connect();
      socket.emit('joinStore', store.id);

      const handleUpdate = () => {
        // Refresco silencioso de stock y productos
        fetchCatalog(true);
      };

      socket.on('ordersUpdated', handleUpdate);

      return () => {
        socket.off('ordersUpdated', handleUpdate);
        socket.disconnect();
      };
    }
  }, [store?.id, fetchCatalog]);

  const fixUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const addToCart = (product: Product, quantity: number, observations?: string, selectedModifiers: CartItem['selectedModifiers'] = []) => {
    setCart(prev => {
      // Para modificadores, tratamos como ítem distinto si la combinación de extras es distinta
      // Pero para simplificar en esta versión, si tiene los mismos modificadores exactamente
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers)
      );

      if (existingIdx !== -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += quantity;
        return newCart;
      }
      return [...prev, { product, quantity, observations, selectedModifiers }];
    });
    setAddingProduct(null);
    setCartOpened(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSendOrder = async () => {
    if (!store) return;
    const savedName = localStorage.getItem('siit_customer_name');
    
    // Si el módulo de pedidos no está activo, enviamos directamente a WhatsApp sin guardar en BD
    if (!store.hasWhatsAppOrders) {
      let message = `*Nuevo Pedido - ${store.name}*\n\n`;
      cart.forEach(item => {
        message += `• ${item.quantity}x *${item.product.name}*\n`;
      });
      message += `\n*Por favor, confírmame el total y el tiempo de entrega.*`;
      
      const waUrl = `https://wa.me/${(store.whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      if (isMobile) {
        window.location.assign(waUrl);
      } else {
        window.open(waUrl, '_blank');
      }

      setCart([]);
      setCartOpened(false);
      return;
    }

    const nameToUse = customerName || savedName || 'Cliente';
    if (!savedName) localStorage.setItem('siit_customer_name', nameToUse);

    setIsOrdering(true);
    
    try {
      // 1. Guardar el pedido en la base de datos (Supabase) via API pública
      const orderData = {
        customerName: nameToUse,
        customerPhone: customerPhone,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceAtTime: item.product.price + item.selectedModifiers.reduce((acc, g) => acc + g.options.reduce((a, o) => a + o.price, 0), 0),
          observations: item.observations,
          selectedModifiers: item.selectedModifiers
        })),
        observations: `Pedido vía WhatsApp - ${isDelivery ? 'Envío a domicilio' : 'Retiro en el local'}${isDelivery ? ` (${customerAddress})` : ''}`,
        total: cart.reduce((acc, item) => {
          const extras = item.selectedModifiers.reduce((sum, g) => sum + g.options.reduce((s, o) => s + o.price, 0), 0);
          return acc + (item.product.price + extras) * item.quantity;
        }, 0)
      };

      await fetch(`${BASE_URL}/orders/public/${store.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      // 2. Armar y enviar el mensaje de WhatsApp
      let message = `*Nuevo Pedido - ${store.name}*\n`;
      message += `Cliente: *${nameToUse}*\n`;
      message += `Teléfono: *${customerPhone}*\n`;
      message += `Entrega: *${isDelivery ? 'Envío a domicilio' : 'Retiro en el local'}*\n`;
      if (isDelivery) message += `Dirección: *${customerAddress}*\n\n`;
      else message += `\n`;
      
      let total = 0;
      cart.forEach(item => {
        let itemPrice = item.product.price;
        let modifiersText = '';
        item.selectedModifiers.forEach(group => {
          group.options.forEach(opt => {
            itemPrice += opt.price;
            modifiersText += `  + ${opt.name} ${opt.price > 0 ? `(+$${opt.price})` : ''}\n`;
          });
        });
        const lineTotal = itemPrice * item.quantity;
        total += lineTotal;
        message += `• ${item.quantity}x *${item.product.name}*\n`;
        if (modifiersText) message += modifiersText;
        if (item.observations) message += `  _Petición: ${item.observations}_\n`;
      });
      
      message += `\n*Total: $${formatPrice(total)}*\n`;
      message += `\n_Pedido registrado en el sistema_`;

      const waUrl = `https://wa.me/${(store.whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      // En móviles, window.open suele ser bloqueado después de un fetch (contexto perdido)
      // Usamos window.location.assign para asegurar que abra la app de WhatsApp
      if (isMobile) {
        window.location.assign(waUrl);
      } else {
        window.open(waUrl, '_blank');
      }
      
      setCart([]);
      setCartOpened(false);
    } catch (e: any) {
      console.error("Error al registrar pedido:", e);
      Swal.fire('Error', `No pudimos registrar tu pedido: ${e.message}. Puedes intentar enviarlo por WhatsApp igualmente.`, 'warning')
        .then(() => {
          const fallbackUrl = `https://wa.me/${(store.whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent("Hola, quiero hacer un pedido...")}`;
          if (isMobile) window.location.assign(fallbackUrl);
          else window.open(fallbackUrl, '_blank');
        });
    } finally {
      setIsOrdering(false);
    }
  };

  const handleMercadoPagoOrder = async () => {
    if (!store) return;
    const savedName = localStorage.getItem('siit_customer_name');
    
    // Si faltan datos clave, abrimos el modal de checkout de Mercado Pago
    if (!customerPhone || !customerEmail || (isDelivery && !customerAddress) || (!savedName && !customerName)) {
      setCartOpened(false);
      setCheckoutModalOpen(true);
      return;
    }

    const nameToUse = customerName || savedName || 'Cliente';
    if (!savedName) localStorage.setItem('siit_customer_name', nameToUse);

    setIsOrdering(true);
    try {
      // Registrar pedido primero (pendiente de pago)
      const orderData = {
        customerName: nameToUse,
        customerPhone: customerPhone,
        origin: 'CATALOG',
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceAtTime: item.product.price + item.selectedModifiers.reduce((acc, g) => acc + g.options.reduce((a, o) => a + o.price, 0), 0),
          observations: item.observations,
          selectedModifiers: item.selectedModifiers
        })),
        observations: `Pago Online. ${isDelivery ? 'CON ENVÍO: ' + customerAddress : 'RETIRO EN LOCAL'}. Email: ${customerEmail}`,
        total: cart.reduce((acc, item) => {
          const extras = item.selectedModifiers.reduce((sum, g) => sum + g.options.reduce((s, o) => s + o.price, 0), 0);
          return acc + (item.product.price + extras) * item.quantity;
        }, 0)
      };

      const orderRes = await fetch(`${BASE_URL}/orders/public/${store.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, status: 'PENDING' })
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrar pedido');
      }
      const createdOrder = await orderRes.json();

      // Crear preferencia en MP
      const res = await fetch(`${BASE_URL}/mercado-pago/preference/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          orderId: createdOrder.id,
          items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price + item.selectedModifiers.reduce((acc, g) => acc + g.options.reduce((a, o) => a + o.price, 0), 0)
          })),
          returnUrl: window.location.href
        })
      });

      if (!res.ok) throw new Error('Error al generar link de pago');
      
      const mpData = await res.json();
      window.location.href = mpData.init_point;

    } catch (e: any) {
      console.error("Error en Mercado Pago:", e);
      Swal.fire('Error', `No pudimos generar el cobro con Mercado Pago: ${e.message}`, 'error');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleDirectOrder = (product: Product) => {
    if (!store?.whatsapp) return;
    const message = encodeURIComponent(`Hola 👋 Me interesa este producto: *${product.name}* ($${formatPrice(product.price)})`);
    window.open(`https://wa.me/${store.whatsapp}?text=${message}`, '_blank');
  };



  if (loading) return (
    <Center className="catalog-fullscreen-center">
      <Stack align="center" gap="md">
        <Loader size="xl" color="var(--primary-color)" type="bars" />
        <Text fw={700} size="lg" color="blue">Preparando catálogo...</Text>
      </Stack>
    </Center>
  );

  if (error || !store) return (
    <Center className="catalog-404-bg">
      <Stack align="center" gap="xl">
        <Box className="text-center">
            <Title order={1} size={isMobile ? 40 : 80} className="catalog-404-watermark">404</Title>
            <Title order={2}>Tienda no encontrada</Title>
        </Box>
        <Text color="dimmed" maw={400} ta="center">Lo sentimos, pero el catálogo que buscas no está disponible en este momento.</Text>
        <Button variant="light" radius="xl" onClick={() => window.location.href = '/'}>Ir al inicio</Button>
      </Stack>
    </Center>
  );



  return (
    <StoreThemeRoot theme={themeFromStore(store)} className="catalog-page min-h-screen">
      
      <Box
        component="header"
        className={cn(
          'catalog-fixed-header',
          isMobile ? 'h-[60px]' : 'h-[76px]',
          scrolled && 'catalog-fixed-header--solid',
        )}
      >
        <Container size="xl" className="catalog-header-inner">
            <Group gap="xs">
              {store.hasConnectivity && store.wifiSSID && (
                <ActionIcon 
                  variant="subtle" 
                  color={scrolled ? 'cyan' : (store.heroImageUrl ? 'white' : 'cyan')} 
                  size="lg" 
                  radius="xl"
                  onClick={() => {
                     Swal.fire({
                       title: 'Conexión WiFi',
                       html: `
                         <div style="text-align: left; padding: 10px;">
                           <p><strong>Red:</strong> ${store.wifiSSID}</p>
                           <p><strong>Contraseña:</strong> ${store.wifiPassword}</p>
                           <hr />
                           <p style="font-size: 0.8rem; color: #64748b;">Escanea para conectarte:</p>
                           <div style="display: flex; justify-content: center; margin-top: 15px;">
                             <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WIFI:S:${store.wifiSSID};T:WPA;P:${store.wifiPassword};;" />
                           </div>
                         </div>
                       `,
                       confirmButtonText: 'Cerrar',
                       confirmButtonColor: 'var(--primary-color)'
                     });
                  }}
                >
                  <Wifi size={24} />
                </ActionIcon>
              )}
              
              <Group gap="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="catalog-logo-click">
                <Box className={cn('catalog-logo-box', isMobile ? 'h-8 w-8' : 'h-[42px] w-[42px]')}>
                  {store.logoUrl ? (
                    <Image src={fixUrl(store.logoUrl)} w="100%" h="100%" />
                  ) : (
                    <Text fw={900} className="text-store-primary" size={isMobile ? 'sm' : 'xl'}>{store.name.charAt(0)}</Text>
                  )}
                </Box>
                <Title
                  order={3}
                  size={isMobile ? '1rem' : '1.2rem'}
                  className={cn(scrolled || !store.heroImageUrl ? 'text-store' : 'text-white')}
                >
                  {store.name}
                </Title>
              </Group>
            </Group>

            {store.hasCart && (
              <Button 
                variant="subtle"
                size={isMobile ? 'sm' : 'md'} 
                radius="xl" 
                className="cart-button text-store-icon"
                onClick={() => setCartOpened(true)}
              >
                  <Box className="catalog-cart-badge-wrap">
                     <ShoppingCart size={isMobile ? 24 : 28} color="var(--icon-color)" />
                     {cart.length > 0 && (
                       <Badge 
                         size="xs" 
                         circle 
                         color="var(--secondary-color)" 
                         className="catalog-cart-badge"
                       >
                         {cart.reduce((acc, item) => acc + item.quantity, 0)}
                       </Badge>
                     )}
                  </Box>
                  <Text size="sm" ml="xs" className={cn(isMobile && 'hidden', !isMobile && 'block')}>Carrito</Text>
              </Button>
            )}
        </Container>
      </Box>

      {/* Stunning Hero Section */}
      <Box
        className={cn(
          'catalog-hero-panel',
          isMobile ? 'h-[300px] pt-10' : 'h-[450px] pt-[76px]',
          store.heroImageUrl && 'catalog-hero-panel--image',
          store.heroStyle === 'curve' && !isMobile && '[clip-path:ellipse(150%_100%_at_50%_0%)]',
        )}
        style={{
          backgroundImage: store.heroImageUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${fixUrl(store.heroImageUrl)})`
            : undefined,
          opacity: Math.max(0, 1 - scrollY / 500),
        }}
      >
        <Container size="xl" className="z-10 w-full">
          <Stack gap={0} align="center" className={cn('text-center', store.heroImageUrl ? 'text-white' : 'text-slate-900')}>
              <Transition mounted={true} transition="fade" duration={1000} timingFunction="ease">
                {(styles) => (
                  <Title 
                    order={1} 
                    className={cn(
                      'font-black leading-tight',
                      isMobile ? 'text-[2.2rem]' : 'text-6xl',
                      store.heroImageUrl ? 'text-white' : 'text-store',
                    )}
                    style={styles}
                  >
                     {store.name}
                  </Title>
                )}
              </Transition>
              <Text size={isMobile ? 'md' : 'xl'} fw={500} opacity={0.9} className={cn('mt-4', store.heroImageUrl ? 'text-white' : 'text-store')}>
                 {store.description || 'Descubre lo mejor de nuestro catálogo digital diseñado exclusivamente para ti.'}
              </Text>
             

          </Stack>
        </Container>
      </Box>

      {/* Category Nav - Sticky Filter */}
      <Box
        className={cn(
          'catalog-sticky-nav',
          isMobile ? 'top-[60px]' : 'top-[76px]',
          scrolled && 'catalog-sticky-nav--shadow',
        )}
      >
        <Container size="xl">
          <Stack gap={0}>
            {/* Fila 1: Categorías Principales */}
            <Group 
              ref={navRef}
              justify={isMobile ? 'flex-start' : 'center'} 
              gap="xs" 
              py="sm"
              className="catalog-nav-scroll"
            >
              <CategoryButton 
                active={selectedCategory === 'all'} 
                onClick={() => scrollToCategory('all')}
              >
                Todos
              </CategoryButton>
              {parentCategories.map(cat => (
                <CategoryButton 
                  key={cat.id}
                  active={selectedCategory === cat.id || store.categories.find(c => c.id === selectedCategory)?.parentId === cat.id} 
                  onClick={() => scrollToCategory(cat.id)}
                >
                  {cat.name}
                </CategoryButton>
              ))}
            </Group>

            {/* Fila 2: Subcategorías (Solo si hay una categoría padre seleccionada y tiene hijos) */}
            {currentSubCategories.length > 0 && (
              <Box className="catalog-subnav-bar">
                <Group 
                  justify={isMobile ? 'flex-start' : 'center'} 
                  gap="sm" 
                  px="md"
                  className="catalog-nav-scroll"
                >
                  {currentSubCategories.map(sub => (
                    <Button
                      key={sub.id}
                      variant={selectedCategory === sub.id ? 'filled' : 'subtle'}
                      size="compact-xs"
                      radius="xl"
                      color={selectedCategory === sub.id ? 'var(--primary-color)' : 'gray'}
                      onClick={() => scrollToCategory(sub.id)}
                      className={cn(
                        'catalog-sub-pill',
                        selectedCategory === sub.id && 'catalog-sub-pill--active',
                      )}
                    >
                      {sub.name}
                    </Button>
                  ))}
                </Group>
              </Box>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Main Catalog Area */}
      <Container size="xl" py="4rem">
        {groupedProducts.length === 0 ? (
          <Center py="6rem" className="catalog-empty">
            <Title order={3}>No se encontraron productos</Title>
            <Text>Intenta con otra categoría o vuelve más tarde.</Text>
          </Center>
        ) : (
          <Stack gap="4rem">
            {groupedProducts.map(group => (
              <Box key={group.id} id={`section-${group.id}`} className="category-section catalog-section">
                <Group gap="xs" mb="xl" className="catalog-section-title">
                   {group.parentId && (
                     <Text color="dimmed" fw={500} size="sm" tt="uppercase" className="catalog-section-subtitle">
                       {store?.categories.find(c => c.id === group.parentId)?.name} › 
                     </Text>
                   )}
                   <Title order={2} className="text-[var(--text-color)]">
                     {group.name}
                   </Title>
                </Group>
                <SimpleGrid 
                  cols={store.cardStyle === 'horizontal' ? { base: 1, md: 2 } : { base: 1, sm: 2, lg: 3 }} 
                  spacing={isMobile ? "md" : "xl"}
                >
                  {group.products.map((p: any) => (
                    <RenderProductCard 
                      key={p.id} 
                      product={p} 
                      styleType={store.cardStyle} 
                      onOrder={(prod: any) => store.hasCart ? setAddingProduct(prod) : handleDirectOrder(prod)} 
                      fixUrl={fixUrl}
                      hasCart={store.hasCart}
                      isMobile={isMobile}
                    />
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </Stack>
        )}
      </Container>

      {/* Footer using Secondary Color as per user preference for closure */}
      <Box
        component="footer"
        className={cn(
          'border-t border-white/10 bg-store-primary text-store',
          isMobile ? 'py-12 pb-8' : 'py-20 pb-8',
        )}
      >
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={40} mb={isMobile ? 30 : 60}>
            <Stack gap="md" align={isMobile ? 'center' : 'flex-start'} className={cn(isMobile ? 'text-center' : 'text-left')}>
              <Title order={3} size={isMobile ? 'h3' : 'h2'} c={footerTextColor}>{store.name}</Title>
              <Text size="sm" c={footerTextColor} className={cn('leading-relaxed opacity-80', isMobile && 'max-w-[300px]')}>
                {store.description || 'Calidad y servicio excepcional para todos nuestros clientes registrados.'}
              </Text>
            </Stack>

            <Stack gap="md" align={isMobile ? 'center' : 'flex-start'} className={cn(isMobile ? 'order-2 text-center' : 'text-left')}>
              <Title order={4} size="xs" tt="uppercase" c={footerTextColor} fw={700} className="opacity-90">Encuéntranos</Title>
                <Stack gap="sm" align={isMobile ? 'center' : 'flex-start'}>
                  {store.address && (
                    <Group gap="md" justify={isMobile ? 'center' : 'flex-start'} wrap="nowrap">
                      <Image src={UbicacionPng} w={24} h={24} className={footerTextColor === '#1e293b' ? 'catalog-footer-icon-dark' : 'catalog-footer-icon-invert'} />
                      <Box 
                        component="a" 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} 
                        target="_blank" 
                        className="no-underline text-inherit"
                      >
                        <Text size="sm" c={footerTextColor} fw={500} className="catalog-footer-link">{store.address}</Text>
                      </Box>
                    </Group>
                  )}
                  
                  {store.whatsapp && (
                    <Group gap="md" justify={isMobile ? 'center' : 'flex-start'} wrap="nowrap">
                      <Image src={WhatsAppPng} w={24} h={24} />
                      <Box 
                        component="a" 
                        href={`https://wa.me/${store.whatsapp}`} 
                        target="_blank" 
                        className="no-underline text-inherit"
                      >
                        <Text size="sm" c={footerTextColor} fw={500}>{store.whatsapp}</Text>
                      </Box>
                    </Group>
                  )}

                  {store.instagram && (
                    <Group gap="md" justify={isMobile ? 'center' : 'flex-start'} wrap="nowrap">
                      <Image src={InstagramPng} w={24} h={24} />
                      <Box 
                        component="a" 
                        href={store.instagram.startsWith('http') ? store.instagram : `https://instagram.com/${store.instagram}`} 
                        target="_blank" 
                        className="no-underline text-inherit"
                      >
                        <Text size="sm" c={footerTextColor} fw={500}>@{store.instagram.split('?')[0].replace(/\/+$/, '').split('/').pop()}</Text>
                      </Box>
                    </Group>
                  )}
                </Stack>
             </Stack>

            <Stack gap="md" align={isMobile ? 'center' : 'flex-start'} className={cn(isMobile ? 'order-3 text-center' : 'order-4 text-left')}>
              <Title order={4} size="xs" tt="uppercase" c={footerTextColor} fw={700} className="opacity-90">Horarios</Title>
              {store.businessHours && (() => {
                const hours = JSON.parse(store.businessHours);
                const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
                const firstDay = hours[weekDays[0]];
                const allSame = weekDays.every(day => 
                  hours[day].isOpen === firstDay.isOpen && 
                  hours[day].open === firstDay.open && 
                  hours[day].close === firstDay.close
                );

                const renderRow = (label: string, config: any) => (
                  <Group key={label} justify="space-between" wrap="nowrap" className="mb-1.5 w-full">
                    <Group gap="xs">
                       <Box className="preview-footer-dot" />
                       <Text size="xs" fw={700} c={footerTextColor} className="min-w-[70px]">{label}:</Text>
                    </Group>
                    <Text size="xs" c={footerTextColor} className="opacity-80" fs={config.isOpen ? "normal" : "italic"}>
                      {config.isOpen ? `${config.open} - ${config.close}` : 'Cerrado'}
                    </Text>
                  </Group>
                );

                if (allSame) {
                  return (
                    <Stack gap={2} mt="sm" className={cn('w-full max-w-[280px]', isMobile && 'mx-auto')}>
                      {renderRow('Lunes a Viernes', firstDay)}
                      {renderRow('Sábado', hours['Sábado'])}
                      {renderRow('Domingo', hours['Domingo'])}
                    </Stack>
                  );
                }

                // Si no todos son iguales, usar diseño de dos columnas para escritorio
                return (
                  <Box mt="sm" className={cn('w-full', isMobile ? 'mx-auto max-w-[280px]' : 'max-w-[500px]')}>
                    <SimpleGrid cols={isMobile ? 1 : 2} spacing={isMobile ? "xs" : "xl"} verticalSpacing={0}>
                      {Object.entries(hours).map(([day, config]: [any, any]) => renderRow(day, config))}
                    </SimpleGrid>
                  </Box>
                );
              })()}
            </Stack>
          </SimpleGrid>
          
          <Divider color="gray.8" mb="xl" />
          <Center>
            <Stack gap={4} align="center">
              <Text size="xs" color="gray.6">© {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</Text>
            </Stack>
          </Center>
        </Container>
      </Box>

      {/* Drawer del Carrito */}
      <Drawer
        opened={cartOpened}
        onClose={() => setCartOpened(false)}
        title={
          <Group justify="space-between" className="w-full pr-4">
            <Title order={3}>Tu Pedido</Title>
            <Button variant="subtle" size="xs" radius="xl" onClick={() => setCartOpened(false)}>
              Seguir Comprando
            </Button>
          </Group>
        }
        position={isMobile ? 'bottom' : 'right'}
        size={isMobile ? '100%' : 'md'}
        padding="xl"
        zIndex={3000}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        styles={{ 
          header: { 
            borderBottom: '1px solid #eee', 
            marginBottom: '1rem',
            backgroundColor: '#fff',
            zIndex: 3001
          },
          content: {
            backgroundColor: '#fff'
          }
        }}
      >
        {cart.length === 0 ? (
          <Center className="flex h-[70vh] flex-col gap-6 text-center">
            <Box className="flex h-[120px] w-[120px] animate-pulse items-center justify-center rounded-full bg-slate-100">
              <ShoppingCart size={48} color="#94a3b8" />
            </Box>
            <div>
              <Title order={3} c="gray.8">Tu carrito está vacío</Title>
              <Text size="sm" color="dimmed" mt={4}>¡Parece que aún no has elegido nada!</Text>
            </div>
            <Button 
              variant="filled" 
              radius="xl" 
              size="md" 
              color="var(--primary-color)"
              onClick={() => setCartOpened(false)}
            >
              Volver al Catálogo
            </Button>
          </Center>
        ) : (
          <Box className={cn(
            'relative -mt-4 flex flex-col',
            isMobile ? 'h-[calc(100svh-100px)]' : 'h-[calc(100vh-100px)]',
          )}>
            <ScrollArea className="flex-1" h="100%" offsetScrollbars scrollHideDelay={0}>
               <Stack gap="md" pt="3.5rem" pb="2rem" px="xs">
                 {cart.map((item, idx) => (
                   <Paper 
                     key={idx} 
                     withBorder 
                     radius="lg" 
                     p="md" 
                     shadow="xs"
                     className="border-slate-100 transition-transform duration-200"
                   >
                     <Group align="flex-start" gap="md" wrap="nowrap">
                       {/* Imagen del Producto */}
                       <Image 
                         src={item.product.imageUrl ? fixUrl(item.product.imageUrl) : null} 
                         fallbackSrc="https://placehold.co/100x100?text=Producto"
                         w={70} 
                         h={70} 
                         radius="md" 
                         className="shrink-0 object-cover"
                       />

                       {/* Información Principal */}
                       <Box className="min-w-0 flex-1">
                         <Text fw={700} size="sm" className="line-clamp-1">
                           {item.product.name}
                         </Text>
                         <Text size="xs" color="dimmed" mb={4}>$ {formatPrice(item.product.price)} c/u</Text>
                         
                         {/* Modificadores */}
                         {item.selectedModifiers.length > 0 && (
                           <Stack gap={2} mt={4}>
                             {item.selectedModifiers.map(group => (
                               <Group key={group.groupId} gap={4} wrap="wrap">
                                 {group.options.map(opt => (
                                   <Badge 
                                     key={opt.id} 
                                     variant="light" 
                                     size="xs" 
                                     color="var(--secondary-color)" 
                                     className="h-[18px] border border-black/5 normal-case"
                                   >
                                     +{opt.name}
                                   </Badge>
                                 ))}
                               </Group>
                             ))}
                           </Stack>
                         )}

                         {item.observations && (
                           <Text size="xs" fs="italic" color="blue.6" mt={4} className="border-l-2 border-blue-500 pl-1.5">
                             "{item.observations}"
                           </Text>
                         )}
                       </Box>

                       {/* Eliminar (Arriba derecha dentro de la card) */}
                       <ActionIcon 
                         variant="subtle" 
                         color="red.4" 
                         radius="md"
                         size="sm"
                         onClick={() => removeFromCart(idx)}
                       >
                         <Trash2 size={16} />
                       </ActionIcon>
                     </Group>

                     <Divider my="sm" color="#f8fafc" />

                     {/* Fila Inferior: Controles y Total por ítem */}
                     <Group justify="space-between" align="center">
                       <Group gap={4} className="rounded-full border border-slate-100 bg-slate-50 p-0.5">
                         <ActionIcon 
                           variant="filled" 
                           color="white" 
                           size="sm" 
                           radius="xl" 
                           onClick={() => updateQuantity(idx, -1)}
                           className="text-slate-500 shadow-sm"
                         >
                           <Text size="xs" fw={900}>-</Text>
                         </ActionIcon>
                         <Text size="sm" fw={800} className="min-w-6 text-center text-slate-900">
                           {item.quantity}
                         </Text>
                         <ActionIcon 
                           variant="filled" 
                           color="white" 
                           size="sm" 
                           radius="xl" 
                           onClick={() => updateQuantity(idx, 1)}
                           className="text-slate-500 shadow-sm"
                         >
                           <Text size="xs" fw={900}>+</Text>
                         </ActionIcon>
                       </Group>

                       <Text fw={800} size="md" color="blue.8">
                         $ {formatPrice((item.product.price + item.selectedModifiers.reduce((acc, g) => acc + g.options.reduce((a, o) => a + o.price, 0), 0)) * item.quantity)}
                       </Text>
                     </Group>
                   </Paper>
                 ))}
               </Stack>
            </ScrollArea>
            
            {/* Footer fijo del carrito - siempre visible al final del drawer */}
            <Box py="xl" px="md" className="catalog-cart-drawer-footer">
               <Group justify="space-between" mb="xs">
                 <Text fw={700}>Total a Pagar:</Text>
                 <Text fw={900} size="xl" className="text-store-primary">
                   $ {formatPrice(cart.reduce((acc, item) => {
                      const basePrice = item.product.price;
                      const extrasPrice = item.selectedModifiers.reduce((sum, g) => sum + g.options.reduce((s, o) => s + o.price, 0), 0);
                      return acc + (basePrice + extrasPrice) * item.quantity;
                    }, 0))}
                 </Text>
               </Group>
               <Button 
                fullWidth 
                size="lg" 
                radius="xl" 
                color="green" 
                leftSection={<Image src={WhatsAppPng} w={18} h={18} />}
                onClick={() => {
                  setCartOpened(false);
                  setCheckoutMethod('WHATSAPP');
                  setCheckoutModalOpen(true);
                }}
                loading={isOrdering}
               >
                 Enviar Pedido por WhatsApp
               </Button>
               {store.mercadoPagoAccessToken && store.allowCatalogPayments !== false && (
                 <Button 
                  fullWidth 
                  size="lg" 
                  radius="xl" 
                  color="blue" 
                  mt="sm"
                  variant="light"
                  leftSection={<CreditCard size={18} />}
                  onClick={() => {
                    setCartOpened(false);
                    setCheckoutMethod('MP');
                    setCheckoutModalOpen(true);
                  }}
                  loading={isOrdering}
                 >
                   Pagar online con Mercado Pago
                 </Button>
               )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Modal para pedir datos de contacto para Mercado Pago */}
      <Modal 
        opened={checkoutModalOpen} 
        onClose={() => setCheckoutModalOpen(false)} 
        title="Completa tus datos de envío y pago" 
        centered
        radius="lg"
        padding="xl"
        zIndex={1000}
      >
        <Stack gap="md">
          <Text size="sm" color="dimmed">Por favor, completa tus datos para procesar el pago y envío correctamente.</Text>
          <TextInput 
            label="Tu nombre" 
            placeholder="Tu nombre completo" 
            size="md"
            radius="md"
            value={customerName}
            onChange={(e) => setCustomerName(e.currentTarget.value)}
            required
          />
          <TextInput 
            label="Número de Teléfono" 
            placeholder="Ej: 1123456789" 
            size="md"
            radius="md"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.currentTarget.value)}
            required
            maxLength={15}
          />
          <TextInput 
            label="Correo Electrónico" 
            placeholder="correo@ejemplo.com" 
            size="md"
            radius="md"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.currentTarget.value)}
            required
          />
          
          <Divider label="Tipo de Entrega" labelPosition="center" my="xs" />
          
          <Radio.Group
            value={isDelivery ? 'delivery' : 'pickup'}
            onChange={(val) => setIsDelivery(val === 'delivery')}
          >
            <Group mt="xs">
              <Radio value="pickup" label="Retiro en el local" />
              <Radio value="delivery" label="Envío a domicilio" />
            </Group>
          </Radio.Group>

          {isDelivery && (
            <TextInput 
              label="Dirección de Envío" 
              placeholder="Calle, número, piso o aclaraciones" 
              size="md"
              radius="md"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.currentTarget.value)}
              required
            />
          )}

          <Button 
            fullWidth 
            size="md" 
            radius="md" 
            mt="md"
            color={checkoutMethod === 'WHATSAPP' ? 'green' : 'blue'}
            loading={isOrdering}
            onClick={async () => {
              if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
                Swal.fire('Error', 'Por favor completa todos los campos requeridos.', 'error');
                return;
              }

              // Validación de Email
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(customerEmail)) {
                Swal.fire('Error', 'Por favor ingresa un correo electrónico válido.', 'error');
                return;
              }

              // Validación de Teléfono (entre 8 y 15 dígitos)
              const phoneDigits = customerPhone.replace(/\D/g, '');
              if (phoneDigits.length < 8 || phoneDigits.length > 15) {
                Swal.fire('Error', 'Por favor ingresa un número de teléfono válido (entre 8 y 15 dígitos).', 'error');
                return;
              }

              if (isDelivery && !customerAddress.trim()) {
                Swal.fire('Error', 'Por favor ingresa la dirección de envío.', 'error');
                return;
              }
              localStorage.setItem('siit_customer_name', customerName);
              
              if (checkoutMethod === 'WHATSAPP') {
                await handleSendOrder();
              } else {
                await handleMercadoPagoOrder();
              }
              
              setCheckoutModalOpen(false);
            }}
          >
            {checkoutMethod === 'WHATSAPP' ? 'Enviar Pedido por WhatsApp' : 'Continuar a Mercado Pago'}
          </Button>
        </Stack>
      </Modal>

      {/* Modal para pedir nombre la primera vez */}
      <Modal 
        opened={showNamePrompt} 
        onClose={() => setShowNamePrompt(false)} 
        title="¿Cómo te llamas?" 
        centered
        radius="lg"
        padding="xl"
      >
        <Stack gap="md">
          <Text size="sm" color="dimmed">Para que la tienda sepa quién hace el pedido, por favor ingresa tu nombre.</Text>
          <TextInput 
            label="Tu nombre" 
            placeholder="Tu nombre completo" 
            size="md"
            radius="md"
            value={customerName}
            onChange={(e) => setCustomerName(e.currentTarget.value)}
            required
            autoFocus
          />
          <Button 
            fullWidth 
            size="md" 
            radius="md" 
            onClick={() => {
              if (customerName.trim()) {
                localStorage.setItem('siit_customer_name', customerName);
                setShowNamePrompt(false);
                handleSendOrder();
              }
            }}
          >
            Confirmar y Enviar Pedido
          </Button>
        </Stack>
      </Modal>

      {/* Product Selection Modal (SaaS Modifiers Placeholder) */}
      <ProductSelectionModal 
        product={addingProduct} 
        onClose={() => setAddingProduct(null)} 
        onAdd={addToCart}
        isMobile={isMobile}
        hasModifiers={store.hasModifiers}
        showObservations={store.showObservations}
      />

    </StoreThemeRoot>
  );
}



function RenderProductCard({ product, styleType, onOrder, fixUrl, hasCart, isMobile }: any) {
  const isOut = product.trackStock && product.stock <= 0;
  
  const getCardStyle = () => {
    const base = {
      display: (styleType === 'horizontal' ? 'flex' : 'block') as any,
      flexDirection: (styleType === 'horizontal' ? 'row' : 'column') as any,
      opacity: isOut ? 0.6 : 1,
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    };

    if (styleType === 'modern') {
      return {
        ...base,
        backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
        borderRadius: '24px',
      };
    }
    
    if (styleType === 'horizontal') {
      return {
        ...base,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
      };
    }

    // Default or Classic
    return {
      ...base,
      backgroundColor: 'var(--bg-card)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: 'var(--mantine-shadow-sm)',
      borderRadius: '12px',
    };
  };

  return (
    <Card 
      padding={0} 
      className="product-card"
      style={getCardStyle()}
    >
      <Box
        className={cn(
          'relative shrink-0 overflow-hidden',
          styleType === 'horizontal'
            ? cn(isMobile ? 'min-h-[110px] w-[110px]' : 'min-h-[180px] w-[180px]')
            : cn('w-full', isMobile ? 'h-[180px]' : 'h-[260px]'),
        )}
      >
        <img 
          src={product.imageUrl ? fixUrl(product.imageUrl) : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600'} 
          alt={product.name}
          className="block h-full w-full bg-slate-100 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Previene bucle infinito si placehold falla
            target.src = 'https://placehold.co/600x400?text=Sin+Imagen';
          }}
        />
        {isOut && (
          <Badge variant="filled" color="red" className="absolute right-2.5 top-2.5 text-[10px]">AGOTADO</Badge>
        )}
        {product.isBundle && (
          <Badge variant="filled" color="green" className="absolute left-2.5 top-2.5 text-[10px]">PROMO</Badge>
        )}
      </Box>

      <Stack p={styleType === 'horizontal' ? 'md' : 'xl'} gap="sm" className="flex flex-1 flex-col justify-between">
        <Box>
          <Group gap="sm" align="center" mb={4}>
            <Title order={3} size="1.1rem" className="leading-tight text-store">{product.name}</Title>
            <Text fw={900} size="md" className="rounded-md bg-store-price-muted px-2 py-0.5 text-store-primary">${formatPrice(product.price)}</Text>
          </Group>
          <Text size="xs" color="dimmed" lineClamp={2}>
            {product.description || 'Calidad superior garantizada en cada detalle de este producto.'}
          </Text>
          {product.notes && product.notes.length > 0 && (
            <Group gap={4} mt="xs" wrap="wrap">
              {product.notes.map((note: string, idx: number) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  color="orange" 
                  size="sm" 
                  radius="xl"
                  styles={{ label: { textTransform: 'uppercase', fontSize: '9px', fontWeight: 700 } }}
                  leftSection={<Box className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                >
                  {note}
                </Badge>
              ))}
            </Group>
          )}
        </Box>

        <Stack gap="xs">
          {product.trackStock && !isOut && product.stock < 10 && (
             <Badge variant="filled" color="var(--secondary-color)" size="sm" leftSection={<Package size={10} />}>
               ¡Quedan {product.stock}!
             </Badge>
          )}
          <Button 
            fullWidth 
            radius="xl" 
            size={isMobile ? "sm" : "md"} 
            color={isOut ? 'gray' : 'var(--primary-color)'}
            disabled={isOut}
            leftSection={isOut ? null : (hasCart ? <ShoppingCart size={18} /> : <Image src={WhatsAppPng} w={18} h={18} />)}
            onClick={() => onOrder(product)}
          >
            {isOut ? 'Sin Stock' : (hasCart ? 'Añadir al Carrito' : 'Consultar WhatsApp')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

function ProductSelectionModal({ product, onClose, onAdd, isMobile, showObservations }: any) {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [obs, setObs] = useState('');
  const [selectedMods, setSelectedMods] = useState<Record<string, ModifierOption[]>>({});

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setObs('');
      setSelectedMods({});
    }
  }, [product?.id]);

  if (!product) return null;

  const handleOptionToggle = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedMods(prev => {
      const current = prev[group.id] || [];
      const isSelected = current.find(o => o.id === option.id);
      
      let nextOptions = [...current];

      if (isSelected) {
        nextOptions = nextOptions.filter(o => o.id !== option.id);
      } else {
        // Si ya llegamos al máximo y el máximo es 1, reemplazamos
        if (group.maxSelected === 1) {
          nextOptions = [option];
        } else if (current.length < group.maxSelected) {
          nextOptions.push(option);
        }
      }

      return { ...prev, [group.id]: nextOptions };
    });
  };

  const calculateExtraPrice = () => {
    let extra = 0;
    Object.values(selectedMods).forEach(options => {
      options.forEach(opt => extra += opt.price);
    });
    return extra;
  };

  const totalPrice = (product.price + calculateExtraPrice()) * Number(quantity);

  const canConfirm = () => {
    // Validar mínimos de cada grupo
    if (!product.modifierGroups) return true;
    for (const mg of product.modifierGroups) {
      const group = mg.modifierGroup;
      const selectedCount = (selectedMods[group.id] || []).length;
      if (selectedCount < group.minSelected) return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!canConfirm()) return;

    const formattedModifiers = Object.entries(selectedMods).map(([groupId, options]) => {
      const groupName = product.modifierGroups.find((mg: any) => mg.modifierGroup.id === groupId).modifierGroup.name;
      return { groupId, groupName, options };
    });

    onAdd(product, Number(quantity), obs, formattedModifiers);
  };

  return (
    <Modal 
      opened={!!product} 
      onClose={onClose} 
      title={<Title order={4}>Personalizar Pedido</Title>} 
      radius={isMobile ? 0 : 'lg'} 
      size={isMobile ? '100%' : 'sm'} 
      fullScreen={isMobile}
      centered 
      zIndex={3000}
      styles={{
        header: {
          borderBottom: '1px solid #f1f5f9',
          padding: '1rem 1.5rem',
          marginBottom: '1rem'
        },
        body: {
          padding: isMobile ? '1rem' : '1.5rem',
          paddingBottom: '2.5rem'
        }
      }}
    >
      <Stack gap="md">
        <Group align="center">
          <Image src={product.imageUrl} w={60} h={60} radius="md" />
          <Box>
             <Text fw={700} size="sm" color="var(--text-color)">{product.name}</Text>
             <Text size="xs" color="dimmed">$ {formatPrice(product.price)}</Text>
          </Box>
        </Group>

        <Divider />

        <NumberInput 
          label="Cantidad" 
          value={quantity} 
          onChange={(val) => setQuantity(val)} 
          min={1} 
          max={product.trackStock ? product.stock : 99}
          required
        />

        {(product.modifierGroups || []).map((mg: any) => {
          const group = mg.modifierGroup;
          const selectedForGroup = selectedMods[group.id] || [];
          
          return (
            <Box key={group.id} p="md" className="admin-form-section">
              <Group justify="space-between" mb="xs">
                 <Box>
                    <Text fw={700} size="sm" color="var(--text-color)">{group.name}</Text>
                    <Text size="xs" color="dimmed">
                      {group.isRequired ? 'Obligatorio' : 'Opcional'} • 
                      Mín: {group.minSelected} / Máx: {group.maxSelected}
                    </Text>
                 </Box>
                 {selectedForGroup.length < group.minSelected && <Badge color="var(--secondary-color)" size="xs">Requerido</Badge>}
              </Group>

              <Stack gap="xs" mt="md">
                {group.options.map((opt: ModifierOption) => {
                  const isChecked = selectedForGroup.some(o => o.id === opt.id);
                  const canSelectMore = selectedForGroup.length < group.maxSelected;

                  return (
                    <Group 
                      key={opt.id} 
                      justify="space-between" 
                      onClick={() => handleOptionToggle(group, opt)}
                      style={{ 
                        cursor: 'pointer',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isChecked ? '#eff6ff' : 'white',
                        border: `1px solid ${isChecked ? '#3b82f6' : '#e2e8f0'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Group gap="sm">
                        {group.maxSelected === 1 ? (
                          <Radio 
                            checked={isChecked} 
                            onChange={() => {}} 
                            style={{ pointerEvents: 'none' }} 
                            color="var(--primary-color)" 
                          />
                        ) : (
                          <Checkbox 
                            checked={isChecked} 
                            onChange={() => {}} 
                            style={{ pointerEvents: 'none' }} 
                            disabled={!isChecked && !canSelectMore} 
                            color="var(--primary-color)" 
                          />
                        )}
                        <Text size="sm" fw={isChecked ? 600 : 400}>{opt.name}</Text>
                      </Group>
                      {opt.price > 0 && <Text fw={700} size="xs" color="var(--primary-color)">+$ {formatPrice(opt.price)}</Text>}
                    </Group>
                  )
                })}
              </Stack>
            </Box>
          );
        })}

        {showObservations && (
          <Textarea 
            label="Instrucciones Especiales" 
            placeholder="Aclaraciones, detalles del producto, etc..." 
            value={obs} 
            onChange={(e) => setObs(e.currentTarget.value)}
          />
        )}

        <Button 
          fullWidth 
          radius="xl" 
          size={isMobile ? "md" : "lg"} 
          disabled={!canConfirm()}
          onClick={handleAdd}
          mt="md"
          color="var(--primary-color)"
        >
          Confirmar - Total ${formatPrice(totalPrice)}
        </Button>
      </Stack>
    </Modal>
  );
}

