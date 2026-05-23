import { Box, Text, Title, Image, SimpleGrid, Card, Badge, Button, Group, ScrollArea, Stack, ActionIcon } from '@mantine/core';
import { ShoppingCart, Clock } from 'lucide-react';
import { useEffect } from 'react';
import InstagramPng from '../assets/instagram.png';
import WhatsAppPng from '../assets/whatsapp.png';
import UbicacionPng from '../assets/ubicacion.png';
import StoreThemeRoot from './StoreThemeRoot';
import { cn } from '../lib/cn';

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

export default function MobilePreview({
  name,
  primaryColor,
  secondaryColor,
  bgColor,
  textColor,
  iconColor,
  cardStyle,
  heroStyle,
  logoUrl,
  heroImageUrl,
  fontFamily,
}: PreviewProps) {
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

  const theme = { primaryColor, secondaryColor, bgColor, textColor, iconColor, fontFamily };

  return (
    <div className="preview-shell">
      <div className="preview-side-btn-left preview-side-btn-left--upper" />
      <div className="preview-side-btn-left preview-side-btn-left--lower" />
      <div className="preview-side-btn-right" />

      <StoreThemeRoot
        theme={theme}
        className="preview-device"
        style={{ backgroundColor: bgColor || '#ffffff' }}
      >
        <Box className="preview-notch">
          <Box className="preview-notch-dot" />
          <Box className="preview-notch-bar" />
        </Box>

        <Box className="preview-glass-reflection" />

        <ScrollArea scrollbarSize={2} className="h-full">
          <Box className="preview-header">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {logoUrl ? (
                  <Image src={logoUrl} w={24} h={24} radius="xl" />
                ) : (
                  <Box className="preview-logo-fallback bg-store-primary">{name?.charAt(0)}</Box>
                )}
                <Title order={6} className="text-[10px] font-extrabold text-store">
                  {name?.substring(0, 15)}
                </Title>
              </Group>
              <Group gap={5}>
                <ActionIcon variant="subtle" color={iconColor} size="xs">
                  <Clock size={12} color={iconColor} />
                </ActionIcon>
                <Box className="relative">
                  <ActionIcon variant="light" color={iconColor} size="sm" radius="md">
                    <ShoppingCart size={14} color={iconColor} />
                  </ActionIcon>
                  <Badge size="9px" circle color={secondaryColor} className="preview-cart-badge">
                    2
                  </Badge>
                </Box>
              </Group>
            </Group>
          </Box>

          <Box className="preview-categories">
            <Group gap="xs" wrap="nowrap" className="overflow-hidden">
              <Badge variant="filled" color={primaryColor} size="sm" radius="md">
                Todo
              </Badge>
              <Badge variant="light" color="gray" size="sm" radius="md">
                Burgers
              </Badge>
              <Badge variant="light" color="gray" size="sm" radius="md">
                Pizzas
              </Badge>
            </Group>
          </Box>

          <Box
            p="xl"
            className={cn('preview-hero', heroStyle === 'curve' && 'preview-hero--curve')}
            style={{
              backgroundImage: heroImageUrl
                ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url(${heroImageUrl})`
                : undefined,
              borderBottom: heroStyle === 'curve' ? undefined : '1px solid #eee',
            }}
          >
            <Title order={2} className="text-lg text-store">
              {name}
            </Title>
            <Text size="xs" c="dimmed">
              Catálogo Digital
            </Text>
          </Box>

          <Box p="sm">
            <SimpleGrid cols={1} spacing="md">
              {mockProductsData.map((p) => (
                <RenderPreviewCard
                  key={p.id}
                  product={p}
                  style={cardStyle}
                  primary={primaryColor}
                  secondary={secondaryColor}
                />
              ))}
            </SimpleGrid>
          </Box>

          <Box p="md" mt="xl" className="border-t border-white/10 bg-store-primary">
            <Stack gap="xs" align="center">
              <Text fw={700} size="xs" c={textColor} className="opacity-90">
                Encuéntranos
              </Text>
              <Group gap="xs">
                <Box className="preview-footer-dot" />
                <Image src={UbicacionPng} w={14} h={14} className="opacity-80 brightness-0 invert" />
                <Text size="10px" c={textColor} className="opacity-80">
                  Calle Ficticia 123
                </Text>
              </Group>
              <Group gap="xs">
                <Box className="preview-footer-dot" />
                <Image src={WhatsAppPng} w={14} h={14} />
                <Text size="10px" c={textColor} className="opacity-80">
                  +54 9 11 1234 5678
                </Text>
              </Group>
              <Group gap="xs">
                <Box className="preview-footer-dot" />
                <Image src={InstagramPng} w={14} h={14} />
                <Text size="10px" c={textColor} className="opacity-80">
                  @tu_cuenta
                </Text>
              </Group>
              <Text size="10px" c={textColor} className="mt-1 opacity-40">
                © 2026 {name}
              </Text>
            </Stack>
          </Box>
        </ScrollArea>
      </StoreThemeRoot>
    </div>
  );
}

const mockProductsData = [
  {
    id: '1',
    name: 'Producto Premium',
    price: 120.5,
    description: 'Excelente calidad y diseño.',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Oferta Especial',
    price: 85.0,
    description: 'Solo por tiempo limitado.',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop',
  },
];

function RenderPreviewCard({
  product,
  style,
  primary,
  secondary,
}: {
  product: (typeof mockProductsData)[0];
  style: string;
  primary: string;
  secondary: string;
}) {
  const imgClass = 'h-full w-full bg-slate-100 object-contain';

  if (style === 'minimal' || style === 'modern') {
    return (
      <Card padding="xs" radius="lg" withBorder shadow="0">
        <Card.Section className="h-[150px] overflow-hidden">
          <Image src={product.imageUrl} className={imgClass} />
        </Card.Section>
        <Box mt="xs" className="text-center">
          <Text fw={700} size="sm" className="text-store">
            {product.name}
          </Text>
          <Group gap={5} justify="center">
            <Text size="sm" fw={900} c={primary}>
              ${product.price.toFixed(2)}
            </Text>
            <Badge color={secondary} size="xs" variant="light">
              Oferta
            </Badge>
          </Group>
        </Box>
        <Button fullWidth mt="xs" size="compact-xs" color={primary} radius="md" variant="light">
          Añadir
        </Button>
      </Card>
    );
  }

  if (style === 'horizontal') {
    return (
      <Card padding="0" radius="lg" withBorder className="flex h-[100px] flex-row overflow-hidden">
        <Box className="h-[100px] w-[100px]">
          <Image src={product.imageUrl} className={imgClass} />
        </Box>
        <Stack p="xs" className="flex-1" gap="xs" justify="center">
          <Box>
            <Text fw={800} size="xs" mb={2} className="leading-tight text-store">
              {product.name}
            </Text>
            <Group gap={5}>
              <Text size="xs" c={primary} fw={900}>
                ${product.price.toFixed(2)}
              </Text>
              <Badge color={secondary} size="10px" radius="xs" variant="light">
                INFO
              </Badge>
            </Group>
          </Box>
          <Button size="compact-xs" color={primary} radius="md" variant="filled" leftSection={<ShoppingCart size={10} />}>
            Añadir
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="none" radius="lg" withBorder padding="xs" className="overflow-hidden">
      <Card.Section className="h-40 overflow-hidden">
        <Image src={product.imageUrl} className={imgClass} />
      </Card.Section>

      <Box mt="xs">
        <Group justify="space-between" align="center" mb={2}>
          <Text fw={800} size="xs" className="text-store">
            {product.name}
          </Text>
          <Badge color={secondary} variant="light" size="xs" radius="sm">
            Oferta
          </Badge>
        </Group>
        <Text size="10px" className="mb-2 line-clamp-1 text-store opacity-70">
          Calidad superior garantizada.
        </Text>
      </Box>

      <Button fullWidth size="compact-xs" color={primary} radius="md" leftSection={<ShoppingCart size={12} />}>
        Pedir ahora
      </Button>
    </Card>
  );
}
