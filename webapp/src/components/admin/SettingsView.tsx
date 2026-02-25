import { Button, Card, Section, Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<'services' | 'masters'>('services');

  return (
    <div style={{ padding: '16px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Настройки
      </Title>

      {/* Переключатель разделов */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          mode={activeSection === 'services' ? 'filled' : 'outline'}
          onClick={() => setActiveSection('services')}
          style={{ flex: 1 }}
        >
          Услуги
        </Button>
        <Button
          mode={activeSection === 'masters' ? 'filled' : 'outline'}
          onClick={() => setActiveSection('masters')}
          style={{ flex: 1 }}
        >
          Мастера
        </Button>
      </div>

      {activeSection === 'services' ? <ServicesSection /> : <MastersSection />}
    </div>
  );
}

function ServicesSection() {
  return (
    <div>
      <Button size="l" stretched style={{ marginBottom: '16px' }}>
        + Добавить услугу
      </Button>

      <Section header="Активные услуги">
        <Card style={{ padding: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>Стрижка мужская</Text>
              <Text style={{ fontSize: '14px', opacity: 0.6 }}>45 минут</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>1500 ₽</Text>
              <Button mode="plain" size="s">
                Изменить
              </Button>
            </div>
          </div>
        </Card>

        <Text style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center', marginTop: '16px' }}>
          Функционал в разработке
        </Text>
      </Section>
    </div>
  );
}

function MastersSection() {
  return (
    <div>
      <Button size="l" stretched style={{ marginBottom: '16px' }}>
        + Добавить мастера
      </Button>

      <Section header="Активные мастера">
        <Card style={{ padding: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>Анна Иванова</Text>
              <Text style={{ fontSize: '14px', opacity: 0.6 }}>
                Опытный мастер с 5-летним стажем работы
              </Text>
            </div>
            <Button mode="plain" size="s">
              Изменить
            </Button>
          </div>
        </Card>

        <Text style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center', marginTop: '16px' }}>
          Функционал в разработке
        </Text>
      </Section>
    </div>
  );
}
