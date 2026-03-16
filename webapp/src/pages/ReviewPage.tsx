import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { inputStyle, pageShellStyle, softPanelStyle, titleStyle } from '../components/AppTheme';

export function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку');
      return;
    }

    if (!bookingId) {
      alert('Не удалось определить запись для отзыва');
      return;
    }

    const webApp = window.Telegram?.WebApp;

    if (!webApp) {
      alert('Telegram Web App недоступен');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setIsSuccess(false);

    try {
      const clientTelegramId = webApp.initDataUnsafe.user?.id;

      if (!clientTelegramId) {
        throw new Error('Не удалось определить пользователя Telegram');
      }

      const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
      const response = await fetch(`${botApiUrl}/api/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          clientTelegramId,
          rating,
          comment,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Не удалось сохранить отзыв');
      }

      setIsSuccess(true);
      setSubmitMessage('Отзыв успешно сохранен');

      window.setTimeout(() => {
        webApp.close();
      }, 1500);
    } catch (error) {
      console.error('Ошибка отправки отзыва:', error);
      setSubmitMessage(
        error instanceof Error ? error.message : 'Не удалось отправить отзыв. Попробуйте еще раз.',
      );
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    if (!webApp) {
      return;
    }

    webApp.BackButton.show();
    webApp.BackButton.onClick(() => {
      webApp.close();
    });
  }, []);

  return (
    <div style={pageShellStyle}>
      <Title level="1" style={titleStyle}>
        Оцените услугу
      </Title>

      <div style={softPanelStyle}>
        <Text style={{ color: 'var(--app-text-soft)' }}>
          Ваше мнение поможет нам сделать сервис лучше.
        </Text>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <Text
          weight="2"
          style={{ marginBottom: '12px', display: 'block', color: 'var(--app-text)' }}
        >
          Оценка
        </Text>
        <div style={{ display: 'flex', gap: '10px', fontSize: '34px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '34px',
                padding: '4px',
                color: star <= rating ? 'var(--app-accent)' : '#d3bdab',
              }}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Text
          weight="2"
          style={{ marginBottom: '12px', display: 'block', color: 'var(--app-text)' }}
        >
          Комментарий
        </Text>

        <label
          style={{
            display: 'block',
            padding: '16px',
            borderRadius: '22px',
            backgroundColor: 'var(--app-card)',
            border: '1px solid var(--app-border)',
            boxShadow: 'var(--app-shadow)',
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--app-text-soft)',
            }}
          >
            Ваш отзыв
          </span>

          <textarea
            placeholder="Расскажите о вашем опыте..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            style={{
              ...inputStyle,
              minHeight: '116px',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </label>
      </div>

      <Text style={{ color: 'var(--app-text-soft)', fontSize: '14px' }}>
        После успешной отправки покажем подтверждение и закроем окно автоматически.
      </Text>

      {submitMessage && (
        <div style={softPanelStyle}>
          <Text style={{ color: isSuccess ? 'var(--app-accent-strong)' : 'var(--app-danger)' }}>
            {submitMessage}
          </Text>
        </div>
      )}

      <Button
        size="l"
        stretched
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0 || isSuccess}
        style={{
          backgroundColor: 'var(--app-accent)',
          color: '#fffaf3',
          borderRadius: '18px',
          fontWeight: 700,
        }}
      >
        {isSubmitting ? 'Отправка...' : isSuccess ? 'Сохранено' : 'Отправить отзыв'}
      </Button>
    </div>
  );
}
