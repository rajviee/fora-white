import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee', designation: '', contactNumber: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { 
    if (user?.role === 'admin') {
      loadEmployees(debouncedSearch); 
    }
  }, [user, debouncedSearch]);

  const loadEmployees = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/emp-list?perPage=100&search=${q}`);
      setEmployees(res.data?.employees || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setAddLoading(true);
    try {
      await api.post('/add-employee', form);
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'employee', designation: '', contactNumber: '' });
      loadEmployees(debouncedSearch);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add employee');
    }
    setAddLoading(false);
  };

  // With server-side search, we use the employees list directly
  const filtered = employees;

  return (
    <div className="animate-fade-in" data-testid="employees-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">
          {filtered.length} Employees
        </h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50" data-testid="filter-btn">
            <i className="fa-solid fa-sliders text-sm" />
          </button>
          <button className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50" data-testid="calendar-btn">
            <i className="fa-regular fa-calendar text-sm" />
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center" data-testid="add-employee-btn">
              <i className="fa-solid fa-plus mr-2" />Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Add Employee Form (collapsible) */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 animate-fade-in" data-testid="add-employee-form">
          <h3 className="text-sm font-semibold text-secondary mb-3">New Employee</h3>
          {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required placeholder="First Name *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-firstname" />
            <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required placeholder="Last Name *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-lastname" />
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="Email *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-email" />
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Password *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-password" />
            <input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Designation" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-designation" />
            <input value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} placeholder="Contact Number" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-contact" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-role">
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={addLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50" data-testid="add-submit">{addLoading ? 'Adding...' : 'Add'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="py-2.5 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Employee table */}
      <div className="bg-white rounded-xl border border-gray-100" data-testid="employee-table">
        {/* Table header with search */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-secondary">All Employees</h2>
          <div className="relative w-48 sm:w-64">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              data-testid="employee-search"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-primary text-white text-sm">
                  <th className="py-3 px-4 sm:px-5 text-left font-medium">Name</th>
                  <th className="py-3 px-4 text-left font-medium">Designation</th>
                  <th className="py-3 px-4 text-left font-medium">Email Id</th>
                  <th className="py-3 px-4 text-left font-medium">Contact No</th>
                  <th className="py-3 px-4 sm:px-5 text-left font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => (
                  <tr
                    key={emp._id || idx}
                    className={`border-b border-gray-50 hover:bg-primary/5 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                    data-testid={`employee-row-${emp._id}`}
                  >
                    <td className="py-3 px-4 sm:px-5">
                      <Link to={`/employees/${emp._id}`} className="text-sm text-secondary hover:text-primary font-medium">
                        {emp.firstName} {emp.lastName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{emp.designation || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{emp.email || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{emp.contactNumber || '-'}</td>
                    <td className="py-3 px-4 sm:px-5">
                      <span className="text-sm text-gray-600 capitalize">{emp.role || 'Employee'}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
