import { Button, Input, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pageShellStyle, softPanelStyle, titleStyle } from '../components/AppTheme';

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
        <Input
          header="Ваш отзыв"
          placeholder="Расскажите о вашем опыте..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <Button
        size="l"
        stretched
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        style={{
          backgroundColor: 'var(--app-accent)',
          color: '#fffaf3',
          borderRadius: '18px',
        }}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
      </Button>
    </div>
  );
}
