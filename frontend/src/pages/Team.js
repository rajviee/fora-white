import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee', designation: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      let res;
      if (user?.role === 'admin') {
        res = await api.get('/emp-list?perPage=50');
        setUsers(res.data?.employees || []);
      } else {
        res = await api.get('/me/usersList');
        setUsers(res.data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setAddLoading(true);
    try {
      await api.post('/add-employee', form);
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'employee', designation: '' });
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add user');
    }
    setAddLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in" data-testid="team-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Team</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="add-member-btn">
            <i className="fa-solid fa-plus mr-2" />{showAdd ? 'Cancel' : 'Add Member'}
          </button>
        )}
      </div>

      {/* Add member form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4" data-testid="add-member-form">
          {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required placeholder="First Name *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-firstname" />
            <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required placeholder="Last Name *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-lastname" />
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="Email *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-email" />
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Password *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-password" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-role">
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Designation" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="add-designation" />
            <button type="submit" disabled={addLoading} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="add-submit">
              {addLoading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      {/* Team list */}
      <div className="bg-white rounded-xl border border-gray-100">
        {users.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No team members</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-4 px-5 py-4" data-testid={`team-member-${u._id}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary capitalize">{u.role}</span>
                {u.designation && <span className="text-xs text-gray-500 hidden md:block">{u.designation}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
