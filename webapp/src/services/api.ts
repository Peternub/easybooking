import type { Master, MasterAbsence, Service } from '../../../shared/types';

const apiBaseUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export type ServicePayload = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration_minutes' | 'category' | 'is_active'
>;

export type MasterPayload = Pick<
  Master,
  'name' | 'description' | 'phone' | 'photo_url' | 'is_active'
>;

export type MasterAbsencePayload = Pick<
  MasterAbsence,
  'start_date' | 'end_date' | 'reason' | 'notes'
>;

export async function uploadMasterPhotoApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiBaseUrl}/api/upload/master-photo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`);
  }

  return response.json() as Promise<{ url: string }>;
}

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

export function getAdminMastersApi() {
  return fetchJson<Master[]>('/api/admin/masters');
}

export function createMasterApi(master: MasterPayload) {
  return requestJson<Master>('/api/admin/masters', {
    method: 'POST',
    body: master,
  });
}

export function updateMasterApi(masterId: string, master: MasterPayload) {
  return requestJson<Master>(`/api/admin/masters/${masterId}`, {
    method: 'PATCH',
    body: master,
  });
}

export function toggleMasterActiveApi(masterId: string, isActive: boolean) {
  return requestJson<Master>(`/api/admin/masters/${masterId}/toggle-active`, {
    method: 'POST',
    body: { is_active: isActive },
  });
}

export function getMasterServicesApi(masterId: string) {
  return fetchJson<Service[]>(`/api/admin/masters/${masterId}/services`);
}

export function addServiceToMasterApi(masterId: string, serviceId: string) {
  return requestJson<{ success: true }>(`/api/admin/masters/${masterId}/services`, {
    method: 'POST',
    body: { service_id: serviceId },
  });
}

export function removeServiceFromMasterApi(masterId: string, serviceId: string) {
  return requestJson<{ success: true }>(`/api/admin/masters/${masterId}/services/${serviceId}`, {
    method: 'DELETE',
  });
}

export function getMasterWorkScheduleApi(masterId: string) {
  return fetchJson<Master['work_schedule']>(`/api/admin/masters/${masterId}/work-schedule`);
}

export function updateMasterWorkScheduleApi(
  masterId: string,
  workSchedule: Master['work_schedule'],
) {
  return requestJson<Master>(`/api/admin/masters/${masterId}/work-schedule`, {
    method: 'PATCH',
    body: { work_schedule: workSchedule },
  });
}

export function getMasterAbsencesApi(masterId: string) {
  return fetchJson<MasterAbsence[]>(`/api/admin/masters/${masterId}/absences`);
}

export function createMasterAbsenceApi(masterId: string, absence: MasterAbsencePayload) {
  return requestJson<MasterAbsence>(`/api/admin/masters/${masterId}/absences`, {
    method: 'POST',
    body: absence,
  });
}

export function deleteMasterAbsenceApi(masterId: string, absenceId: string) {
  return requestJson<{ success: true }>(`/api/admin/masters/${masterId}/absences/${absenceId}`, {
    method: 'DELETE',
  });
}
