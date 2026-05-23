import { Container, Title, Text, Button, Group, Stack, Box } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const sIndex = pathParts.indexOf('s');
  const storeSlug = sIndex !== -1 && pathParts[sIndex + 1] ? pathParts[sIndex + 1] : null;

  return (
    <Container className="flex h-screen items-center justify-center">
      <Stack align="center" gap="xl">
        <Box className="relative text-center">
          <Title
            className="mb-[-30px] select-none text-[min(150px,20vw)] font-black leading-none opacity-5"
          >
            404
          </Title>
          <Title order={1} size="h1" className="text-[min(2.5rem,8vw)]">
            Página no encontrada
          </Title>
        </Box>

        <Text c="dimmed" size="lg" ta="center" maw={500}>
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
