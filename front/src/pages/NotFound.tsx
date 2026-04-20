import { Container, Title, Text, Button, Group, Stack, Box } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  // Intentar extraer el slug de la tienda si estamos en una ruta de tienda
  const pathParts = location.pathname.split('/');
  const sIndex = pathParts.indexOf('s');
  const storeSlug = sIndex !== -1 && pathParts[sIndex + 1] ? pathParts[sIndex + 1] : null;

  return (
    <Container style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl">
        <Box style={{ textAlign: 'center', position: 'relative' }}>
          <Title 
            style={{ 
              fontSize: '150px', 
              fontWeight: 900, 
              lineHeight: 1, 
              marginBottom: '-30px', 
              opacity: 0.05,
              userSelect: 'none'
            }}
          >
            404
          </Title>
          <Title order={1} size="h1" style={{ fontSize: '2.5rem' }}>Página no encontrada</Title>
        </Box>

        <Text color="dimmed" size="lg" ta="center" maw={500}>
          Lo sentimos, el enlace al que intentas acceder no existe o fue movido temporalmente.
        </Text>

        <Group gap="md">
          {storeSlug ? (
            <Button 
              size="lg" 
              radius="xl" 
              leftSection={<Store size={20} />}
              onClick={() => navigate(`/s/${storeSlug}`)}
              variant="filled"
              color="blue"
            >
              Volver a la Tienda
            </Button>
          ) : (
            <Button 
              size="lg" 
              radius="xl" 
              leftSection={<Home size={20} />}
              onClick={() => navigate('/')}
              variant="filled"
              color="blue"
            >
              Ir al Inicio
            </Button>
          )}
          
          <Button 
            size="lg" 
            radius="xl" 
            variant="light" 
            onClick={() => navigate(-1)}
          >
            Regresar
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
