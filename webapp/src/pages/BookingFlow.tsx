import { useState } from 'react';
import { BookingConfirmation } from '../components/BookingConfirmation';
import { SelectDateTime } from '../components/SelectDateTime';
import { SelectMaster } from '../components/SelectMaster';
import { SelectService } from '../components/SelectService';

type Step = 'service' | 'master' | 'datetime' | 'confirmation';

export function BookingFlow() {
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmationKey, setConfirmationKey] = useState(0);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep('master');
  };

  const handleMasterSelect = (masterId: string) => {
    setSelectedMaster(masterId);
    setStep('datetime');
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setConfirmationKey((prev) => prev + 1); // Увеличиваем счетчик для пересоздания компонента
    setStep('confirmation');
  };

  const handleBackFromConfirmation = () => {
    setStep('datetime');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleBack = () => {
    if (step === 'master') {
      setStep('service');
      setSelectedService(null);
    } else if (step === 'datetime') {
      setStep('master');
      setSelectedMaster(null);
    } else if (step === 'confirmation') {
      handleBackFromConfirmation();
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {step === 'service' && <SelectService onSelect={handleServiceSelect} />}

      {step === 'master' && selectedService && (
        <SelectMaster
          serviceId={selectedService}
          onSelect={handleMasterSelect}
          onBack={handleBack}
        />
      )}

      {step === 'datetime' && selectedMaster && (
        <SelectDateTime
          masterId={selectedMaster}
          onSelect={handleDateTimeSelect}
          onBack={handleBack}
        />
      )}

      {step === 'confirmation' &&
        selectedService &&
        selectedMaster &&
        selectedDate &&
        selectedTime && (
          <BookingConfirmation
            key={confirmationKey}
            serviceId={selectedService}
            masterId={selectedMaster}
            date={selectedDate}
            time={selectedTime}
            onBack={handleBackFromConfirmation}
          />
        )}
    </div>
  );
}
