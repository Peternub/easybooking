import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { getAdminReviewsApi } from '../../services/api';
import { AdminCard, AdminChip, AdminEmptyState, AdminSectionTitle } from './AdminTheme';

interface ReviewCard {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  clientPhone: string | null;
  clientUsername: string | null;
  masterName: string;
  serviceName: string;
}

interface MasterWithReviews {
  masterName: string;
  reviews: ReviewCard[];
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
      const reviews = await getAdminReviewsApi();

      if (reviews.length === 0) {
        setMastersWithReviews([]);
        return;
      }

      const groupedByMaster = new Map<string, ReviewCard[]>();

      for (const review of reviews) {
        const reviewCard: ReviewCard = {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          clientPhone: review.client_phone,
          clientUsername: review.client_username,
          masterName: review.master_name,
          serviceName: review.service_name,
        };

        const existing = groupedByMaster.get(reviewCard.masterName) || [];
        existing.push(reviewCard);
        groupedByMaster.set(reviewCard.masterName, existing);
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
      alert('Не удалось загрузить отзывы');
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

  function getClientLabel(review: ReviewCard) {
    if (review.clientPhone && review.clientUsername) {
      return `${review.clientPhone} · @${review.clientUsername}`;
    }

    if (review.clientPhone) {
      return review.clientPhone;
    }

    if (review.clientUsername) {
      return `@${review.clientUsername}`;
    }

    return 'Контакт клиента не указан';
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
                      <AdminChip label={review.serviceName} tone="blue" />
                      <AdminChip label={review.masterName} tone="orange" />
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
