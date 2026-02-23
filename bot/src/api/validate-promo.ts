// API endpoint для проверки промокода

import { validatePromoCode } from '../services/promo-codes.js';

export async function handleValidatePromo(data: { code: string; clientTelegramId: number }) {
  try {
    const promo = await validatePromoCode(data.code, data.clientTelegramId);

    if (promo) {
      return {
        valid: true,
        discount: promo.discount_percent,
        code: promo.code,
      };
    }

    return {
      valid: false,
      message: 'Промокод недействителен или истёк срок действия',
    };
  } catch (error) {
    console.error('Ошибка проверки промокода:', error);
    return {
      valid: false,
      message: 'Ошибка проверки промокода',
    };
  }
}
