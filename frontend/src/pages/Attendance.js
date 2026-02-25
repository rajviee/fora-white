import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { formatDate, formatDateTime } from '../utils';

export default function Attendance() {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/history'),
      ]);
      setTodayStatus(statusRes.data);
      setHistory(historyRes.data?.records || []);
      setStats(historyRes.data?.stats || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const coords = await getLocation();
      await api.post('/attendance/check-in', { coordinates: coords, accuracy: coords.accuracy });
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Check-in failed');
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const coords = await getLocation();
      await api.post('/attendance/check-out', { coordinates: coords, accuracy: coords.accuracy });
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Check-out failed');
    }
    setActionLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const hasCheckedIn = todayStatus?.hasCheckedIn;
  const hasCheckedOut = todayStatus?.hasCheckedOut;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto" data-testid="attendance-page">
      <h1 className="text-2xl font-bold text-secondary mb-6">Attendance</h1>

      {/* Today's Status */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6" data-testid="attendance-today">
        <h2 className="text-lg font-semibold text-secondary mb-4">Today's Status</h2>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${hasCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              <i className="fa-solid fa-right-to-bracket" />
            </div>
            <p className="text-xs text-gray-500">Check In</p>
            {hasCheckedIn && <p className="text-xs font-medium text-secondary mt-0.5">{formatDateTime(todayStatus.attendance?.checkIn?.time)}</p>}
          </div>

          <div className="h-px w-16 bg-gray-200" />

          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${hasCheckedOut ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              <i className="fa-solid fa-right-from-bracket" />
            </div>
            <p className="text-xs text-gray-500">Check Out</p>
            {hasCheckedOut && <p className="text-xs font-medium text-secondary mt-0.5">{formatDateTime(todayStatus.attendance?.checkOut?.time)}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {!hasCheckedIn ? (
            <button onClick={handleCheckIn} disabled={actionLoading} className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="check-in-btn">
              {actionLoading ? 'Getting location...' : 'Check In'}
            </button>
          ) : !hasCheckedOut ? (
            <button onClick={handleCheckOut} disabled={actionLoading} className="px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50" data-testid="check-out-btn">
              {actionLoading ? 'Getting location...' : 'Check Out'}
            </button>
          ) : (
            <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm">
              <i className="fa-solid fa-circle-check mr-2" /> Today's attendance recorded
            </div>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.present || 0}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.absent || 0}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.halfDay || 0}</p>
            <p className="text-xs text-gray-500">Half Day</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.attendancePercentage || 0}%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-secondary mb-4">This Month</h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">No records this month</p>
        ) : (
          <div className="space-y-2">
            {history.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50" data-testid={`attendance-record-${idx}`}>
                <div>
                  <p className="text-sm font-medium text-secondary">{formatDate(record.date)}</p>
                  <p className="text-xs text-gray-400">
                    {record.checkIn?.time ? formatDateTime(record.checkIn.time) : '--'} - {record.checkOut?.time ? formatDateTime(record.checkOut.time) : '--'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  record.status === 'half-day' ? 'bg-amber-100 text-amber-700' :
                  record.status === 'on-leave' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>{record.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
