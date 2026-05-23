import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { getStoreThemeStyle, type StoreTheme } from '../lib/storeTheme';

interface StoreThemeRootProps extends HTMLAttributes<HTMLDivElement> {
  theme: StoreTheme;
  children: ReactNode;
}

/** Aplica variables CSS de tienda (--primary-color, etc.) en un contenedor */
export default function StoreThemeRoot({ theme, className, style, children, ...props }: StoreThemeRootProps) {
  const themeStyle = getStoreThemeStyle(theme);

  return (
    <div
      className={cn('store-theme font-store text-store', className)}
      style={{ ...themeStyle, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
