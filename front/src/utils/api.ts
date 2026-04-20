const API_URL = 'http://192.168.100.26:3000';

interface RequestOptions extends RequestInit {
  body?: any;
}

export const api = {
  async request(endpoint: string, options: RequestOptions = {}) {
    const token = localStorage.getItem('token');
    
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
