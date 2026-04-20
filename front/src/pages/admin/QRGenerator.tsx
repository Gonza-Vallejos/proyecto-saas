import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Title, Text, Card, Group, Stack, SimpleGrid, Button, Box, ColorInput, Switch, Slider, Paper, TextInput, Badge, Divider } from '@mantine/core';
import { Download, QrCode, Wifi, Save } from 'lucide-react';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

interface StoreData {
  id: string;
  slug: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  hasConnectivity: boolean;
  wifiSSID?: string;
  wifiPassword?: string;
}

export default function QRGenerator() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  // Configuración del QR
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showLogo, setShowLogo] = useState(true);
  const [qrSize, setQrSize] = useState(256); // Tamaño interno del canvas
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [savingWifi, setSavingWifi] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const data = await api.get('/stores/my-store');
      setStore(data);
      if (data.primaryColor) {
        setFgColor(data.primaryColor);
      }
      setWifiSSID(data.wifiSSID || '');
      setWifiPassword(data.wifiPassword || '');
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo cargar la info de la tienda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${store?.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleSaveWifi = async () => {
    setSavingWifi(true);
    try {
      await api.patch('/stores/my-store', { 
        wifiSSID, 
        wifiPassword 
      });
      Swal.fire({
        title: '¡Configuración WiFi Guardada!',
        text: 'Tus clientes ya pueden usar estos datos para conectar.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setSavingWifi(false);
    }
  };

  const downloadWifiQR = () => {
    const canvas = document.getElementById('wifi-qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `WIFI-QR-${store?.name}.png`;
      link.href = url;
      link.click();
    }
  };

  if (loading) return <div className="loader-container">Cargando Generador QR...</div>;
  if (!store) return <Text color="red">No se encontró información de tienda.</Text>;

  // Usamos la IP local en lugar de localhost para que el QR funcione al escanearlo con el celular
  const domain = window.location.origin;
  const storeUrl = `${domain}/s/${store.slug}`;

  // Fix URL for the logo if it's relative
  const fixUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const qrLogoUrl = fixUrl(store.logoUrl);

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Código QR de tu Tienda</Title>
          <Text color="dimmed" size="sm">Genera, personaliza y descarga el código QR para que tus clientes accedan directamente a tu catálogo.</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Stack gap="xl">
          {/* SECCION 1: QR DE LA TIENDA */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg" justify="space-between">
              <Group>
                <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
                  <QrCode size={20} color="#0ea5e9" />
                </Box>
                <Title order={4}>Catálogo Público</Title>
              </Group>
              <Badge color="blue" variant="light">Imagen de Tienda</Badge>
            </Group>

            <Stack gap="md">
              <ColorInput 
                label="Color del Código (Frente)" 
                description="Elige un color oscuro para que contraste bien."
                value={fgColor} 
                onChange={setFgColor} 
              />
              
              <ColorInput 
                label="Color de Fondo" 
                description="Se recomienda blanco o transparente."
                value={bgColor} 
                onChange={setBgColor} 
              />

              <Paper withBorder p="md" radius="md">
                <Switch 
                  label="Incluir Logo en el Centro" 
                  description="Añade tu logotipo si ya subiste uno en la sección de Aspecto."
                  checked={showLogo} 
                  onChange={(e) => setShowLogo(e.currentTarget.checked)} 
                  disabled={!store.logoUrl}
                />
                {!store.logoUrl && (
                  <Text size="xs" color="orange" mt="xs">Sube un logo en la sección "Aspecto" primero.</Text>
                )}
              </Paper>

              <Box mt="sm">
                <Text size="sm" fw={500} mb="xs">Resolución del Archivo Descargable</Text>
                <Slider 
                  value={qrSize} 
                  onChange={setQrSize} 
                  min={128} 
                  max={1024} 
                  step={128}
                  marks={[
                    { value: 256, label: 'Pequeño' },
                    { value: 512, label: 'Mediano' },
                    { value: 1024, label: 'Alta Calidad' }
                  ]}
                />
                <Text size="xs" color="dimmed" mt="xl" ta="right">{qrSize}x{qrSize} px</Text>
              </Box>
            </Stack>
          </Card>

          {/* SECCION 2: CONECTIVIDAD WIFI (Solo si el modulo está activo) */}
          {store.hasConnectivity && (
            <Card withBorder radius="md" p="xl" shadow="sm">
              <Group mb="lg" justify="space-between">
                <Group>
                  <Box bg="cyan.0" p="xs" style={{ borderRadius: '8px' }}>
                    <Wifi size={20} color="#06b6d4" />
                  </Box>
                  <Title order={4}>Acceso WiFi para Clientes</Title>
                </Group>
                <Badge color="cyan" variant="filled">Módulo Pro</Badge>
              </Group>

              <Stack gap="md">
                <TextInput 
                  label="Nombre de la Red (SSID)" 
                  placeholder="Ej: WiFi-MiLocal"
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                />
                <TextInput 
                  label="Contraseña de la Red" 
                  placeholder="Tu contraseña secreta"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                />

                <Button 
                  leftSection={<Save size={16} />} 
                  onClick={handleSaveWifi}
                  loading={savingWifi}
                  variant="light"
                  color="cyan"
                >
                  Guardar Datos WiFi
                </Button>

                <Divider my="sm" variant="dashed" label="Vista Previa y Descarga" labelPosition="center" />
                
                {wifiSSID && wifiPassword ? (
                  <Box p="md" style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Stack align="center" gap="sm">
                      <Box p="sm" bg="white" style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <QRCodeCanvas 
                          id="wifi-qr-canvas"
                          value={`WIFI:S:${wifiSSID};T:WPA;P:${wifiPassword};;`}
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      </Box>
                      <Button 
                        variant="filled" 
                        color="cyan" 
                        leftSection={<Download size={14} />} 
                        onClick={downloadWifiQR}
                        size="sm"
                      >
                        Descargar QR WiFi
                      </Button>
                      <Text size="xs" color="dimmed" ta="center">
                        Tus clientes se conectarán automáticamente al escanear este código.
                      </Text>
                    </Stack>
                  </Box>
                ) : (
                  <Text size="xs" color="dimmed" ta="center" fs="italic">Ingresa el nombre y la contraseña de tu red para generar el QR de conexión.</Text>
                )}
              </Stack>
            </Card>
          )}
        </Stack>

        <Stack gap="md">
          <Card withBorder radius="md" p="xl" shadow="sm" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', backgroundColor: '#f8fafc' }}>
            <Paper shadow="xl" p="md" radius="lg" style={{ background: 'white' }}>
              <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <QRCodeCanvas
                  value={storeUrl}
                  size={300} // Fijo en UI para que no rompa el diseño, pero al render en canvas le pasamos otro o solo escala en CSS
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }} // responsiveness visual
                  bgColor={bgColor}
                  fgColor={fgColor}
                  level="H" // Corrección de error alta para que soporte el logo en el medio
                  includeMargin={true}
                  imageSettings={
                    showLogo && qrLogoUrl
                      ? {
                          src: qrLogoUrl,
                          x: undefined, 
                          y: undefined,
                          height: 60,
                          width: 60,
                          excavate: true, 
                        }
                      : undefined
                  }
                />
                {/* Generador oculto con la resolucion completa para descargas */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    value={storeUrl}
                    size={qrSize}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level="H"
                    includeMargin={true}
                    imageSettings={
                      showLogo && qrLogoUrl
                        ? {
                            src: qrLogoUrl,
                            x: undefined, 
                            y: undefined,
                            height: qrSize * 0.2, // El logo ocupa el 20%
                            width: qrSize * 0.2,
                            excavate: true, 
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </Paper>

            <Text mt="lg" fw={600} color="dimmed" size="sm" ta="center">Escanea este código para ir a:</Text>
            <Text fw={700} color="blue" size="sm" ta="center" component="a" href={storeUrl} target="_blank">{storeUrl}</Text>

          </Card>
          <Button fullWidth size="lg" radius="md" color="blue" leftSection={<Download size={20} />} onClick={handleDownload}>
              Descargar Imagen (PNG)
          </Button>
        </Stack>
      </SimpleGrid>
    </div>
  );
}
