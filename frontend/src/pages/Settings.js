import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: '',
    designation: '',
    role: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [orgForm, setOrgForm] = useState({
    workingHours: { startTime: '09:00', endTime: '18:00', totalHours: 8 },
    defaultSalaryBreakdown: [],
    timezone: 'UTC',
    dateFormat: 'DD/MM/YY',
    timeFormat: '12h'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [settingsRes, userRes] = await Promise.all([
        api.get('/organization-settings').catch(() => ({ data: { settings: null } })),
        api.get('/me/userinfo').catch(() => ({ data: null })),
      ]);
      const s = settingsRes.data?.settings;
      setSettings(s);
      setUserInfo(userRes.data);
      if (userRes.data) {
        setProfileForm({
          firstName: userRes.data.firstName || '',
          lastName: userRes.data.lastName || '',
          contactNumber: userRes.data.contactNumber || '',
          dateOfBirth: userRes.data.dateOfBirth ? userRes.data.dateOfBirth.split('T')[0] : '',
          gender: userRes.data.gender || '',
          designation: userRes.data.designation || '',
          role: userRes.data.role || ''
        });
      }
      if (s) {
        setOrgForm({
          workingHours: s.workingHours || { startTime: '09:00', endTime: '18:00', totalHours: 8 },
          defaultSalaryBreakdown: s.defaultSalaryBreakdown || [],
          timezone: s.timezone || 'UTC',
          dateFormat: s.dateFormat || 'DD/MM/YY',
          timeFormat: s.timeFormat || '12h'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // Handle overnight shifts
    return parseFloat((diff / 60).toFixed(2));
  };

  const handleTimeChange = (field, value) => {
    const updatedHours = { ...orgForm.workingHours, [field]: value };
    const total = calculateHours(updatedHours.startTime, updatedHours.endTime);
    setOrgForm({
      ...orgForm,
      workingHours: { ...updatedHours, totalHours: total }
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(profileForm).forEach(key => {
        if (profileForm[key]) {
          // Limitation: Only admin can update role and designation
          if (['role', 'designation'].includes(key)) {
            if (user?.role === 'admin') {
              formData.append(key, profileForm[key]);
            }
          } else {
            formData.append(key, profileForm[key]);
          }
        }
      });
      
      if (avatar) formData.append('avatar', avatar);

      await api.patch(`/me/update-user/${userInfo._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      setAvatar(null);
      setPreviewUrl(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    const totalPercentage = orgForm.defaultSalaryBreakdown.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
    
    if (orgForm.defaultSalaryBreakdown.length > 0 && totalPercentage !== 100) {
      return toast.error(`Total percentage must be exactly 100% (Currently ${totalPercentage}%)`);
    }

    setSaving(true);
    try {
      await api.patch('/organization-settings', orgForm);
      toast.success('Organization settings updated');
      setEditingOrg(false);
      loadData();
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  const addComponent = () => {
    setOrgForm({
      ...orgForm,
      defaultSalaryBreakdown: [...orgForm.defaultSalaryBreakdown, { name: '', percentage: 0 }]
    });
  };

  const removeComponent = (index) => {
    const updated = orgForm.defaultSalaryBreakdown.filter((_, i) => i !== index);
    setOrgForm({ ...orgForm, defaultSalaryBreakdown: updated });
  };

  const updateComponent = (index, field, value) => {
    const updated = [...orgForm.defaultSalaryBreakdown];
    updated[index] = { ...updated[index], [field]: value };
    setOrgForm({ ...orgForm, defaultSalaryBreakdown: updated });
  };

  const handleAddCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.info('Getting current coordinates...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const newLoc = {
          name: 'Office Location',
          coordinates: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          geofenceRadius: 100
        };
        await api.post('/organization-settings/locations', newLoc);
        toast.success('Office location added');
        loadData();
      } catch (e) {
        toast.error('Failed to add location');
      }
    }, (err) => toast.error('Location access denied'));
  };

  const handleDeleteLocation = async (locId) => {
    if (!window.confirm('Remove this office location?')) return;
    try {
      await api.delete(`/organization-settings/locations/${locId}`);
      toast.success('Location removed');
      loadData();
    } catch (e) {
      toast.error('Failed to remove location');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const currentTotalPercent = orgForm.defaultSalaryBreakdown.reduce((sum, i) => sum + (parseFloat(i.percentage) || 0), 0);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto" data-testid="settings-page">
      <h1 className="text-2xl font-semibold text-secondary mb-6">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-black/50 p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-secondary">Account Profile</h2>
          {!editingProfile && (
            <button onClick={() => setEditingProfile(true)} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-2">
              <i className="fa-solid fa-user-pen" /> Edit Profile
            </button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-semibold text-primary shadow-inner overflow-hidden border-2 border-white ring-4 ring-gray-50/50">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : userInfo?.avatar?.path ? (
                    <img src={`${api.defaults.baseURL}${userInfo.avatar.path}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userInfo?.firstName?.[0]}{userInfo?.lastName?.[0]}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <i className="fa-solid fa-camera text-xs" />
                  <input type="file" className="hidden" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setAvatar(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }} />
                </label>
              </div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mt-4 tracking-widest">Change Profile Photo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">First Name</label>
                <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Last Name</label>
                <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Contact Number</label>
                <input type="text" placeholder="+1234567890" value={profileForm.contactNumber} onChange={e => setProfileForm({...profileForm, contactNumber: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Date of Birth</label>
                <input type="date" value={profileForm.dateOfBirth} onChange={e => setProfileForm({...profileForm, dateOfBirth: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Gender</label>
                <select value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              {user?.role === 'admin' && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Designation</label>
                    <input type="text" value={profileForm.designation} onChange={e => setProfileForm({...profileForm, designation: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Role</label>
                    <select value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all">
                      <option value="employee">Employee</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => { setEditingProfile(false); setPreviewUrl(null); setAvatar(null); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fa-solid fa-check" />} Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[30%_70%] gap-y-6 gap-x-12 w-full">
            {/* Left side: PFP and Email */}
            <div className="flex flex-col items-center shrink-0 md:pr-3 md:border-r border-gray-100">
              <div className="w-28 h-28 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-semibold text-primary shadow-inner mb-4 overflow-hidden border-2 border-white ring-4 ring-gray-50/50">
                {userInfo?.avatar?.path ? (
                  <img src={`${api.defaults.baseURL}${userInfo.avatar.path}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInfo?.firstName?.[0]}{userInfo?.lastName?.[0]}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-medium text-secondary">{userInfo?.email}</p>
              </div>
            </div>

            {/* Right side: Other details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-sm font-medium text-secondary">{userInfo?.firstName} {userInfo?.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Contact Number</p>
                <p className="text-sm font-medium text-secondary">{userInfo?.contactNumber || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="text-sm font-medium text-secondary">{userInfo?.dateOfBirth ? new Date(userInfo.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                <p className="text-sm font-medium text-secondary capitalize">{userInfo?.gender || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Designation</p>
                <p className="text-sm font-medium text-secondary">{userInfo?.designation || (userInfo?.role === 'admin' ? 'Administrator' : 'Employee')}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">System Role</p>
                <p className="text-sm font-medium text-secondary capitalize">{userInfo?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {user?.role === 'admin' && (
        <>
          {/* Organization Configuration */}
          <div className="bg-white rounded-2xl border border-black/50 p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-secondary">Organization Configuration</h2>
              {!editingOrg && (
                <button onClick={() => setEditingOrg(true)} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-2">
                  <i className="fa-solid fa-pen-to-square" /> Edit Configuration
                </button>
              )}
            </div>

            {editingOrg ? (
              <form onSubmit={handleUpdateOrg} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Timezone</label>
                    <select value={orgForm.timezone} onChange={e => setOrgForm({...orgForm, timezone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                      <option value="UTC">UTC (00:00)</option>
                      <option value="Asia/Kolkata">IST (India +5:30)</option>
                      <option value="America/New_York">EST (Eastern Standard Time -5:00)</option>
                      <option value="America/Chicago">CST (Central Standard Time -6:00)</option>
                      <option value="America/Los_Angeles">PST (Pacific Standard Time -8:00)</option>
                      <option value="Europe/London">GMT (London +0:00)</option>
                      <option value="Asia/Dubai">GST (Dubai +4:00)</option>
                      <option value="Australia/Sydney">AEST (Sydney +10:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Date Format</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setOrgForm({...orgForm, dateFormat: 'DD/MM/YY'})} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${orgForm.dateFormat === 'DD/MM/YY' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>DD/MM/YY</button>
                      <button type="button" onClick={() => setOrgForm({...orgForm, dateFormat: 'MM/DD/YY'})} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${orgForm.dateFormat === 'MM/DD/YY' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>MM/DD/YY</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Time Format</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setOrgForm({...orgForm, timeFormat: '12h'})} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${orgForm.timeFormat === '12h' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>12 Hour</button>
                      <button type="button" onClick={() => setOrgForm({...orgForm, timeFormat: '24h'})} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${orgForm.timeFormat === '24h' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>24 Hour</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                    <input type="time" value={orgForm.workingHours.startTime} onChange={e => handleTimeChange('startTime', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">End Time</label>
                    <input type="time" value={orgForm.workingHours.endTime} onChange={e => handleTimeChange('endTime', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Daily Hours (Auto)</label>
                    <input type="number" readOnly value={orgForm.workingHours.totalHours} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm outline-none text-gray-500 cursor-not-allowed font-semibold" />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-md font-semibold text-secondary">Default Salary Parts Breakdown</h3>
                      <p className="text-xs text-gray-400 mt-1">Define how the total salary is divided into parts (must sum to 100%).</p>
                    </div>
                    <div className={`text-sm font-semibold ${currentTotalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                      Total: {currentTotalPercent}%
                    </div>
                  </div>
                  <div className="space-y-3 overflow-x-auto">
                    <button type="button" onClick={addComponent} className="text-primary text-xs font-semibold hover:underline mb-2">+ Add Part</button>
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="py-2 text-left">Part Name</th>
                          <th className="py-2 text-center w-24">Percent</th>
                          <th className="py-2 text-right w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orgForm.defaultSalaryBreakdown.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3 pr-2">
                              <input 
                                placeholder="Basic, HRA..." 
                                value={comp.name} 
                                onChange={e => updateComponent(idx, 'name', e.target.value)} 
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none" 
                              />
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input 
                                  type="number" 
                                  value={comp.percentage} 
                                  onChange={e => updateComponent(idx, 'percentage', parseFloat(e.target.value))} 
                                  className="w-20 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs text-center font-semibold focus:ring-1 focus:ring-primary/20 outline-none" 
                                />
                                <span className="text-xs text-gray-400 font-semibold">%</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <button 
                                type="button" 
                                onClick={() => removeComponent(idx)} 
                                className="text-red-400 hover:text-red-600 px-2 transition-colors"
                              >
                                <i className="fa-solid fa-trash-can text-xs" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setEditingOrg(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold">Save Organization Settings</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl border border-black/50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Regional Settings</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-secondary">
                      <span className="text-gray-400">Timezone</span>
                      <span>{settings?.timezone || 'UTC'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-secondary">
                      <span className="text-gray-400">Date Format</span>
                      <span>{settings?.dateFormat || 'DD/MM/YY'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-secondary">
                      <span className="text-gray-400">Time Format</span>
                      <span>{settings?.timeFormat === '24h' ? '24 Hour' : '12 Hour'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-black/50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Operation Timing</p>
                  <div className="flex justify-between text-sm font-semibold text-secondary">
                    <span>{settings?.workingHours?.startTime} - {settings?.workingHours?.endTime}</span>
                    <span>{settings?.workingHours?.totalHours}h Daily</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-black/50 overflow-x-auto">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Salary Breakdown</p>
                  <table className="w-full">
                    <thead>
                      <tr className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                        <th className="py-1 text-left">Component</th>
                        <th className="py-1 text-right">Percent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {settings?.defaultSalaryBreakdown?.map((part, i) => (
                        <tr key={i} className="text-[10px] font-semibold text-secondary">
                          <td className="py-2">{part.name}</td>
                          <td className="py-2 text-right">{part.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!settings?.defaultSalaryBreakdown || settings.defaultSalaryBreakdown.length === 0) && <p className="text-[10px] text-gray-400 mt-2">Not configured</p>}
                </div>
              </div>
            )}
          </div>

          {/* Office Locations */}
          <div className="bg-white rounded-2xl border border-black/50 p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-secondary">Office Locations (100m Geofencing)</h2>
              <button onClick={handleAddCurrentLocation} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center gap-2">
                <i className="fa-solid fa-location-crosshairs" /> Add My Current Location
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings?.officeLocations?.map((loc) => (
                <div key={loc._id} className="p-4 bg-gray-50 rounded-2xl border border-black/50 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><i className="fa-solid fa-building" /></div>
                    <div>
                      <p className="text-sm font-semibold text-secondary">{loc.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{loc.coordinates.latitude.toFixed(4)}, {loc.coordinates.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteLocation(loc._id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can" /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
