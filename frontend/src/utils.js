import { getBaseURL } from './api';

export function jwtDecode(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('JWT Decode error:', err);
    return null;
  }
}

export function formatDate(date, preferences) {
  if (!date) return '';
  const prefs = preferences || {};
  const { timezone = 'UTC', dateFormat = 'DD/MM/YY' } = prefs;
  
  const options = {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  };

  const d = new Date(date);
  if (dateFormat === 'MM/DD/YY') {
    return d.toLocaleDateString('en-US', options);
  }
  return d.toLocaleDateString('en-GB', options);
}

export function formatTime(date, preferences) {
  if (!date) return '';
  const prefs = preferences || {};
  const { timezone = 'UTC', timeFormat = '12h' } = prefs;
  
  const options = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  };
  
  return new Date(date).toLocaleTimeString('en-GB', options);
}

export function formatDateTime(date, preferences) {
  if (!date) return '';
  const prefs = preferences || {};
  const { timezone = 'UTC', dateFormat = 'DD/MM/YY', timeFormat = '12h' } = prefs;
  
  const d = new Date(date);
  const datePart = formatDate(date, prefs);
  
  const timeOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  };
  
  const timePart = d.toLocaleTimeString('en-GB', timeOptions);
  return `${datePart}, ${timePart}`;
}

export function getStatusColor(status) {
  const base = 'inline-flex items-center justify-center w-24 px-0 py-1.5 rounded-lg text-xs font-medium capitalize tracking-wider';
  switch (status) {
    case 'Completed': return `${base} bg-emerald-100 text-emerald-700`;
    case 'In Progress': return `${base} bg-blue-100 text-blue-700`;
    case 'Pending': return `${base} bg-amber-100 text-amber-700`;
    case 'Overdue': return `${base} bg-red-100 text-red-700`;
    case 'For Approval': return `${base} bg-purple-100 text-purple-700`;
    default: return `${base} bg-gray-100 text-gray-700`;
  }
}

export function getPriorityColor(priority) {
  const base = 'inline-flex items-center justify-center w-20 px-0 py-1.5 rounded-lg text-xs font-medium capitalize tracking-wider border';
  switch (priority) {
    case 'High': return `${base} border-[#1360C6] bg-[#1360C6] text-white`;
    case 'Medium': return `${base} border-[#1360C6]/75 bg-[#1360C6]/75 text-white`;
    case 'Low': return `${base} border-[#1360C6]/50 bg-[#1360C6]/50 text-white`;
    default: return `${base} border-gray-100 bg-gray-50 text-gray-600`;
  }
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getImageUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  const baseUrl = getBaseURL();
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  return url;
}
