import { Loader, Center } from '@mantine/core';

export default function Spinner() {
  return (
    <Center style={{ height: '100vh' }}>
      <Loader size="lg" variant="dots" />
    </Center>
  );
}
