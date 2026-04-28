import { useEffect, useState } from 'react';
import { Title, Text, Card, Group, Stack, ColorInput, Select, Button, SimpleGrid, Box, Divider, Badge } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Palette, Save, Smartphone, Type, Image as ImageIcon } from 'lucide-react';
import MobilePreview from '../../components/MobilePreview';
import FileUploader from '../../components/FileUploader';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

const GOOGLE_FONTS = [
  { value: 'Inter', label: 'Inter (Moderna y Limpia)' },
  { value: 'Montserrat', label: 'Montserrat (Geométrica Elegante)' },
  { value: 'Poppins', label: 'Poppins (Amigable y Redonda)' },
  { value: 'Roboto', label: 'Roboto (Estándar y Legible)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif de Lujo)' },
  { value: 'Outfit', label: 'Outfit (Minimalista)' },
];

export default function Appearance() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#6366f1');
  const [bgColor, setBgColor] = useState('#F8F9FA');
  const [textColor, setTextColor] = useState('#1e293b');
  const [iconColor, setIconColor] = useState('#64748b');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [cardStyle, setCardStyle] = useState('classic');
  const [heroStyle, setHeroStyle] = useState('curve');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'modern-blue':
        setPrimaryColor('#0ea5e9');
        setSecondaryColor('#6366f1');
        setBgColor('#F8F9FA');
        setTextColor('#1e293b');
        setIconColor('#64748b');
        setFontFamily('Inter');
        setCardStyle('modern');
        setHeroStyle('curve');
        break;
      case 'glass-dark':
        setPrimaryColor('#ec4899');
        setSecondaryColor('#a855f7');
        setBgColor('#0f172a');
        setTextColor('#f8fafc');
        setIconColor('#94a3b8');
        setFontFamily('Poppins');
        setCardStyle('modern');
        setHeroStyle('rect');
        break;
      case 'sunset':
        setPrimaryColor('#f97316');
        setSecondaryColor('#e11d48');
        setBgColor('#fffbeb');
        setTextColor('#451a03');
        setIconColor('#b45309');
        setFontFamily('Outfit');
        setCardStyle('classic');
        setHeroStyle('curve');
        break;
      case 'luxury':
        setPrimaryColor('#b45309');
        setSecondaryColor('#78350f');
        setBgColor('#fafaf9');
        setTextColor('#1c1917');
        setIconColor('#78350f');
        setFontFamily('Playfair Display');
        setCardStyle('horizontal');
        setHeroStyle('rect');
        break;
      case 'minimal-bw':
        setPrimaryColor('#000000');
        setSecondaryColor('#4b5563');
        setBgColor('#ffffff');
        setTextColor('#000000');
        setIconColor('#6b7280');
        setFontFamily('Outfit');
        setCardStyle('modern');
        setHeroStyle('rect');
        break;
      case 'forest-eco':
        setPrimaryColor('#15803d');
        setSecondaryColor('#16a34a');
        setBgColor('#f0fdf4');
        setTextColor('#14532d');
        setIconColor('#15803d');
        setFontFamily('Inter');
        setCardStyle('classic');
        setHeroStyle('curve');
        break;
      case 'cyberpunk':
        setPrimaryColor('#06b6d4');
        setSecondaryColor('#d946ef');
        setBgColor('#030712');
        setTextColor('#e0f2fe');
        setIconColor('#22d3ee');
        setFontFamily('Montserrat');
        setCardStyle('modern');
        setHeroStyle('rect');
        break;
    }
  };

  const fetchData = async () => {
    try {
      const data = await api.get('/stores/my-store');
      setName(data.name || '');
      setPrimaryColor(data.primaryColor || '#0ea5e9');
      setSecondaryColor(data.secondaryColor || '#6366f1');
      setBgColor(data.bgColor || '#F8F9FA');
      setTextColor(data.textColor || '#1e293b');
      setIconColor(data.iconColor || '#64748b');
      setFontFamily(data.fontFamily || 'Inter');
      setCardStyle(data.cardStyle || 'classic');
      setHeroStyle(data.heroStyle || 'curve');
      setLogoUrl(data.logoUrl || '');
      setHeroImageUrl(data.heroImageUrl || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/stores/my-store', { 
        primaryColor, 
        secondaryColor, 
        bgColor,
        textColor,
        iconColor,
        fontFamily,
        cardStyle, 
        heroStyle,
        logoUrl, 
        heroImageUrl
      });
      
      Swal.fire({
        title: '¡Diseño Actualizado!',
        text: 'Los cambios ya son visibles en tu tienda pública.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <div className="loader-container">Cargando estudio de diseño...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Personalización Visual</Title>
          <Text color="dimmed" size="sm">Define la personalidad de tu marca y cómo la verán tus clientes.</Text>
        </div>
        <Button 
          leftSection={<Save size={18} />} 
          loading={saving} 
          onClick={handleSave}
          size="md"
          radius="md"
        >
          Guardar Cambios
        </Button>
      </Group>

      <Box style={{ 
        position: 'relative', 
        paddingRight: isMobile ? '0' : '400px',
        display: isMobile ? 'flex' : 'block',
        flexDirection: isMobile ? 'column-reverse' : 'row'
      } as any}>
        <Box>
          <Stack gap="xl">
          {/* SECCION PRESETS */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg">
              <Box bg="teal.0" p="xs" style={{ borderRadius: '8px' }}>
                <Palette size={20} color="#0d9488" />
              </Box>
              <Title order={4}>Estilos Prediseñados (Themes)</Title>
            </Group>
            <SimpleGrid cols={2} spacing="xs">
              <Button variant="light" color="blue" onClick={() => applyPreset('modern-blue')}>Modern Blue</Button>
              <Button variant="light" color="pink" onClick={() => applyPreset('glass-dark')}>Dark Neon</Button>
              <Button variant="light" color="orange" onClick={() => applyPreset('sunset')}>Warm Sunset</Button>
              <Button variant="light" color="dark" onClick={() => applyPreset('luxury')}>Luxury Gold</Button>
              <Button variant="light" color="gray" onClick={() => applyPreset('minimal-bw')}>Minimal B&W</Button>
              <Button variant="light" color="green" onClick={() => applyPreset('forest-eco')}>Forest Eco</Button>
              <Button variant="light" color="cyan" onClick={() => applyPreset('cyberpunk')}>Cyberpunk Neon</Button>
            </SimpleGrid>
          </Card>

          {/* SECCION 1: IDENTIDAD DE MARCA */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg">
              <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
                <ImageIcon size={20} color="#0ea5e9" />
              </Box>
              <Title order={4}>Identidad de Marca</Title>
            </Group>
            
            <Stack gap="xl">
              <FileUploader 
                label="Logo de la Empresa" 
                defaultValue={logoUrl} 
                onUploadSuccess={setLogoUrl} 
              />
              <Divider label="Fondos y Estilos" labelPosition="center" />
              <FileUploader 
                label="Banner Principal (Hero)" 
                defaultValue={heroImageUrl} 
                onUploadSuccess={setHeroImageUrl} 
              />
              <Select 
                label="Tipografía del Catálogo"
                description="Se aplicará a todos los textos de tu tienda pública."
                data={GOOGLE_FONTS}
                value={fontFamily}
                onChange={(val) => setFontFamily(val || 'Inter')}
                leftSection={<Type size={16} />}
              />
            </Stack>
          </Card>

          {/* SECCION 2: COLORES Y CARDS */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg">
              <Box bg="violet.0" p="xs" style={{ borderRadius: '8px' }}>
                <Palette size={20} color="#8b5cf6" />
              </Box>
              <Title order={4}>Paleta de Colores y Estilos</Title>
            </Group>
            
            <Stack gap="md">
              <Group grow>
                <ColorInput 
                  label="Color Primario (Acción)" 
                  description="Botones de compra, navegación activa y elementos principales de interacción."
                  value={primaryColor} 
                  onChange={setPrimaryColor} 
                />
                <ColorInput 
                  label="Color Secundario (Soporte)" 
                  description="Etiquetas de oferta, estados de stock y elementos de apoyo visual."
                  value={secondaryColor} 
                  onChange={setSecondaryColor} 
                />
              </Group>

              {/* Visual guidance for color mapping */}
              <Box p="md" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Text size="xs" fw={700} mb="xs" color="gray.7">Guía de Aplicación:</Text>
                <Group gap="xl">
                  <Stack gap={4}>
                    <Button size="compact-xs" color={primaryColor} radius="xl">Botón Principal</Button>
                    <Text size="10px" color="dimmed" ta="center">Color Primario</Text>
                  </Stack>
                  <Stack gap={4}>
                    <Badge color={secondaryColor} variant="light">Etiqueta/Info</Badge>
                    <Text size="10px" color="dimmed" ta="center">Color Secundario</Text>
                  </Stack>
                </Group>
              </Box>

              <Group grow>
                <ColorInput 
                  label="Color de Fondo (Surface)" 
                  description="Fondo global de la tienda"
                  value={bgColor} 
                  onChange={setBgColor} 
                />
                <ColorInput 
                  label="Color de Texto" 
                  value={textColor} 
                  onChange={setTextColor} 
                />
              </Group>

              <Group grow>
                <ColorInput 
                  label="Color de Iconos" 
                  value={iconColor} 
                  onChange={setIconColor} 
                />
                <Box /> {/* Empty placeholder for alignment */}
              </Group>
              
              <Select 
                label="Formato de Tarjetas de Producto"
                data={[
                  { value: 'classic', label: 'Clásico (Vertical)' },
                  { value: 'modern', label: 'Moderno (Sin Borde)' },
                  { value: 'horizontal', label: 'Lista (Horizontal)' },
                ]}
                value={cardStyle}
                onChange={(val) => setCardStyle(val || 'classic')}
              />

              <Select 
                label="Diseño de Cabecera (Hero)"
                description="El estilo 'Curvo' le da un toque moderno en Desktop."
                data={[
                  { value: 'rect', label: 'Recto (Limpio)' },
                  { value: 'curve', label: 'Curvo (Medialuna)' },
                ]}
                value={heroStyle}
                onChange={(val) => setHeroStyle(val || 'rect')}
              />
            </Stack>
          </Card>

          </Stack>
        </Box>

        <Box style={{ 
          position: isMobile ? 'relative' : 'fixed', 
          top: isMobile ? '0' : '160px', 
          right: isMobile ? 'auto' : '40px',
          zIndex: isMobile ? 1 : 100,
          margin: isMobile ? '2rem auto' : '0',
          width: isMobile ? '100%' : '340px'
        } as any}>
          {/* Simulador Móvil */}
          <Stack align="center" gap="md" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
            <Text fw={700} size="sm" color="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={16} /> Previsualización en Tiempo Real
            </Text>
            <MobilePreview 
              name={name} 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor} 
              bgColor={bgColor}
              textColor={textColor}
              iconColor={iconColor}
              cardStyle={cardStyle}
              heroStyle={heroStyle}
              logoUrl={logoUrl}
              heroImageUrl={heroImageUrl}
              fontFamily={fontFamily}
            />
          </Stack>
        </Box>
      </Box>
    </div>
  );
}
