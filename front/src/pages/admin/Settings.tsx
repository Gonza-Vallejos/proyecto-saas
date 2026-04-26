import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Phone, MapPin, User as UserIcon, Lock, Mail, Clock, Copy, CreditCard, CheckCircle } from 'lucide-react';
import { 
  TextInput, Textarea, Button, Group, Stack, Card, Title, Text, 
  SimpleGrid, Divider, Box, Paper, PasswordInput, Autocomplete, Loader, Switch, Badge
} from '@mantine/core';
import { api } from '../../utils/api';
import Swal from 'sweetalert2';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Store states
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [hasMercadoPago, setHasMercadoPago] = useState(false);
  const [isMercadoPagoLinked, setIsMercadoPagoLinked] = useState(false);
  const [allowCatalogPayments, setAllowCatalogPayments] = useState(true);

  // Profile states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [businessHours, setBusinessHours] = useState<any>({
    'Lunes': { isOpen: true, open: '09:00', close: '20:00' },
    'Martes': { isOpen: true, open: '09:00', close: '20:00' },
    'Miércoles': { isOpen: true, open: '09:00', close: '20:00' },
    'Jueves': { isOpen: true, open: '09:00', close: '20:00' },
    'Viernes': { isOpen: true, open: '09:00', close: '20:00' },
    'Sábado': { isOpen: false, open: '09:00', close: '13:00' },
    'Domingo': { isOpen: false, open: '09:00', close: '13:00' }
  });

  // Map search states
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  useEffect(() => {
    fetchData();

    // Comprobar parámetros de la URL para mostrar mensajes de éxito/error de OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mp_success') === 'true') {
      Swal.fire('¡Éxito!', 'Tu cuenta de Mercado Pago fue vinculada correctamente.', 'success');
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      Swal.fire('Error', 'No se pudo vincular la cuenta de Mercado Pago.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAddressSearch = async (query: string) => {
    setAddress(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      // Usamos Nominatim (OpenStreetMap) que es gratuito y no requiere API KEY inmediata
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await response.json();
      const suggestions = data.map((item: any) => item.display_name);
      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  const fetchData = async () => {
    try {
      const [storeData, profileData] = await Promise.all([
        api.get('/stores/my-store'),
        api.get('/auth/profile')
      ]);

      // Store info
      setStoreId(storeData.id);
      setStoreName(storeData.name || '');
      setDescription(storeData.description || '');
      setPhone(storeData.phone || '');
      setInstagram(storeData.instagram || '');
      setFacebook(storeData.facebook || '');
      setWhatsapp(storeData.whatsapp || '');
      setAddress(storeData.address || '');
      setHasMercadoPago(storeData.hasMercadoPago || false);
      setIsMercadoPagoLinked(!!storeData.mercadoPagoAccessToken);
      setAllowCatalogPayments(storeData.allowCatalogPayments !== false);
      
      if (storeData.businessHours) {
        try {
          setBusinessHours(JSON.parse(storeData.businessHours));
        } catch (e) {
          console.error('Error parsing business hours', e);
        }
      }

      // User info
      setUserName(profileData.name || '');
      setUserEmail(profileData.email || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStore = async () => {
    setSaving(true);
    try {
      await api.patch('/stores/my-store', { 
        name: storeName, 
        description, 
        phone, 
        instagram, 
        facebook, 
        whatsapp, 
        address,
        businessHours: JSON.stringify(businessHours),
        allowCatalogPayments
      });
      
      Swal.fire({
        title: 'Tienda Actualizada',
        text: 'La información pública de tu tienda ha sido guardada.',
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

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      await api.patch('/auth/profile', {
        name: userName,
        email: userEmail,
        password: newPassword || undefined
      });

      Swal.fire({
        title: 'Perfil Actualizado',
        text: 'Tus credenciales de acceso han sido modificadas. Si cambiaste tu email, deberás usar el nuevo la próxima vez.',
        icon: 'success'
      });
      setNewPassword('');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLinkMercadoPago = () => {
    // Usar variable de entorno, si no existe usamos un hardcoded por el momento (sólo pruebas)
    const clientId = import.meta.env.VITE_MP_CLIENT_ID || '6472016692830263';
    let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1);
    const redirectUri = `${backendUrl}/mercado-pago/callback`;
    const url = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${storeId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  if (loading) return <div className="loader-container">Cargando configuración maestra...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <Group justify="space-between" mb="2.5rem">
        <div>
          <Title order={2}>Configuración General</Title>
          <Text color="dimmed" size="sm">Administra la información de tu tienda y tu cuenta personal.</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
        <Stack gap="xl">
          {/* SECCION: DATOS DE LA TIENDA */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg" justify="space-between">
              <Group>
                <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
                  <SettingsIcon size={20} color="#0ea5e9" />
                </Box>
                <Title order={4}>Información de la Tienda</Title>
              </Group>
              <Button size="xs" onClick={handleSaveStore} loading={saving}>Guardar</Button>
            </Group>
            
            <Stack gap="md">
              <TextInput label="Nombre Comercial" value={storeName} onChange={e => setStoreName(e.target.value)} required />
              <Textarea 
                label="Descripción de la Tienda" 
                placeholder="Ej: Calidad y servicio excepcional en cada bocado..."
                description={`${description.length}/200 caracteres (Breve resumen que aparece en el pie de página)`}
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                minRows={3} 
                maxLength={200}
              />
              
              <Divider label="Canales de Contacto" labelPosition="center" my="sm" />
              
              <SimpleGrid cols={2}>
                <TextInput label="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} leftSection={<Phone size={14} />} />
                <TextInput label="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} leftSection={<Phone size={14} />} />
                <TextInput label="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} />
                <TextInput label="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} />
              </SimpleGrid>
              <Autocomplete
                label="Dirección Física"
                placeholder="Busca tu calle, ciudad..."
                value={address}
                data={addressSuggestions}
                onChange={handleAddressSearch}
                leftSection={searchingAddress ? <Loader size="xs" /> : <MapPin size={14} />}
              />
            </Stack>
          </Card>

          {/* SECCION: HORARIOS DE ATENCION */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg" justify="space-between">
              <Group>
                <Box bg="orange.0" p="xs" style={{ borderRadius: '8px' }}>
                  <Clock size={20} color="#f59e0b" />
                </Box>
                <Title order={4}>Horarios de Atención</Title>
              </Group>
              <Button 
                variant="light" 
                color="orange" 
                size="xs" 
                leftSection={<Copy size={14} />}
                onClick={() => {
                  const firstDay = businessHours['Lunes'];
                  const newHours = { ...businessHours };
                  Object.keys(newHours).forEach(day => {
                    newHours[day] = { ...firstDay };
                  });
                  setBusinessHours(newHours);
                }}
              >
                Replicar Lunes a Todos
              </Button>
            </Group>

            <Stack gap="xs">
              {Object.entries(businessHours).map(([day, config]: [string, any]) => (
                <Group key={day} justify="space-between" p="xs" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Group gap="md" style={{ width: '120px' }}>
                    <Switch 
                      checked={config.isOpen} 
                      onChange={(e) => setBusinessHours({
                        ...businessHours,
                        [day]: { ...config, isOpen: e.currentTarget.checked }
                      })} 
                    />
                    <Text size="sm" fw={config.isOpen ? 600 : 400} color={config.isOpen ? 'black' : 'dimmed'}>{day}</Text>
                  </Group>

                  {config.isOpen ? (
                    <Group gap="xs">
                      <TextInput 
                        size="xs" 
                        type="time" 
                        value={config.open} 
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...config, open: e.target.value }
                        })}
                        style={{ width: '100px' }}
                      />
                      <Text size="xs" color="dimmed">a</Text>
                      <TextInput 
                        size="xs" 
                        type="time" 
                        value={config.close} 
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...config, close: e.target.value }
                        })}
                        style={{ width: '100px' }}
                      />
                    </Group>
                  ) : (
                    <Text size="xs" color="dimmed" fs="italic">Cerrado</Text>
                  )}
                </Group>
              ))}
            </Stack>
          </Card>
        </Stack>

        <Stack gap="xl">
          {/* SECCION: SEGURIDAD DEL USUARIO */}
          <Card withBorder radius="md" p="xl" shadow="sm">
            <Group mb="lg" justify="space-between">
              <Group>
                <Box bg="green.0" p="xs" style={{ borderRadius: '8px' }}>
                  <UserIcon size={20} color="#10b981" />
                </Box>
                <Title order={4}>Mi Cuenta (Dueño)</Title>
              </Group>
              <Button color="green" size="xs" onClick={handleUpdateProfile} loading={updatingProfile}>Actualizar Perfil</Button>
            </Group>
            
            <Stack gap="md">
              <TextInput 
                label="Nombre como Dueño" 
                placeholder="Raúl Ivanes" 
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
                leftSection={<UserIcon size={14} />}
              />
              <TextInput 
                label="Email de Acceso" 
                value={userEmail} 
                onChange={e => setUserEmail(e.target.value)} 
                leftSection={<Mail size={14} />}
              />
              <PasswordInput 
                label="Nueva Contraseña" 
                placeholder="Dejar en blanco para no cambiar" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                leftSection={<Lock size={14} />}
              />
              
              <Paper withBorder p="md" bg="gray.0" radius="md" mt="sm">
                <Text size="xs" color="dimmed" fw={500}>
                  ⚠️ Al cambiar tu nombre o email, la información se actualizará de inmediato en los registros del SuperAdmin y en tu cabecera de panel.
                </Text>
              </Paper>
            </Stack>
          </Card>

          {/* SECCION: INTEGRACIONES */}
          {hasMercadoPago && (
            <Card withBorder radius="md" p="xl" shadow="sm">
              <Group mb="lg" justify="space-between">
                <Group>
                  <Box bg="blue.0" p="xs" style={{ borderRadius: '8px' }}>
                    <CreditCard size={20} color="#3b82f6" />
                  </Box>
                  <Title order={4}>Integración Mercado Pago</Title>
                </Group>
              </Group>
              
              <Stack gap="md">
                <Text size="sm" color="dimmed">
                  Vincula tu cuenta de Mercado Pago de forma segura (OAuth) para recibir el dinero de tus ventas online y en mostrador directamente en tu cuenta.
                </Text>
                
                <Paper withBorder p="md" radius="md" style={{ background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text fw={700}>Estado de Vinculación</Text>
                    {isMercadoPagoLinked ? (
                      <Badge color="green" leftSection={<CheckCircle size={10} />}>Vinculado Exitosamente</Badge>
                    ) : (
                      <Text size="xs" color="dimmed">Actualmente no hay ninguna cuenta vinculada.</Text>
                    )}
                  </div>
                  <Button 
                    color={isMercadoPagoLinked ? "gray" : "blue"} 
                    variant={isMercadoPagoLinked ? "outline" : "filled"}
                    onClick={handleLinkMercadoPago}
                  >
                    {isMercadoPagoLinked ? 'Re-vincular Cuenta' : 'Vincular Cuenta MP'}
                  </Button>
                </Paper>

                {isMercadoPagoLinked && (
                  <Paper withBorder p="md" radius="md" style={{ background: '#f8fafc' }}>
                    <Switch
                      label="Permitir cobrar online en el catálogo"
                      description="Si se desactiva, los clientes podrán ver tus productos y enviar pedidos por WhatsApp, pero no podrán pagarlos online directamente desde la web."
                      checked={allowCatalogPayments}
                      onChange={async (event) => {
                        const checked = event.currentTarget.checked;
                        setAllowCatalogPayments(checked);
                        try {
                          await api.patch('/stores/my-store', { allowCatalogPayments: checked });
                          Swal.fire({
                            title: 'Preferencia guardada',
                            text: checked ? 'Los pagos online en catálogo están ACTIVADOS.' : 'Los pagos online en catálogo están DESACTIVADOS.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                          });
                        } catch (err: any) {
                          Swal.fire('Error', err.message, 'error');
                          setAllowCatalogPayments(!checked);
                        }
                      }}
                    />
                  </Paper>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </SimpleGrid>
    </div>
  );
}
