import { Input, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Client } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminChip, AdminEmptyState } from './AdminTheme';

interface ClientWithStats extends Client {
  total_bookings: number;
  last_visit: string | null;
}

export function ClientsView() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const { data, error } = await supabase.from('clients').select(`
          *,
          bookings:bookings(count)
        `);

      if (error) {
        throw error;
      }

      const clientsWithStats = await Promise.all(
        (data || []).map(async (client: Client & { bookings?: { count: number }[] }) => {
          const { data: lastBooking } = await supabase
            .from('bookings')
            .select('booking_date')
            .eq('client_id', client.id)
            .order('booking_date', { ascending: false })
            .limit(1)
            .single();

          return {
            ...client,
            total_bookings: client.bookings?.[0]?.count || 0,
            last_visit: lastBooking?.booking_date || null,
          };
        }),
      );

      setClients(clientsWithStats);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery),
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Поиск по имени, Telegram или телефону"
      />

      {filteredClients.length === 0 ? (
        <AdminEmptyState text="Клиенты не найдены." />
      ) : (
        filteredClients.map((client) => (
          <AdminCard key={client.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <Text style={{ fontSize: '18px', fontWeight: 700 }}>{client.name}</Text>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {client.username && <AdminChip label={`@${client.username}`} tone="blue" />}
                    {client.phone && <AdminChip label={client.phone} tone="neutral" />}
                    {client.telegram_id && (
                      <AdminChip label={`ID ${client.telegram_id}`} tone="orange" />
                    )}
                  </div>
                </div>

                <div
                  style={{
                    minWidth: '96px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.035)',
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ display: 'block', fontSize: '22px', fontWeight: 700 }}>
                    {client.total_bookings}
                  </Text>
                  <Text style={{ fontSize: '12px', opacity: 0.6 }}>записей</Text>
                </div>
              </div>

              {client.notes && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.035)',
                  }}
                >
                  <Text style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                    Заметки
                  </Text>
                  <Text style={{ fontSize: '14px', lineHeight: 1.45 }}>{client.notes}</Text>
                </div>
              )}
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}
