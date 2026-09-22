import type { ReactNode } from 'react';

interface Props {
  variant?: 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  title?: string;
  icon?: string;
  children: ReactNode;
}

const DEFAULT_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  danger: '⛔',
  success: '✓',
  neutral: '•',
};

export function Callout({ variant = 'neutral', title, icon, children }: Props) {
  return (
    <div className={`callout ${variant === 'neutral' ? '' : `callout-${variant}`}`}>
      <span className="callout-icon" aria-hidden="true">{icon ?? DEFAULT_ICONS[variant]}</span>
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}
