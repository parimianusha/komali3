import { ApiResponse } from '@/shared';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private getHeaders(token?: string | null): HeadersInit {
    const headers: Record<string, string> = {};

    if (token && token !== 'mock-dev-token') {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // In demo mode send mock dev header
      headers['X-Mock-User-Id'] = '00000000-0000-0000-0000-000000000001';
    }

    return headers;
  }

  async get<T>(path: string, params?: Record<string, any>, token?: string | null): Promise<ApiResponse<T>> {
    let url = `${BASE_URL}${path}`;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async post<T>(path: string, body?: any, token?: string | null): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async patch<T>(path: string, body: any, token?: string | null): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async put<T>(path: string, body: any, token?: string | null): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async delete<T>(path: string, token?: string | null): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  async upload<T>(path: string, formData: FormData, token?: string | null): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(token),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Upload failed with status ${res.status}`);
    }
    return data;
  }

  async exportBlob(path: string, body: any, token?: string | null): Promise<Blob> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(token),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Export failed with status ${res.status}`);
    }

    return await res.blob();
  }
}

export const apiClient = new ApiClient();
