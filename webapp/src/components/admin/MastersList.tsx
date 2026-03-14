import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';
import { MasterForm } from './MasterForm';

interface RelatedBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  admin_notes: string | null;
}

function isUpcomingBooking(booking: RelatedBooking, now: Date) {
  if (!['active', 'pending'].includes(booking.status)) {
    return false;
  }

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
  return bookingDateTime.getTime() > now.getTime();
}

export function MastersList() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMasters();
  }, []);

  async function loadMasters() {
    try {
      const { data, error } = await supabase.from('masters').select('*').order('name');

      if (error) {
        throw error;
      }

      setMasters(data || []);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(masterId: string) {
    if (
      !confirm('Удалить мастера? Если у него есть будущие записи, удаление будет заблокировано.')
    ) {
      return;
    }

    try {
      const master = masters.find((item) => item.id === masterId);
      const now = new Date();

      const { data: relatedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, admin_notes')
        .eq('master_id', masterId);

      if (bookingsError) {
        throw bookingsError;
      }

      const futureBookings = ((relatedBookings || []) as RelatedBooking[]).filter((booking) =>
        isUpcomingBooking(booking, now),
      );

      if (futureBookings.length > 0) {
        alert('Нельзя удалить мастера, пока у него есть будущие записи.');
        return;
      }

      if ((relatedBookings || []).length > 0) {
        const deletedMasterNote = master?.name
          ? `[Удалён мастер: ${master.name}]`
          : '[Удалён мастер]';

        for (const booking of (relatedBookings || []) as RelatedBooking[]) {
          const nextAdminNotes = booking.admin_notes
            ? `${booking.admin_notes}\n${deletedMasterNote}`
            : deletedMasterNote;

          const { error: bookingUpdateError } = await supabase
            .from('bookings')
            .update({
              master_id: null,
              admin_notes: nextAdminNotes,
            })
            .eq('id', booking.id);

          if (bookingUpdateError) {
            throw bookingUpdateError;
          }
        }
      }

      const { error: reviewsError } = await supabase
        .from('reviews')
        .update({ master_id: null })
        .eq('master_id', masterId);

      if (reviewsError) {
        throw reviewsError;
      }

      const { error: deleteError } = await supabase.from('masters').delete().eq('id', masterId);

      if (deleteError) {
        throw deleteError;
      }

      alert('Мастер удалён');
      loadMasters();
    } catch (error) {
      console.error('Ошибка удаления мастера:', error);
      alert('Не удалось удалить мастера');
    }
  }

  async function handleToggleActive(master: Master) {
    try {
      const { error } = await supabase
        .from('masters')
        .update({ is_active: !master.is_active })
        .eq('id', master.id);

      if (error) {
        throw error;
      }

      alert(master.is_active ? 'Мастер деактивирован' : 'Мастер активирован');
      loadMasters();
    } catch (error) {
      console.error('Ошибка изменения статуса мастера:', error);
      alert('Не удалось изменить статус мастера');
    }
  }

  function handleEdit(master: Master) {
    setSelectedMaster(master);
    setShowForm(true);
  }

  function handleAdd() {
    setSelectedMaster(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setSelectedMaster(null);
    loadMasters();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (showForm) {
    return (
      <MasterForm
        key={selectedMaster?.id ?? 'new-master'}
        master={selectedMaster}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminPrimaryButton stretched onClick={handleAdd}>
        + Добавить мастера
      </AdminPrimaryButton>

      {masters.length === 0 ? (
        <AdminEmptyState text="Мастера ещё не добавлены." />
      ) : (
        masters.map((master) => (
          <AdminCard key={master.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {master.photo_url ? (
                  <img
                    src={master.photo_url}
                    alt={master.name}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '18px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '18px',
                      background: 'var(--app-surface-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--app-accent-strong)',
                      flexShrink: 0,
                    }}
                  >
                    {master.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div
                    style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: 'var(--app-text)',
                      }}
                    >
                      {master.name}
                    </Text>
                    <AdminChip
                      label={master.is_active ? 'Активен' : 'Скрыт'}
                      tone={master.is_active ? 'green' : 'orange'}
                    />
                  </div>

                  {master.specialization && (
                    <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                      {master.specialization}
                    </Text>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '14px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--app-surface-muted)',
                    }}
                  >
                    {master.phone && <AdminDetailRow label="Телефон" value={master.phone} />}
                    {master.description && (
                      <AdminDetailRow label="О мастере" value={master.description} />
                    )}
                    {!master.phone && !master.description && (
                      <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                        Контакт и описание пока не заполнены.
                      </Text>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button mode="outline" size="s" onClick={() => handleEdit(master)}>
                  Изменить
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleToggleActive(master)}
                  style={{ color: 'var(--app-accent-strong)' }}
                >
                  {master.is_active ? 'Деактивировать' : 'Активировать'}
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleDelete(master.id)}
                  style={{ color: 'var(--app-danger)' }}
                >
                  Удалить
                </Button>
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}
