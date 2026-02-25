import { Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Client } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

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
      // Загружаем клиентов с подсчетом записей
      const { data, error } = await supabase.from('clients').select(`
          *,
          bookings:bookings(count)
        `);

      if (error) throw error;

      // Преобразуем данные
      const clientsWithStats = await Promise.all(
        (data || []).map(async (client: Client & { bookings?: { count: number }[] }) => {
          // Получаем последнюю запись
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
    <div style={{ padding: '16px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        База клиентов
      </Title>

      {/* Поиск */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск по имени, нику или телефону"
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '16px',
          border: '1px solid var(--tgui--divider_color)',
          borderRadius: '8px',
          backgroundColor: 'var(--tgui--secondary_bg_color)',
          color: 'var(--tgui--text_color)',
          outline: 'none',
        }}
      />

      {/* Статистика */}
      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{clients.length}</Text>
            <Text style={{ fontSize: '12px', opacity: 0.6 }}>Всего клиентов</Text>
          </div>
          <div>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {clients.filter((c) => c.last_visit).length}
            </Text>
            <Text style={{ fontSize: '12px', opacity: 0.6 }}>С записями</Text>
          </div>
        </div>
      </Card>

      {/* Список клиентов */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            style={{ padding: '12px', cursor: 'pointer' }}
            onClick={() => {
              // TODO: Открыть карточку клиента
              console.log('Открыть клиента:', client.id);
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{client.name}</Text>
                {client.username && (
                  <Text style={{ fontSize: '14px', opacity: 0.6 }}>@{client.username}</Text>
                )}
                {client.phone && (
                  <Text style={{ fontSize: '14px', opacity: 0.6 }}>{client.phone}</Text>
                )}
                {client.notes && (
                  <Text style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    📝 {client.notes}
                  </Text>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {client.total_bookings}
                </Text>
                <Text style={{ fontSize: '12px', opacity: 0.6 }}>записей</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <Text>Клиенты не найдены</Text>
        </div>
      )}
    </div>
  );
}
