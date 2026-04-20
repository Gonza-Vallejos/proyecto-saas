import { Globe, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  storeName: string;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  primaryColor: string;
}

export default function Footer({ storeName, phone, instagram, facebook, whatsapp, address, primaryColor }: FooterProps) {
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : null;
  return (
    <footer style={{ 
      backgroundColor: '#ffffff', 
      borderTop: '1px solid #e2e8f0', 
      padding: '4rem 2rem', 
      marginTop: '4rem' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
        
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>{storeName}</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Gracias por visitar nuestro catálogo digital. Calidad y confianza en cada producto.
          </p>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" style={{ color: primaryColor, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Ponte en contacto vía WhatsApp
            </a>
          )}
        </div>

        <div>
          <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Contacto</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {phone && (
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
                <Phone size={18} color={primaryColor} /> {phone}
              </li>
            )}
            {address && (
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
                <MapPin size={18} color={primaryColor} /> {address}
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Redes Sociales</h4>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {instagram && (
              <a href={instagram} target="_blank" rel="noreferrer" style={{ color: '#64748b', transition: 'color 0.2s' }}>
                <Globe size={24} />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noreferrer" style={{ color: '#64748b', transition: 'color 0.2s' }}>
                <Globe size={24} />
              </a>
            )}
            <a href="#" style={{ color: '#64748b' }}><Mail size={24} /></a>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
