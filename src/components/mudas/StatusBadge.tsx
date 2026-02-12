import { cn } from '@/lib/utils';

type MudaStatus = 'Ativa' | 'Atenção' | 'Falha';

interface StatusBadgeProps {
  status: MudaStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const baseClasses = 'status-badge';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : '';
  
  const statusClasses: Record<MudaStatus, string> = {
    'Ativa': 'status-active',
    'Atenção': 'status-attention',
    'Falha': 'status-failure',
  };

  return (
    <span className={cn(baseClasses, statusClasses[status], sizeClasses)}>
      {status}
    </span>
  );
}
