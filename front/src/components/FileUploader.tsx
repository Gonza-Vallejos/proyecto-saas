import { useState } from 'react';
import { Button, Group, Text, Progress, ActionIcon, Stack, Image as MantineImage } from '@mantine/core';
import { Upload, X, Check, ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

interface FileUploaderProps {
  label?: string;
  onUploadSuccess: (url: string) => void;
  defaultValue?: string;
}

export default function FileUploader({ label, onUploadSuccess, defaultValue }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (payload: File | null) => {
    if (payload) {
      setFile(payload);
      setPreview(URL.createObjectURL(payload));
      setSuccess(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(defaultValue || null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
      // Usar la lógica de la API centralizada o al menos la misma URL base
      const API_URL = 'http://192.168.100.26:3000';
      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        onUploadSuccess(data.url);
        setSuccess(true);
        setFile(null);
        setPreview(data.url);
      } else {
        throw new Error(data.message || 'Error al subir archivo');
      }
    } catch (error: any) {
      console.error('Error detallado de subida:', error);
      Swal.fire('Error', error.message || 'Error de conexión', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="xs">
      {label && <Text size="sm" fw={500}>{label}</Text>}
      
      <Group align="flex-start">
        {preview ? (
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <MantineImage src={preview} width={100} height={100} fit="cover" />
            <ActionIcon 
              color="red" 
              variant="filled" 
              size="xs" 
              style={{ position: 'absolute', top: 5, right: 5 }}
              onClick={clearFile}
            >
              <X size={12} />
            </ActionIcon>
          </div>
        ) : (
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '8px', 
            border: '2px dashed #e2e8f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f8fafc'
          }}>
            <ImageIcon size={32} color="#94a3b8" />
          </div>
        )}

        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs">
            <input 
              type="file" 
              id={`file-input-${label}`}
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <Button 
              component="label" 
              htmlFor={`file-input-${label}`}
              variant="light" 
              size="xs"
              leftSection={<Upload size={14} />}
            >
              Seleccionar
            </Button>
            
            {file && !success && (
              <Button 
                onClick={handleUpload} 
                loading={uploading} 
                color="green" 
                size="xs"
                variant="filled"
              >
                Subir
              </Button>
            )}

            {success && (
              <Badge color="green" leftSection={<Check size={12} />}>Subido</Badge>
            )}
          </Group>
          
          <Text size="xs" color="dimmed">
            {file ? file.name : 'Máximo 5MB (JPG, PNG, WebP)'}
          </Text>
          
          {uploading && <Progress value={100} animated size="xs" color="blue" />}
        </Stack>
      </Group>
    </Stack>
  );
}

// Utility Badge used above
function Badge({ children, color, leftSection }: any) {
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      backgroundColor: color === 'green' ? '#f0fdf4' : '#f1f5f9',
      color: color === 'green' ? '#166534' : '#475569',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      border: `1px solid ${color === 'green' ? '#bbf7d0' : '#e2e8f0'}`
    }}>
      {leftSection}
      {children}
    </div>
  );
}
