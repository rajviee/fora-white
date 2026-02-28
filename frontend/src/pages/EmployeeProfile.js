import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { formatDate, formatDateTime } from '../utils';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [empRes, attRes, salRes] = await Promise.all([
        api.get(`/me/userinfo`).catch(() => ({ data: null })),
        api.get(`/attendance/analytics/${id}`).catch(() => ({ data: null })),
        api.get(`/salary/records/${id}?year=${new Date().getFullYear()}`).catch(() => ({ data: { success: false } })),
      ]);

      // Try to get employee details from emp-list
      const empList = await api.get('/emp-list?perPage=100').catch(() => ({ data: { employees: [] } }));
      const adminInfo = await api.get('/me/userinfo').catch(() => ({ data: null }));
      const allEmps = [...(empList.data?.employees || [])];
      if (adminInfo.data && !allEmps.some(e => e._id === adminInfo.data._id)) {
        allEmps.push(adminInfo.data);
      }
      const emp = allEmps.find(e => e._id === id) || adminInfo.data;
      setEmployee(emp);

      const attData = attRes.data;
      if (attData) {
        setAttendance(attData.records || attData.attendance || []);
        setAttendanceStats(attData.stats || attData.summary || {
          totalDays: attData.records?.length || 0,
          present: attData.records?.filter(r => r.status === 'present').length || 0,
          absent: attData.records?.filter(r => r.status === 'absent').length || 0,
          halfDay: attData.records?.filter(r => r.status === 'half-day').length || 0,
        });
      }
      
      if (salRes.data?.success && salRes.data.records?.length > 0) {
        setSalary(salRes.data.records[0]); // Show latest record
      } else {
        setSalary(null);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const workingDays = 26;
  const presentDays = attendanceStats?.present || 0;
  const absentDays = attendanceStats?.absent || 0;
  const halfDays = attendanceStats?.halfDay || 0;
  const attendancePct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  // Monthly trend data
  const trendData = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, i) => ({
    name: w,
    Present: Math.min(presentDays, Math.floor(presentDays / 4) + (i < presentDays % 4 ? 1 : 0)),
    Absent: Math.floor(absentDays / 4),
  }));

  const tabs = ['overview', 'attendance', 'salary'];

  return (
    <div className="animate-fade-in" data-testid="employee-profile-page">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0 mt-1" data-testid="back-btn">
          <i className="fa-solid fa-arrow-left text-gray-500 text-sm" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
                {employee?.firstName?.[0]}{employee?.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary">{employee?.firstName} {employee?.lastName}</h1>
                <p className="text-sm text-gray-500">{employee?.designation || employee?.role || 'Employee'} &middot; {employee?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[90px] px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === t ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-gray-700'}`} data-testid={`profile-tab-${t}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4" data-testid="profile-overview">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <i className="fa-solid fa-calendar-check text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-secondary">{presentDays}</p>
              <p className="text-xs text-gray-500">Present Days</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                <i className="fa-solid fa-calendar-xmark text-red-500" />
              </div>
              <p className="text-2xl font-bold text-secondary">{absentDays}</p>
              <p className="text-xs text-gray-500">Absent Days</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
                <i className="fa-solid fa-clock text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-secondary">{halfDays}</p>
              <p className="text-xs text-gray-500">Half Days</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <i className="fa-solid fa-chart-pie text-primary" />
              </div>
              <p className="text-2xl font-bold text-secondary">{attendancePct}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
          </div>

          {/* Working Days vs Present */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-secondary mb-3">Working Days vs Present Days</h3>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-gray-500">Working Days: {workingDays}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-gray-500">Present: {presentDays}</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full relative" style={{ width: `${attendancePct}%` }}>
                <div className="absolute inset-0 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (presentDays / workingDays) * 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-xs text-gray-400">{workingDays} days</span>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-secondary mb-3">Monthly Trends — {currentMonth}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Bar dataKey="Present" fill="#1360C6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#F87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4" data-testid="profile-attendance">
          <div className="bg-white rounded-xl border border-gray-100" data-testid="attendance-log-table">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-secondary">Daily Attendance Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-primary text-white text-sm">
                    <th className="py-3 px-4 sm:px-5 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Check In</th>
                    <th className="py-3 px-4 text-left font-medium">Check Out</th>
                    <th className="py-3 px-4 text-left font-medium">Hours</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 sm:px-5 text-left font-medium">Geotag</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? attendance.map((record, idx) => {
                    const checkInTime = record.checkIn?.time || record.checkInTime;
                    const checkOutTime = record.checkOut?.time || record.checkOutTime;
                    const hours = checkInTime && checkOutTime
                      ? ((new Date(checkOutTime) - new Date(checkInTime)) / 3600000).toFixed(1)
                      : '-';
                    const geo = record.checkIn?.coordinates || record.checkIn?.location;
                    return (
                      <tr key={idx} className={`border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`} data-testid={`attendance-log-${idx}`}>
                        <td className="py-3 px-4 sm:px-5 text-sm text-secondary">{formatDate(record.date)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{checkInTime ? formatDateTime(checkInTime) : '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{checkOutTime ? formatDateTime(checkOutTime) : '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{hours}h</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'half-day' ? 'bg-amber-100 text-amber-700' :
                            record.status === 'on-leave' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>{record.status || 'absent'}</span>
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs text-gray-500">
                          {geo ? (
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-location-dot text-primary" />
                              {geo.latitude?.toFixed(4)}, {geo.longitude?.toFixed(4)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No attendance records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="space-y-4" data-testid="profile-salary">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-secondary mb-4">Salary Calculation — {currentMonth}</h3>
            {salary ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-primary/5 rounded-xl text-center">
                    <p className="text-xl font-bold text-primary">{salary.totalAmount?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500 mt-1">Net Salary</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-xl font-bold text-emerald-600">{salary.baseSalary?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500 mt-1">Base Salary</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-xl font-bold text-red-500">{salary.deductions?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500 mt-1">Deductions</p>
                  </div>
                </div>
                {salary.breakdown && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(salary.breakdown || {}).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm font-medium text-secondary">{val?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <i className="fa-solid fa-money-bill-wave text-3xl text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Salary details not yet configured</p>
                <p className="text-xs text-gray-400 mt-1">Attendance-based: {presentDays} days x daily rate</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl max-w-sm mx-auto">
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-gray-500">Working Days</span>
                    <span className="font-medium text-secondary">{workingDays}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-gray-500">Present Days</span>
                    <span className="font-medium text-emerald-600">{presentDays}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-gray-500">Absent Days</span>
                    <span className="font-medium text-red-500">{absentDays}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm">
                    <span className="text-gray-500">Half Days</span>
                    <span className="font-medium text-amber-500">{halfDays}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm border-t border-gray-200 mt-1">
                    <span className="text-gray-500">Attendance Rate</span>
                    <span className="font-bold text-primary">{attendancePct}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
