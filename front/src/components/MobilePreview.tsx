import { Box, Text, Title, Image, SimpleGrid, Card, Badge, Button, Group, ScrollArea, Stack } from '@mantine/core';
import { ShoppingCart, Clock } from 'lucide-react';
import { useEffect } from 'react';
import InstagramPng from '../assets/instagram.png';
import WhatsAppPng from '../assets/whatsapp.png';
import UbicacionPng from '../assets/ubicacion.png';

interface PreviewProps {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  cardStyle: string;
  heroStyle: string;
  logoUrl?: string;
  heroImageUrl?: string;
  fontFamily?: string;
}

export default function MobilePreview({ name, primaryColor, secondaryColor, bgColor, textColor, iconColor, cardStyle, heroStyle, logoUrl, heroImageUrl, fontFamily }: PreviewProps) {
  useEffect(() => {
    if (fontFamily) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s/g, '+')}:wght@400;500;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [fontFamily]);

  const mockProducts = mockProductsData;

  return (
    <Box 
      style={{ 
        width: '320px', 
        height: '640px', 
        border: '12px solid #1e293b', 
        borderRadius: '36px', 
        position: 'relative',
        backgroundColor: bgColor || '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: fontFamily || 'Inter' // Aplicación de la fuente
      }}
    >
      {/* Notch simulado */}
      <Box style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '18px', background: '#1e293b', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 50 }} />
      
      <ScrollArea scrollbarSize={2} style={{ height: '100%' }}>
        {/* Header Preview */}
        <Box p="md" style={{ borderBottom: '1px solid #eee', background: '#fff', zIndex: 10 }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {logoUrl ? (
                <Image src={logoUrl} w={24} h={24} radius="xl" />
              ) : (
                <Box w={24} h={24} bg={primaryColor} style={{ borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>
                  {name?.charAt(0)}
                </Box>
              )}
              <Title order={6} style={{ fontSize: '10px', fontFamily: 'inherit', fontWeight: 800, color: textColor }}>{name?.substring(0, 15)}</Title>
            </Group>
             <Group gap={5}>
              <ActionIcon variant="subtle" color={iconColor} size="xs">
                <Clock size={12} color={iconColor} />
              </ActionIcon>
              <Box style={{ position: 'relative' }}>
                <ActionIcon variant="light" color={iconColor} size="sm" radius="md">
                  <ShoppingCart size={14} color={iconColor} />
                </ActionIcon>
                <Badge 
                  size="9px" 
                  circle 
                  color={secondaryColor} 
                  style={{ position: 'absolute', top: -4, right: -4, border: '1.5px solid white', minWidth: '12px', height: '12px', padding: 0 }}
                >
                  2
                </Badge>
              </Box>
            </Group>
          </Group>
        </Box>

        {/* Category Ribbon Preview */}
        <Box px="md" py={10} style={{ background: '#fff' }}>
          <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
            <Badge variant="filled" color={primaryColor} size="sm" radius="md">Todo</Badge>
            <Badge variant="light" color="gray" size="sm" radius="md">Burgers</Badge>
            <Badge variant="light" color="gray" size="sm" radius="md">Pizzas</Badge>
          </Group>
        </Box>

        {/* Hero Preview */}
        <Box p="xl" style={{ 
          textAlign: 'center', 
          background: heroImageUrl ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)` : '#f8fafc',
          backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: heroStyle === 'curve' ? 'none' : '1px solid #eee',
          clipPath: heroStyle === 'curve' ? 'ellipse(150% 100% at 50% 0%)' : 'none',
          paddingBottom: heroStyle === 'curve' ? '40px' : 'xl'
        }}>
          <Title order={2} style={{ fontSize: '18px', color: textColor, fontFamily: 'inherit' }}>{name}</Title>
          <Text size="xs" color="dimmed" style={{ fontFamily: 'inherit' }}>Catálogo Digital</Text>
        </Box>

        {/* Product Grid Preview */}
        <Box p="sm">
          <SimpleGrid cols={1} spacing="md">
            {mockProducts.map((p) => (
              <RenderPreviewCard key={p.id} product={p} style={cardStyle} primary={primaryColor} secondary={secondaryColor} textColor={textColor} />
            ))}
          </SimpleGrid>
        </Box>

        {/* Footer Preview */}
        <Box p="md" mt="xl" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: primaryColor }}>
          <Stack gap="xs" align="center">
            <Text fw={700} size="xs" c={textColor} style={{ opacity: 0.9 }}>Encuéntranos</Text>
            <Group gap="xs">
              <Box style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: secondaryColor }} />
              <Image src={UbicacionPng} w={14} h={14} style={{ filter: 'brightness(0) invert(1) opacity(0.8)' }} />
              <Text size="10px" c={textColor} style={{ opacity: 0.8 }}>Calle Ficticia 123</Text>
            </Group>
            <Group gap="xs">
               <Box style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: secondaryColor }} />
               <Image src={WhatsAppPng} w={14} h={14} />
               <Text size="10px" c={textColor} style={{ opacity: 0.8 }}>+54 9 11 1234 5678</Text>
            </Group>
            <Group gap="xs">
               <Box style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: secondaryColor }} />
               <Image src={InstagramPng} w={14} h={14} />
               <Text size="10px" c={textColor} style={{ opacity: 0.8 }}>@tu_cuenta</Text>
            </Group>
            <Text size="10px" c={textColor} style={{ fontFamily: 'inherit', opacity: 0.4, marginTop: '5px' }}>© 2026 {name}</Text>
          </Stack>
        </Box>
      </ScrollArea>
    </Box>
  );
}

import { ActionIcon } from '@mantine/core';

// Datos estáticos fuera para evitar recrearlos
const mockProductsData = [
  { id: '1', name: 'Producto Premium', price: 120.50, description: 'Excelente calidad y diseño.', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop' },
  { id: '2', name: 'Oferta Especial', price: 85.00, description: 'Solo por tiempo limitado.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop' },
];

function RenderPreviewCard({ product, style, primary, secondary, textColor }: any) {
  const imgStyle = { objectFit: 'cover' as const, height: '100%', width: '100%' };

  if (style === 'minimal' || style === 'modern') {
    return (
      <Card padding="xs" radius="lg" withBorder shadow="0">
        <Card.Section style={{ height: '150px', overflow: 'hidden' }}>
          <Image src={product.imageUrl} style={imgStyle} />
        </Card.Section>
        <Box mt="xs" style={{ textAlign: 'center' }}>
          <Text fw={700} size="sm" style={{ fontFamily: 'inherit', color: textColor }}>{product.name}</Text>
          <Group gap={5} justify="center">
            <Text size="sm" fw={900} color={primary} style={{ fontFamily: 'inherit' }}>${product.price.toFixed(2)}</Text>
            <Badge color={secondary} size="xs" variant="light">Oferta</Badge>
          </Group>
        </Box>
        <Button fullWidth mt="xs" size="compact-xs" color={primary} radius="md" variant="light">Añadir</Button>
      </Card>
    );
  }

  if (style === 'horizontal') {
    return (
      <Card padding="0" radius="lg" withBorder style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', height: '100px' }}>
        <Box style={{ width: '100px', height: '100px' }}>
          <Image src={product.imageUrl} style={imgStyle} />
        </Box>
        <Stack p="xs" style={{ flex: 1 }} gap="xs" justify="center">
          <Box>
            <Text fw={800} size="xs" mb={2} style={{ fontFamily: 'inherit', lineHeight: 1.1, color: textColor }}>{product.name}</Text>
            <Group gap={5}>
              <Text size="xs" color={primary} fw={900}>${product.price.toFixed(2)}</Text>
              <Badge color={secondary} size="10px" radius="xs" variant="light">INFO</Badge>
            </Group>
          </Box>
          <Button size="compact-xs" color={primary} radius="md" variant="filled" leftSection={<ShoppingCart size={10} />}>Añadir</Button>
        </Stack>
      </Card>
    );
  }

  // Classic Style (default)
  return (
    <Card shadow="none" radius="lg" withBorder padding="xs" style={{ overflow: 'hidden' }}>
      <Card.Section style={{ height: '160px', overflow: 'hidden' }}>
        <Image src={product.imageUrl} style={imgStyle} />
      </Card.Section>

      <Box mt="xs">
        <Group justify="space-between" align="center" mb={2}>
          <Text fw={800} size="xs" style={{ fontFamily: 'inherit', color: textColor }}>{product.name}</Text>
          <Badge color={secondary} variant="light" size="xs" radius="sm">
            Oferta
          </Badge>
        </Group>
        <Text size="10px" style={{ fontFamily: 'inherit', color: textColor, opacity: 0.7 }} lineClamp={1} mb="xs">Calidad superior garantizada.</Text>
      </Box>

      <Button fullWidth size="compact-xs" color={primary} radius="md" leftSection={<ShoppingCart size={12} />}>
        Pedir ahora
      </Button>
    </Card>
  );
}
