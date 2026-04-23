const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  body?: any;
}

let activeStoreSlug: string | null = null;

export const api = {
  setStoreContext(slug: string | null) {
    activeStoreSlug = slug;
  },

  async request(endpoint: string, options: RequestOptions = {}) {
    // Intentar obtener el token específico de la tienda, o el genérico como fallback
    let token = activeStoreSlug ? localStorage.getItem(`token_${activeStoreSlug}`) : null;
    if (!token) token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      const data = await response.json();

      if (!response.ok) {
        // Manejo estandarizado de errores
        const message = data.message || 'Ocurrió un error inesperado';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  get(endpoint: string, options: RequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, body: any, options: RequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  patch(endpoint: string, body: any, options: RequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  },

  delete(endpoint: string, options: RequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};
