import type { CSSProperties } from 'react';

export const pageShellStyle: CSSProperties = {
  padding: '16px',
  paddingBottom: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

export const surfaceCardStyle: CSSProperties = {
  padding: '18px',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(255,250,243,0.98), rgba(248,238,226,0.96))',
  border: '1px solid var(--app-border)',
  boxShadow: 'var(--app-shadow)',
};

export const titleStyle: CSSProperties = {
  marginBottom: '16px',
  color: 'var(--app-text)',
  lineHeight: 1.08,
};

export const mutedTextStyle: CSSProperties = {
  color: 'var(--app-text-soft)',
  lineHeight: 1.5,
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '16px',
  border: '1px solid var(--app-border)',
  borderRadius: '14px',
  backgroundColor: 'var(--app-surface)',
  color: 'var(--app-text)',
  outline: 'none',
};

export const backButtonStyle: CSSProperties = {
  marginBottom: '8px',
  color: 'var(--app-accent-strong)',
};

export const softPanelStyle: CSSProperties = {
  padding: '14px',
  borderRadius: '18px',
  backgroundColor: 'var(--app-surface-muted)',
};
