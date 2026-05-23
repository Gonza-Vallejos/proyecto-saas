import type { CSSProperties } from 'react';

export interface StoreTheme {
  primaryColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  fontFamily?: string;
}

export const DEFAULT_STORE_THEME = {
  primaryColor: '#0ea5e9',
  secondaryColor: '#6366f1',
  bgColor: '#F8F9FA',
  textColor: '#1e293b',
  iconColor: '#64748b',
  fontFamily: 'Inter',
} as const;

export function getStoreThemeStyle(theme: StoreTheme): CSSProperties {
  return {
    '--primary-color': theme.primaryColor || DEFAULT_STORE_THEME.primaryColor,
    '--secondary-color': theme.secondaryColor || DEFAULT_STORE_THEME.secondaryColor,
    '--bg-color': theme.bgColor || DEFAULT_STORE_THEME.bgColor,
    '--bg-card': '#ffffff',
    '--text-color': theme.textColor || DEFAULT_STORE_THEME.textColor,
    '--icon-color': theme.iconColor || DEFAULT_STORE_THEME.iconColor,
    '--font-family': theme.fontFamily || DEFAULT_STORE_THEME.fontFamily,
    fontFamily: theme.fontFamily || DEFAULT_STORE_THEME.fontFamily,
  } as CSSProperties;
}

export function themeFromStore(store: {
  primaryColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  fontFamily?: string;
}): StoreTheme {
  return {
    primaryColor: store.primaryColor,
    secondaryColor: store.secondaryColor,
    bgColor: store.bgColor,
    textColor: store.textColor,
    iconColor: store.iconColor,
    fontFamily: store.fontFamily,
  };
}
