import { Globe, Mail, Phone, MapPin } from 'lucide-react';
import StoreThemeRoot from './StoreThemeRoot';

interface FooterProps {
  storeName: string;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  primaryColor: string;
}

export default function Footer({
  storeName,
  phone,
  instagram,
  facebook,
  whatsapp,
  address,
  primaryColor,
}: FooterProps) {
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : null;

  return (
    <StoreThemeRoot theme={{ primaryColor }}>
      <footer className="mt-16 border-t border-slate-200 bg-white px-8 py-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-12">

          <div>
            <h3 className="mb-4 text-xl font-extrabold text-slate-900">{storeName}</h3>
            <p className="leading-relaxed text-slate-500">
              Gracias por visitar nuestro catálogo digital. Calidad y confianza en cada producto.
            </p>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-store-primary no-underline"
              >
                Ponte en contacto vía WhatsApp
              </a>
            )}
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Contacto</h4>
            <ul className="flex list-none flex-col gap-4 p-0">
              {phone && (
                <li className="flex items-center gap-3 text-slate-500">
                  <Phone size={18} className="text-store-primary" /> {phone}
                </li>
              )}
              {address && (
                <li className="flex items-center gap-3 text-slate-500">
                  <MapPin size={18} className="text-store-primary" /> {address}
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Redes Sociales</h4>
            <div className="flex gap-5">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 transition-colors hover:text-slate-700"
                >
                  <Globe size={24} />
                </a>
              )}
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 transition-colors hover:text-slate-700"
                >
                  <Globe size={24} />
                </a>
              )}
              <a href="#" className="text-slate-500"><Mail size={24} /></a>
            </div>
          </div>

        </div>

        <div className="mx-auto mt-8 max-w-[1200px] border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </footer>
    </StoreThemeRoot>
  );
}
