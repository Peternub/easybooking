import { createPromoCodePg, usePromoCodePg, validatePromoCodePg } from './postgres.js';

export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'COMEBACK';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createPromoCode(
  clientTelegramId: number,
  discountPercent: number,
  validDays = 7,
) {
  const code = generatePromoCode();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  return createPromoCodePg(code, clientTelegramId, discountPercent, validUntil.toISOString());
}

export async function validatePromoCode(code: string, clientTelegramId: number) {
  return validatePromoCodePg(code, clientTelegramId);
}

export async function usePromoCode(code: string, bookingId: string) {
  return usePromoCodePg(code, bookingId);
}
