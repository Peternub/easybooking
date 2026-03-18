import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../../shared/types';
import { getAdminMastersApi, toggleMasterActiveApi } from '../../services/api';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';
import { MasterForm } from './MasterForm';

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
      const data = await getAdminMastersApi();
      setMasters(data);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
      alert('Не удалось загрузить мастеров');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    alert('Удаление мастера сделаем отдельным шагом после настройки новой схемы базы');
  }

  async function handleToggleActive(master: Master) {
    try {
      await toggleMasterActiveApi(master.id, !master.is_active);
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
        <AdminEmptyState text="Мастера еще не добавлены." />
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
                  onClick={handleDelete}
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