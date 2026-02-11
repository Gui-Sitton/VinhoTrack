import { MudaStatus } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MudaStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const baseClasses = 'status-badge';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : '';
  
  const statusClasses = {
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
