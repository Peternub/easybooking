import { usePromoCodePg, validatePromoCodePg } from './postgres.js';

export async function validatePromoCode(code: string, clientTelegramId: number) {
  return validatePromoCodePg(code, clientTelegramId);
}

export async function usePromoCode(code: string, bookingId: string) {
  return usePromoCodePg(code, bookingId);
}
