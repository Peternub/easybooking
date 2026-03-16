import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminChip, AdminEmptyState, AdminSectionTitle } from './AdminTheme';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking_id: string;
  booking: {
    client_phone: string | null;
    client_username: string | null;
    master: {
      name: string;
    }[] | null;
    service: {
      name: string;
    }[] | null;
  }[] | null;
}

interface MasterWithReviews {
  masterName: string;
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
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(
          `
            id,
            rating,
            comment,
            created_at,
            booking_id,
            booking:bookings(
              client_phone,
              client_username,
              master:masters(name),
              service:services(name)
            )
          `,
        )
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      const groupedByMaster = new Map<string, Review[]>();

      for (const review of (reviews || []) as Review[]) {
        const masterName = review.booking?.[0]?.master?.[0]?.name || 'Мастер не найден';
        const existing = groupedByMaster.get(masterName) || [];
        existing.push(review);
        groupedByMaster.set(masterName, existing);
      }

      const mastersData: MasterWithReviews[] = Array.from(groupedByMaster.entries())
        .map(([masterName, masterReviews]) => ({
          masterName,
          reviews: masterReviews,
          averageRating:
            masterReviews.length > 0
              ? masterReviews.reduce((sum, review) => sum + review.rating, 0) / masterReviews.length
              : 0,
        }))
        .sort((a, b) => b.reviews.length - a.reviews.length);

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

  function getClientLabel(review: Review) {
    const phone = review.booking?.[0]?.client_phone;
    const username = review.booking?.[0]?.client_username;

    if (phone && username) {
      return `${phone} · @${username}`;
    }

    if (phone) {
      return phone;
    }

    if (username) {
      return `@${username}`;
    }

    return 'Контакт клиента не указан';
  }

  function getServiceName(review: Review) {
    return review.booking?.[0]?.service?.[0]?.name || 'Услуга не найдена';
  }

  function getMasterName(review: Review) {
    return review.booking?.[0]?.master?.[0]?.name || 'Мастер не найден';
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
      {mastersWithReviews.map(({ masterName, reviews, averageRating }) => (
        <AdminCard key={masterName}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AdminSectionTitle
                title={masterName}
                subtitle={
                  reviews.length > 0
                    ? 'Статистика по оценкам и комментариям.'
                    : 'Отзывов пока нет.'
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
              <AdminEmptyState text="Клиенты еще не оставляли отзывов этому мастеру." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(226, 205, 181, 0.42)',
                      border: '1px solid rgba(174, 122, 79, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
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
                      <Text style={{ fontSize: '12px', color: 'rgba(72, 49, 33, 0.72)' }}>
                        {formatDate(review.created_at)}
                      </Text>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <AdminChip label={getClientLabel(review)} tone="neutral" />
                      <AdminChip label={getServiceName(review)} tone="blue" />
                      <AdminChip label={getMasterName(review)} tone="orange" />
                    </div>

                    <Text style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--app-text)' }}>
                      {review.comment?.trim() || 'Комментарий не оставлен.'}
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
