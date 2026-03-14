import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminChip, AdminEmptyState, AdminSectionTitle } from './AdminTheme';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client_telegram_id: number;
  master_id: string | null;
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
      const { data: masters, error: mastersError } = await supabase
        .from('masters')
        .select('id, name')
        .order('name');

      if (mastersError) {
        throw mastersError;
      }

      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      const mastersData: MasterWithReviews[] = (masters || []).map((master) => {
        const masterReviews = (reviews || []).filter((review) => review.master_id === master.id);
        const averageRating =
          masterReviews.length > 0
            ? masterReviews.reduce((sum, review) => sum + review.rating, 0) / masterReviews.length
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderStars(rating: number) {
    return '★'.repeat(rating);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (mastersWithReviews.length === 0) {
    return <AdminEmptyState text="Пока нет данных по отзывам." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {mastersWithReviews.map(({ master, reviews, averageRating }) => (
        <AdminCard key={master.id}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AdminSectionTitle
                title={master.name}
                subtitle={
                  reviews.length > 0 ? 'Статистика по оценкам и комментариям.' : 'Отзывов пока нет.'
                }
              />

              {reviews.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <AdminChip
                    label={`${renderStars(Math.round(averageRating))} ${averageRating.toFixed(1)}`}
                    tone="orange"
                  />
                  <AdminChip
                    label={`${reviews.length} ${reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}`}
                    tone="blue"
                  />
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <AdminEmptyState text="Клиенты ещё не оставляли отзывов этому мастеру." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--app-surface-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '10px',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      <AdminChip label={renderStars(review.rating)} tone="orange" />
                      <Text style={{ fontSize: '12px', opacity: 0.6 }}>
                        {formatDate(review.created_at)}
                      </Text>
                    </div>

                    <Text style={{ fontSize: '13px', opacity: 0.7 }}>
                      Клиент Telegram ID: {review.client_telegram_id}
                    </Text>

                    <Text style={{ fontSize: '14px', lineHeight: 1.45 }}>
                      {review.comment || 'Комментарий не оставлен.'}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
