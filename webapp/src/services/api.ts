import type { Master, Service } from '../../../shared/types';

const apiBaseUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
};

export type ServicePayload = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration_minutes' | 'category' | 'is_active'
>;

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function getServicesApi() {
  return fetchJson<Service[]>('/api/services');
}

export function getServiceByIdApi(serviceId: string) {
  return fetchJson<Service>(`/api/services/${serviceId}`);
}

export function getMastersByServiceApi(serviceId: string) {
  return fetchJson<Master[]>(`/api/services/${serviceId}/masters`);
}

export function getMasterByIdApi(masterId: string) {
  return fetchJson<Master>(`/api/masters/${masterId}`);
}

export function getAvailableDatesApi(masterId: string) {
  return fetchJson<string[]>(`/api/masters/${masterId}/available-dates`);
}

export function getAvailableSlotsApi(masterId: string, date: string) {
  return fetchJson<Array<{ time: string; isAvailable: boolean; isPast: boolean }>>(
    `/api/masters/${masterId}/available-slots?date=${encodeURIComponent(date)}`,
  );
}

export function getAdminServicesApi() {
  return fetchJson<Service[]>('/api/admin/services');
}

export function createServiceApi(service: ServicePayload) {
  return requestJson<Service>('/api/admin/services', {
    method: 'POST',
    body: service,
  });
}

export function updateServiceApi(serviceId: string, service: ServicePayload) {
  return requestJson<Service>(`/api/admin/services/${serviceId}`, {
    method: 'PATCH',
    body: service,
  });
}

export function toggleServiceActiveApi(serviceId: string, isActive: boolean) {
  return requestJson<Service>(`/api/admin/services/${serviceId}/toggle-active`, {
    method: 'POST',
    body: { is_active: isActive },
  });
}