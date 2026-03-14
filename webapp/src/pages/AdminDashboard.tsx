import { Button, Tabbar } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import {
  AdminCard,
  AdminDeniedState,
  AdminHero,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { CalendarView } from '../components/admin/CalendarView';
import { ClientsView } from '../components/admin/ClientsView';
import { ReviewsView } from '../components/admin/ReviewsView';
import { SettingsView } from '../components/admin/SettingsView';
import { useAdminAccess } from '../components/admin/useAdminAccess';

type TabType = 'calendar' | 'clients' | 'reviews' | 'settings';

const tabLabels: Record<TabType, string> = {
  calendar: 'Календарь',
  clients: 'Клиенты',
  reviews: 'Отзывы',
  settings: 'Настройки',
};

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={{ paddingBottom: '88px' }}>
      <div style={adminPageStyle}>
        <AdminHero
          eyebrow="Дашборд"
          title="Рабочая панель"
          description="Календарь, база клиентов, отзывы и быстрые настройки в одном месте."
        />

        <AdminCard style={{ padding: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {(Object.keys(tabLabels) as TabType[]).map((tab) => (
              <Button
                key={tab}
                mode={activeTab === tab ? 'filled' : 'outline'}
                size="s"
                onClick={() => setActiveTab(tab)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {tabLabels[tab]}
              </Button>
            ))}
          </div>
        </AdminCard>

        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'reviews' && <ReviewsView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      <Tabbar style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        {(Object.keys(tabLabels) as TabType[]).map((tab) => (
          <Tabbar.Item
            key={tab}
            text={tabLabels[tab]}
            selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab].charAt(0)}
          </Tabbar.Item>
        ))}
      </Tabbar>
    </div>
  );
}
