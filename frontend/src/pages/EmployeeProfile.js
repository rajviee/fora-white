import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';
import { formatDate, formatDateTime } from '../utils';
import { toast } from 'sonner';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Salary editing state
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    totalSalary: 0,
    breakdown: []
  });
  const [savingSalary, setSavingSalary] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [attRes, salRecRes, salConfigRes] = await Promise.all([
        api.get(`/attendance/analytics/${id}`).catch(() => ({ data: null })),
        api.get(`/salary/records/${id}?year=${new Date().getFullYear()}`).catch(() => ({ data: { records: [] } })),
        api.get(`/salary/config/${id}`).catch(() => ({ data: { config: null } })),
      ]);

      // Get employee details
      const empList = await api.get('/emp-list?perPage=100').catch(() => ({ data: { employees: [] } }));
      const allEmps = [...(empList.data?.employees || [])];
      const emp = allEmps.find(e => e._id === id);
      setEmployee(emp);

      if (attRes.data) {
        setAttendance(attRes.data.records || attRes.data.attendance || []);
        setAttendanceStats(attRes.data.stats || attRes.data.summary);
      }
      
      setSalaryRecords(salRecRes.data?.records || []);
      
      const config = salConfigRes.data?.config;
      setSalaryConfig(config);
      
      if (config) {
        setSalaryForm({
          totalSalary: config.totalSalary || 0,
          breakdown: config.breakdown || []
        });
      } else {
        // Fetch organization defaults
        const orgRes = await api.get('/organization-settings').catch(() => ({ data: { settings: null } }));
        const defaults = orgRes.data?.settings?.defaultSalaryBreakdown;
        if (defaults) {
          setSalaryForm({
            totalSalary: 0,
            breakdown: defaults || []
          });
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    const totalPercentage = salaryForm.breakdown.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
    
    if (salaryForm.breakdown.length > 0 && totalPercentage !== 100) {
      return toast.error(`Total percentage must be exactly 100% (Currently ${totalPercentage}%)`);
    }

    setSavingSalary(true);
    try {
      await api.put(`/salary/config/${id}`, salaryForm);
      toast.success('Salary configuration updated');
      setIsEditingSalary(false);
      loadData();
    } catch (error) {
      toast.error('Failed to update salary');
    }
    setSavingSalary(false);
  };

  const addPart = () => {
    setSalaryForm({
      ...salaryForm,
      breakdown: [...salaryForm.breakdown, { name: '', percentage: 0 }]
    });
  };

  const removePart = (index) => {
    setSalaryForm({
      ...salaryForm,
      breakdown: salaryForm.breakdown.filter((_, i) => i !== index)
    });
  };

  const updatePart = (index, field, value) => {
    const updated = [...salaryForm.breakdown];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryForm({ ...salaryForm, breakdown: updated });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isAdmin = currentUser?.role === 'admin';
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const workingDays = 26;
  const presentDays = attendanceStats?.present || 0;
  const absentDays = attendanceStats?.absent || 0;
  const attendancePct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  const currentTotalPercent = salaryForm.breakdown.reduce((sum, i) => sum + (parseFloat(i.percentage) || 0), 0);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto" data-testid="employee-profile-page">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0 mt-1 shadow-sm">
          <i className="fa-solid fa-arrow-left text-gray-500 text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/20">
              {employee?.firstName?.[0]}{employee?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary">{employee?.firstName} {employee?.lastName}</h1>
              <p className="text-sm text-gray-500 font-medium">{employee?.designation || (employee?.role === 'admin' ? 'Administrator' : 'Employee')} &middot; {employee?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl mb-6 backdrop-blur-sm border border-gray-100">
        {['overview', 'attendance', 'salary'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === t ? 'bg-white shadow-md text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', val: presentDays, icon: 'fa-calendar-check', color: 'emerald' },
              { label: 'Absent', val: absentDays, icon: 'fa-calendar-xmark', color: 'red' },
              { label: 'Half Day', val: attendanceStats?.halfDay || 0, icon: 'fa-clock', color: 'amber' },
              { label: 'Rate', val: `${attendancePct}%`, icon: 'fa-chart-pie', color: 'primary' }
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center mx-auto mb-3`}>
                  <i className={`fa-solid ${s.icon} text-${s.color === 'primary' ? 'primary' : s.color + '-600'}`} />
                </div>
                <p className="text-2xl font-bold text-secondary">{s.val}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 text-secondary font-bold">Attendance Log</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="py-4 px-6 text-left">Date</th>
                  <th className="py-4 px-6 text-left">Check In</th>
                  <th className="py-4 px-6 text-left">Check Out</th>
                  <th className="py-4 px-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-semibold text-secondary">{formatDate(record.date)}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{record.checkIn?.time ? formatDateTime(record.checkIn.time) : '-'}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{record.checkOut?.time ? formatDateTime(record.checkOut.time) : '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>{record.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="space-y-6">
          {isAdmin && (
            <div className="flex justify-end">
              <button 
                onClick={() => setIsEditingSalary(!isEditingSalary)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isEditingSalary ? 'bg-gray-100 text-gray-600' : 'bg-primary text-white shadow-lg shadow-primary/20'
                }`}
              >
                <i className={`fa-solid ${isEditingSalary ? 'fa-xmark' : 'fa-gear'}`} />
                {isEditingSalary ? 'Cancel Editing' : 'Configure Custom Breakdown'}
              </button>
            </div>
          )}

          {isEditingSalary ? (
            <form onSubmit={handleUpdateSalary} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Monthly Salary (₹)</label>
                  <input type="number" value={salaryForm.totalSalary} onChange={e => setSalaryForm({...salaryForm, totalSalary: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salary Parts Breakdown</p>
                    <div className={`text-xs font-bold ${currentTotalPercent === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {currentTotalPercent}%
                    </div>
                  </div>
                  <button type="button" onClick={addPart} className="text-primary text-[10px] font-bold uppercase hover:underline">+ Add Part</button>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="py-2 text-left">Part Name</th>
                          <th className="py-2 text-center w-24">Percent</th>
                          <th className="py-2 text-right w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {salaryForm.breakdown.map((part, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3 pr-2">
                              <input 
                                placeholder="Name" 
                                value={part.name} 
                                onChange={e => updatePart(idx, 'name', e.target.value)} 
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary/20 outline-none" 
                              />
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input 
                                  type="number" 
                                  value={part.percentage} 
                                  onChange={e => updatePart(idx, 'percentage', parseFloat(e.target.value))} 
                                  className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs text-center font-bold focus:ring-1 focus:ring-primary/20 outline-none" 
                                />
                                <span className="text-xs text-gray-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <button 
                                type="button" 
                                onClick={() => removePart(idx)} 
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
              </div>

              <button type="submit" disabled={savingSalary} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-sm">
                {savingSalary ? 'Applying Changes...' : 'Save Configuration'}
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
                    <i className="fa-solid fa-money-check-dollar" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary">Salary Configuration</h3>
                    <p className="text-xs text-gray-400 font-medium">Total: ₹{salaryConfig?.totalSalary?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {salaryConfig ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="py-4 text-left">Salary Component</th>
                        <th className="py-4 text-center">Percentage</th>
                        <th className="py-4 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {salaryConfig.formattedBreakdown?.map((part, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 text-sm font-semibold text-secondary">{part.name}</td>
                          <td className="py-4 text-center">
                            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md uppercase tracking-wider">{part.percentage}%</span>
                          </td>
                          <td className="py-4 text-right text-sm font-bold text-secondary">₹{part.value?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm font-medium">Salary breakdown not configured.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
