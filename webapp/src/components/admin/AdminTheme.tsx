import { Button, Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const adminPageStyle: CSSProperties = {
  padding: '16px',
  paddingBottom: '88px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const baseCardStyle: CSSProperties = {
  padding: '18px',
  borderRadius: '20px',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02) 65%, rgba(255,255,255,0.015))',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
};

const heroCardStyle: CSSProperties = {
  ...baseCardStyle,
  padding: '20px',
  background:
    'linear-gradient(135deg, rgba(77, 144, 212, 0.34), rgba(28, 54, 86, 0.72) 58%, rgba(15, 22, 31, 0.96))',
};

export function AdminCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Card style={{ ...baseCardStyle, ...style }}>{children}</Card>;
}

export function AdminHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Card style={heroCardStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {eyebrow && (
          <Text
            style={{
              fontSize: '12px',
              opacity: 0.68,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {eyebrow}
          </Text>
        )}
        <Title level="1" style={{ margin: 0, lineHeight: 1.1 }}>
          {title}
        </Title>
        {description && (
          <Text style={{ fontSize: '14px', opacity: 0.82, lineHeight: 1.45 }}>{description}</Text>
        )}
        {children}
      </div>
    </Card>
  );
}

export function AdminSectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Text style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: '13px', opacity: 0.64 }}>{subtitle}</Text>}
    </div>
  );
}

export function AdminMetric({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '96px',
        padding: '14px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255,255,255,0.04)',
      }}
    >
      <Text style={{ display: 'block', fontSize: '24px', fontWeight: 700 }}>{value}</Text>
      <Text style={{ fontSize: '12px', opacity: 0.6 }}>{label}</Text>
    </div>
  );
}

export function AdminChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'blue' | 'green' | 'orange' | 'red';
}) {
  const stylesByTone: Record<string, CSSProperties> = {
    neutral: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      color: '#d1d5db',
    },
    blue: {
      backgroundColor: 'rgba(46, 166, 255, 0.15)',
      color: '#8ecbff',
    },
    green: {
      backgroundColor: 'rgba(76, 175, 80, 0.18)',
      color: '#7ee787',
    },
    orange: {
      backgroundColor: 'rgba(255, 179, 71, 0.18)',
      color: '#ffcf70',
    },
    red: {
      backgroundColor: 'rgba(244, 67, 54, 0.18)',
      color: '#ff9a92',
    },
  };

  return (
    <div
      style={{
        padding: '6px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        lineHeight: 1,
        fontWeight: 700,
        ...stylesByTone[tone],
      }}
    >
      {label}
    </div>
  );
}

export function AdminActionLink({
  to,
  label,
  description,
}: {
  to: string;
  label: string;
  description: string;
}) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <AdminCard
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <Text style={{ fontSize: '16px', fontWeight: 700 }}>{label}</Text>
        <Text style={{ fontSize: '13px', opacity: 0.7, lineHeight: 1.45 }}>{description}</Text>
      </AdminCard>
    </Link>
  );
}

export function AdminPrimaryButton({
  children,
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  stretched?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <Button size="l" mode="filled" {...props}>
      {children}
    </Button>
  );
}

export function AdminEmptyState({ text }: { text: string }) {
  return (
    <AdminCard style={{ padding: '24px', textAlign: 'center' }}>
      <Text style={{ opacity: 0.62, lineHeight: 1.5 }}>{text}</Text>
    </AdminCard>
  );
}

export function AdminLoadingState() {
  return (
    <div style={{ ...adminPageStyle, justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Spinner size="l" />
      </div>
    </div>
  );
}

export function AdminDeniedState() {
  return (
    <div style={adminPageStyle}>
      <AdminHero
        eyebrow="Доступ"
        title="Доступ запрещён"
        description="У этого аккаунта нет прав для просмотра административной панели."
      />
    </div>
  );
}

export function AdminDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: '10px',
        alignItems: 'start',
      }}
    >
      <Text
        style={{
          fontSize: '12px',
          lineHeight: 1.4,
          opacity: 0.58,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: 1.45 }}>{value}</Text>
    </div>
  );
}
