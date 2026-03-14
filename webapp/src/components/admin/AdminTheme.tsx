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
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,250,243,0.98), rgba(248,238,226,0.96))',
  border: '1px solid var(--app-border)',
  boxShadow: 'var(--app-shadow)',
};

const heroCardStyle: CSSProperties = {
  ...baseCardStyle,
  background: 'linear-gradient(180deg, #f8efe5, #efdfcd)',
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
              color: 'var(--app-text-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {eyebrow}
          </Text>
        )}
        <Title level="1" style={{ margin: 0, lineHeight: 1.1, color: 'var(--app-text)' }}>
          {title}
        </Title>
        {description && (
          <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)', lineHeight: 1.45 }}>
            {description}
          </Text>
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
      <Text
        style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: 'var(--app-text)' }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: '13px', color: 'var(--app-text-soft)' }}>{subtitle}</Text>
      )}
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
        backgroundColor: 'var(--app-surface-muted)',
      }}
    >
      <Text
        style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: 'var(--app-text)' }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: '12px', color: 'var(--app-text-soft)' }}>{label}</Text>
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
      backgroundColor: '#efe1d2',
      color: '#6f5746',
    },
    blue: {
      backgroundColor: '#eadbc8',
      color: '#7b614e',
    },
    green: {
      backgroundColor: '#e8d8c7',
      color: '#7f654d',
    },
    orange: {
      backgroundColor: '#efdbc4',
      color: '#8d6949',
    },
    red: {
      backgroundColor: '#edd7cd',
      color: '#8a5f51',
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
        <Text style={{ fontSize: '16px', fontWeight: 700, color: 'var(--app-text)' }}>{label}</Text>
        <Text style={{ fontSize: '13px', color: 'var(--app-text-soft)', lineHeight: 1.45 }}>
          {description}
        </Text>
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
    <Button
      size="l"
      mode="filled"
      style={{
        backgroundColor: 'var(--app-accent)',
        color: '#fffaf3',
        borderRadius: '18px',
        border: 'none',
        boxShadow: '0 10px 22px rgba(141, 103, 66, 0.16)',
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AdminEmptyState({ text }: { text: string }) {
  return (
    <AdminCard style={{ padding: '24px', textAlign: 'center' }}>
      <Text style={{ color: 'var(--app-text-soft)', lineHeight: 1.5 }}>{text}</Text>
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
          color: 'var(--app-text-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: 1.45, color: 'var(--app-text)' }}>{value}</Text>
    </div>
  );
}
