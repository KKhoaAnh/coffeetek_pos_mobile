export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDateDMY = (value: string | Date | null | undefined) => {
  if (!value) return '';

  if (value instanceof Date) {
    const d = value;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = value.toString();

  const datePart = str.includes('T') ? str.split('T')[0] : str;
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }

  return str;
};

export const formatTimeHM = (value: string | null | undefined) => {
  if (!value) return '';

  const str = value.toString();
  let time = str;

  if (str.includes('T')) {
    const parts = str.split('T');
    if (parts[1]) {
      time = parts[1].split(/[Z ]/)[0];
    }
  }

  const segments = time.split(':');
  const h = segments[0] || '00';
  const m = segments[1] || '00';

  const hh = String(parseInt(h, 10) || 0).padStart(2, '0');
  const mm = String(parseInt(m, 10) || 0).padStart(2, '0');

  return `${hh}:${mm}`;
};
