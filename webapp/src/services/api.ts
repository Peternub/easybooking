import type { Master, Service } from '../../../shared/types';

const apiBaseUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`);
  }

  return response.json() as Promise<T>;
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
