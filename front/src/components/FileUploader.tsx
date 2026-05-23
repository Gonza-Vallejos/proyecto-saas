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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
    } catch (error: unknown) {
      console.error('Error detallado de subida:', error);
      Swal.fire('Error', error instanceof Error ? error.message : 'Error de conexión', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="xs">
      {label && <Text size="sm" fw={500}>{label}</Text>}

      <Group align="flex-start">
        {preview ? (
          <div className="relative h-[100px] w-[100px] overflow-hidden rounded-lg border border-slate-200">
            <MantineImage src={preview} width={100} height={100} fit="cover" />
            <ActionIcon
              color="red"
              variant="filled"
              size="xs"
              className="absolute right-1 top-1"
              onClick={clearFile}
            >
              <X size={12} />
            </ActionIcon>
          </div>
        ) : (
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <ImageIcon size={32} className="text-slate-400" />
          </div>
        )}

        <Stack gap="xs" className="flex-1">
          <Group gap="xs">
            <input
              type="file"
              id={`file-input-${label}`}
              className="hidden"
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
              <UploadBadge>Subido</UploadBadge>
            )}
          </Group>

          <Text size="xs" c="dimmed">
            {file ? file.name : 'Máximo 5MB (JPG, PNG, WebP)'}
          </Text>

          {uploading && <Progress value={100} animated size="xs" color="blue" />}
        </Stack>
      </Group>
    </Stack>
  );
}

function UploadBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-800">
      <Check size={12} />
      {children}
    </div>
  );
}
