import { Button, Card, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
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

      if (error) throw error;
      setMasters(data || []);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(masterId: string) {
    if (!confirm('Вы уверены, что хотите удалить этого мастера? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const master = masters.find((item) => item.id === masterId);
      const now = new Date();

      const { data: relatedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, admin_notes')
        .eq('master_id', masterId);

      if (bookingsError) throw bookingsError;

      const futureBookings = ((relatedBookings || []) as RelatedBooking[]).filter((booking) =>
        isUpcomingBooking(booking, now),
      );

      if (futureBookings.length > 0) {
        alert('Нельзя удалить мастера, пока у него есть будущие записи.');
        return;
      }

      if ((relatedBookings || []).length > 0) {
        const deletedMasterNote = master?.name
          ? `[Удален мастер: ${master.name}]`
          : '[Удален мастер]';

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

          if (bookingUpdateError) throw bookingUpdateError;
        }
      }

      const { error: reviewsError } = await supabase
        .from('reviews')
        .update({ master_id: null })
        .eq('master_id', masterId);

      if (reviewsError) throw reviewsError;

      const { error: deleteError } = await supabase.from('masters').delete().eq('id', masterId);

      if (deleteError) throw deleteError;

      alert('Мастер удален');
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

      if (error) throw error;

      alert(master.is_active ? 'Мастер деактивирован' : 'Мастер активирован');
      loadMasters();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
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
    return <MasterForm master={selectedMaster} onClose={handleFormClose} />;
  }

  return (
    <div>
      <Button size="l" stretched onClick={handleAdd} style={{ marginBottom: '16px' }}>
        + Добавить мастера
      </Button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {masters.map((master) => (
          <Card key={master.id} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {master.photo_url && (
                <img
                  src={master.photo_url}
                  alt={master.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{master.name}</Text>
                {master.specialization && (
                  <Text style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
                    {master.specialization}
                  </Text>
                )}
                {master.description && (
                  <Text style={{ fontSize: '14px', opacity: 0.6, marginTop: '8px' }}>
                    {master.description}
                  </Text>
                )}
                {master.phone && (
                  <Text style={{ fontSize: '14px', opacity: 0.6, marginTop: '4px' }}>
                    Телефон: {master.phone}
                  </Text>
                )}
                <div style={{ marginTop: '8px' }}>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: master.is_active ? '#4CAF50' : '#F44336',
                    }}
                  >
                    {master.is_active ? 'Активен' : 'Неактивен'}
                  </Text>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <Button
                mode="outline"
                size="s"
                onClick={() => handleEdit(master)}
                style={{ flex: 1, minWidth: '120px' }}
              >
                Редактировать
              </Button>
              <Button
                mode="outline"
                size="s"
                onClick={() => handleToggleActive(master)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  color: master.is_active ? '#FF9800' : '#4CAF50',
                }}
              >
                {master.is_active ? 'Деактивировать' : 'Активировать'}
              </Button>
              <Button
                mode="outline"
                size="s"
                onClick={() => handleDelete(master.id)}
                style={{ flex: 1, minWidth: '120px', color: '#F44336' }}
              >
                Удалить
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {masters.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <Text>Нет мастеров</Text>
        </div>
      )}
    </div>
  );
}
