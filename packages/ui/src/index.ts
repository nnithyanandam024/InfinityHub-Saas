export const DESIGN_TOKENS = {
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryTint: '#EFF6FF',
    navy: '#0F172A',
    navyLight: '#1E293B',
    body: '#475569',
    background: '#F8FAFC',
    border: '#E2E8F0',
    card: '#FFFFFF',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626'
  },
  fonts: {
    sans: "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
  },
  radii: {
    button: '10px',
    card: '14px',
    badge: '6px',
    input: '8px'
  },
  shadows: {
    soft: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  }
} as const;

export function formatCurrency(amount: number, symbol = '₹', currency = 'INR'): string {
  if (isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString('en-IN');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getStockStatus(stock: number, minStock: number): {
  status: 'normal' | 'low' | 'out';
  label: string;
  badgeClass: string;
} {
  if (stock <= 0) {
    return {
      status: 'out',
      label: 'Out of Stock',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  if (stock <= minStock) {
    return {
      status: 'low',
      label: 'Low Stock',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  return {
    status: 'normal',
    label: 'Normal',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
}
