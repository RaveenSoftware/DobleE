import { CustomerTier } from '../types';

export const formatMoney = (amount: number, symbol = '$'): string => {
  return `${symbol} ${Math.round(amount).toLocaleString('es-CO')}`;
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatDateShort = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const getTierBadge = (tier: CustomerTier) => {
  switch (tier) {
    case 'Diamante':
      return {
        name: 'Diamante',
        bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        text: 'text-cyan-700',
        bonus: '+20% acumulación extra',
      };
    case 'Oro':
      return {
        name: 'Oro',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        text: 'text-amber-700',
        bonus: '+15% acumulación extra',
      };
    case 'Plata':
      return {
        name: 'Plata',
        bg: 'bg-slate-100 text-slate-800 border-slate-300',
        text: 'text-slate-700',
        bonus: '+10% acumulación extra',
      };
    case 'Bronce':
    default:
      return {
        name: 'Bronce',
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        text: 'text-orange-700',
        bonus: 'Nivel inicial',
      };
  }
};
