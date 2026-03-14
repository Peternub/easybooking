import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';
import { ServiceForm } from './ServiceForm';

interface RelatedBooking {
  id: string;
  admin_notes: string | null;
}

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase.from('services').select('*').order('name');

      if (error) {
        throw error;
      }

      setServices(data || []);
    } catch (error) {
      console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СѓСЃР»СѓРі:', error);
      alert('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СѓСЃР»СѓРіРё');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) {
        throw error;
      }

      alert(
        service.is_active
          ? 'РЈСЃР»СѓРіР° РґРµР°РєС‚РёРІРёСЂРѕРІР°РЅР°'
          : 'РЈСЃР»СѓРіР° Р°РєС‚РёРІРёСЂРѕРІР°РЅР°',
      );
      loadServices();
    } catch (error) {
      console.error('РћС€РёР±РєР° РёР·РјРµРЅРµРЅРёСЏ СЃС‚Р°С‚СѓСЃР° СѓСЃР»СѓРіРё:', error);
      alert('РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РјРµРЅРёС‚СЊ СЃС‚Р°С‚СѓСЃ СѓСЃР»СѓРіРё');
    }
  }

  async function handleDelete(serviceId: string) {
    if (
      !confirm(
        'РЈРґР°Р»РёС‚СЊ СЌС‚Сѓ СѓСЃР»СѓРіСѓ? РСЃС‚РѕСЂРёСЏ Р·Р°РїРёСЃРµР№ СЃРѕС…СЂР°РЅРёС‚СЃСЏ, РЅРѕ СѓСЃР»СѓРіР° РёСЃС‡РµР·РЅРµС‚ РёР· РєР°С‚Р°Р»РѕРіР°.',
      )
    ) {
      return;
    }

    try {
      const service = services.find((item) => item.id === serviceId);
      const deletedServiceNote = service?.name
        ? `[РЈРґР°Р»РµРЅР° СѓСЃР»СѓРіР°: ${service.name}]`
        : '[РЈРґР°Р»РµРЅР° СѓСЃР»СѓРіР°]';

      const { data: relatedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, admin_notes')
        .eq('service_id', serviceId);

      if (bookingsError) {
        throw bookingsError;
      }

      for (const booking of (relatedBookings || []) as RelatedBooking[]) {
        const nextAdminNotes = booking.admin_notes
          ? `${booking.admin_notes}\n${deletedServiceNote}`
          : deletedServiceNote;

        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({
            service_id: null,
            admin_notes: nextAdminNotes,
          })
          .eq('id', booking.id);

        if (bookingUpdateError) {
          throw bookingUpdateError;
        }
      }

      const { error: reviewsError } = await supabase
        .from('reviews')
        .update({ service_id: null })
        .eq('service_id', serviceId);

      if (reviewsError) {
        throw reviewsError;
      }

      const { error: masterServicesError } = await supabase
        .from('master_services')
        .delete()
        .eq('service_id', serviceId);

      if (masterServicesError) {
        throw masterServicesError;
      }

      const { error: deleteError } = await supabase.from('services').delete().eq('id', serviceId);

      if (deleteError) {
        throw deleteError;
      }

      alert('РЈСЃР»СѓРіР° СѓРґР°Р»РµРЅР°');
      loadServices();
    } catch (error) {
      console.error('РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ СѓСЃР»СѓРіРё:', error);
      alert('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СѓСЃР»СѓРіСѓ');
    }
  }

  function handleEdit(service: Service) {
    setEditingService(service);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingService(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (showForm) {
    return <ServiceForm service={editingService} onClose={handleFormClose} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminPrimaryButton stretched onClick={handleAdd}>
        + Р”РѕР±Р°РІРёС‚СЊ СѓСЃР»СѓРіСѓ
      </AdminPrimaryButton>

      {services.length === 0 ? (
        <AdminEmptyState text="РЈСЃР»СѓРіРё РµС‰С‘ РЅРµ РґРѕР±Р°РІР»РµРЅС‹." />
      ) : (
        services.map((service) => (
          <AdminCard key={service.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'var(--app-text)',
                  }}
                >
                  {service.name}
                </Text>
                <AdminChip
                  label={service.is_active ? 'РђРєС‚РёРІРЅР°' : 'РЎРєСЂС‹С‚Р°'}
                  tone={service.is_active ? 'green' : 'orange'}
                />
                {service.category && <AdminChip label={service.category} tone="blue" />}
              </div>

              {service.description && (
                <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)', lineHeight: 1.5 }}>
                  {service.description}
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
                <AdminDetailRow label="Р¦РµРЅР°" value={`${service.price} в‚Ѕ`} />
                {!service.description && !service.category && (
                  <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                    РћРїРёСЃР°РЅРёРµ Рё РєР°С‚РµРіРѕСЂРёСЏ РїРѕРєР° РЅРµ Р·Р°РїРѕР»РЅРµРЅС‹.
                  </Text>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button mode="outline" size="s" onClick={() => handleEdit(service)}>
                  РР·РјРµРЅРёС‚СЊ
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleToggleActive(service)}
                  style={{ color: 'var(--app-accent-strong)' }}
                >
                  {service.is_active ? 'Р”РµР°РєС‚РёРІРёСЂРѕРІР°С‚СЊ' : 'РђРєС‚РёРІРёСЂРѕРІР°С‚СЊ'}
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleDelete(service.id)}
                  style={{ color: 'var(--app-danger)' }}
                >
                  РЈРґР°Р»РёС‚СЊ
                </Button>
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}
