import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/organization-settings').catch(() => ({ data: null })),
      api.get('/me/userinfo').catch(() => ({ data: null })),
    ]).then(([settingsRes, userRes]) => {
      setSettings(settingsRes.data);
      setUserInfo(userRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in max-w-3xl" data-testid="settings-page">
      <h1 className="text-xl sm:text-2xl font-bold text-secondary mb-4 sm:mb-6">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4">
        <h2 className="text-base font-semibold text-secondary mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {userInfo?.firstName?.[0]}{userInfo?.lastName?.[0]}
          </div>
          <div>
            <p className="text-base font-semibold text-secondary">{userInfo?.firstName} {userInfo?.lastName}</p>
            <p className="text-sm text-gray-500">{userInfo?.email}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{userInfo?.role} &middot; {userInfo?.designation || 'No designation'}</p>
          </div>
        </div>
      </div>

      {/* Organization Settings (admin only) */}
      {user?.role === 'admin' && settings && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4">
          <h2 className="text-base font-semibold text-secondary mb-4">Organization Settings</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Working Hours</span>
              <span className="text-secondary font-medium">{settings.workingHours?.startTime || '09:00'} - {settings.workingHours?.endTime || '18:00'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Work Hours</span>
              <span className="text-secondary font-medium">{settings.workingHours?.totalHours || 9}h</span>
            </div>
            {settings.officeLocations?.map((loc, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{loc.name}</span>
                <span className="text-secondary text-xs">{loc.address || `${loc.coordinates?.latitude?.toFixed(4)}, ${loc.coordinates?.longitude?.toFixed(4)}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-secondary mb-4">Appearance</h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-600">Theme</span>
          <span className="text-sm text-secondary font-medium">Light</span>
        </div>
      </div>
    </div>
  );
}
