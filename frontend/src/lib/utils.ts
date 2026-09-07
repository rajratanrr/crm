export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700', CONTACTED: 'bg-yellow-100 text-yellow-700',
    MEETING_SCHEDULED: 'bg-purple-100 text-purple-700', QUOTATION_SENT: 'bg-orange-100 text-orange-700',
    NEGOTIATION: 'bg-indigo-100 text-indigo-700', WON: 'bg-green-100 text-green-700', LOST: 'bg-red-100 text-red-700',
    UPCOMING: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-700', SENT: 'bg-blue-100 text-blue-700', SIGNED: 'bg-purple-100 text-purple-700',
    ACTIVE: 'bg-green-100 text-green-700', PAID: 'bg-green-100 text-green-700', OVERDUE: 'bg-red-100 text-red-700',
    TODO: 'bg-gray-100 text-gray-700', PENDING: 'bg-yellow-100 text-yellow-700',
    IN_PRODUCTION: 'bg-blue-100 text-blue-700', READY: 'bg-green-100 text-green-700', DELIVERED: 'bg-emerald-100 text-emerald-700',
    ASSIGNED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-purple-100 text-purple-700',
    LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
