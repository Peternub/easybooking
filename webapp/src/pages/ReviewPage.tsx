import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input, Title, Text } from '@telegram-apps/telegram-ui';

export function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку');
      return;
    }

    setIsSubmitting(true);

    const data = {
      type: 'review',
      bookingId,
      rating,
      comment,
    };

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        webApp.close();
      });
    }
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Оцените услугу
      </Title>

      <Text style={{ marginBottom: '24px' }}>
        Ваше мнение поможет нам стать лучше!
      </Text>

      <div style={{ marginBottom: '24px' }}>
        <Text weight="2" style={{ marginBottom: '12px', display: 'block' }}>
          Оценка:
        </Text>
        <div style={{ display: 'flex', gap: '8px', fontSize: '32px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '32px',
                padding: '4px',
              }}
            >
              {star <= rating ? '⭐️' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text weight="2" style={{ marginBottom: '12px', display: 'block' }}>
          Комментарий (необязательно):
        </Text>
        <Input
          header="Ваш отзыв"
          placeholder="Расскажите о вашем опыте..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button
        size="l"
        stretched
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
      </Button>
    </div>
  );
}
