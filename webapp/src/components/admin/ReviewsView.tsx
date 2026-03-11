import { Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client_telegram_id: number;
  master_id: string;
  booking_id: string;
}

interface Master {
  id: string;
  name: string;
}

interface MasterWithReviews {
  master: Master;
  reviews: Review[];
  averageRating: number;
}

export function ReviewsView() {
  const [mastersWithReviews, setMastersWithReviews] = useState<MasterWithReviews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      // Загружаем всех мастеров
      const { data: masters, error: mastersError } = await supabase
        .from('masters')
        .select('id, name')
        .order('name');

      if (mastersError) throw mastersError;

      // Загружаем все отзывы
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Группируем отзывы по мастерам
      const mastersData: MasterWithReviews[] = (masters || []).map((master) => {
        const masterReviews = (reviews || []).filter((r) => r.master_id === master.id);
        const averageRating =
          masterReviews.length > 0
            ? masterReviews.reduce((sum, r) => sum + r.rating, 0) / masterReviews.length
            : 0;

        return {
          master,
          reviews: masterReviews,
          averageRating,
        };
      });

      setMastersWithReviews(mastersData);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Отзывы
      </Title>

      {mastersWithReviews.length === 0 ? (
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <Text>Нет данных</Text>
        </Card>
      ) : (
        mastersWithReviews.map(({ master, reviews, averageRating }) => (
          <Card key={master.id} style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <Title level="2">{master.name}</Title>
              {reviews.length > 0 && (
                <Text style={{ fontSize: '14px', opacity: 0.7 }}>
                  {renderStars(Math.round(averageRating))} {averageRating.toFixed(1)} ({reviews.length}{' '}
                  {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'})
                </Text>
              )}
            </div>

            {reviews.length === 0 ? (
              <Text style={{ fontSize: '14px', opacity: 0.6 }}>Пока нет отзывов</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--tgui--secondary_bg_color)',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <Text style={{ fontSize: '16px' }}>{renderStars(review.rating)}</Text>
                      <Text style={{ fontSize: '12px', opacity: 0.6 }}>
                        {formatDate(review.created_at)}
                      </Text>
                    </div>
                    <Text style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>
                      От: {review.client_telegram_id}
                    </Text>
                    {review.comment && (
                      <Text style={{ fontSize: '14px', marginTop: '8px' }}>{review.comment}</Text>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
