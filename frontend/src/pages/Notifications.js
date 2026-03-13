import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getImageUrl } from '../utils';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications/getAllNotifications');
      setNotifications(res.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
    setLoading(false);
  };

  const handleAction = async (notifId, action) => {
    try {
      await api.patch(`/notifications/handleTaskApproval/${notifId}`, { action });
      // Reload to show updated state
      loadNotifications();
    } catch (e) {
      console.error('Failed to handle action', e);
    }
  };

  const groupNotifications = (notifs) => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let label = '';

      if (d.getTime() === today.getTime()) label = 'Today';
      else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
      else label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });

    return groups;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const grouped = groupNotifications(notifications);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 min-h-[calc(100vh-120px)] p-6 sm:p-8 animate-fade-in" data-testid="notifications-page">
      <h1 className="text-2xl font-bold text-secondary mb-8">Notifications</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="fa-regular fa-bell text-5xl mb-4" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([label, notifs]) => (
            <div key={label} className="space-y-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</h3>
              <div className="space-y-3">
                {notifs.map((n) => (
                  <div 
                    key={n._id} 
                    onClick={() => n.taskId && navigate(`/tasks/${n.taskId._id || n.taskId}`)}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${!n.isRead ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50'}`}
                  >
                    {/* Icon / Avatar */}
                    <div className="shrink-0">
                      {n.senderId ? (
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                          {n.senderId.avatar?.path ? (
                            <img src={getImageUrl(n.senderId.avatar.path)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary font-bold text-xs capitalize">
                              {n.senderId.firstName?.[0]}{n.senderId.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                          <i className={`fa-solid ${n.type === 'reminder' ? 'fa-clock' : n.type === 'Overdue' ? 'fa-calendar-xmark' : 'fa-bell'} text-sm`} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-secondary leading-relaxed">
                            {n.senderId && <span className="font-bold mr-1">{n.senderId.firstName} {n.senderId.lastName}</span>}
                            <span className={n.senderId ? 'text-gray-500' : 'font-medium'}>
                              {n.message.split(' ').map((word, i) => {
                                // Simple heuristic to bold task names which usually follow ":" or are at the end
                                if (word.startsWith('"') || word.includes(':')) return <span key={i} className="font-bold text-secondary"> {word}</span>;
                                return <span key={i}> {word}</span>;
                              })}
                            </span>
                          </p>
                          
                          {/* Action Buttons */}
                          {n.type === 'taskApproval' && !n.action?.chosen && (
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={() => handleAction(n._id, 'approve')}
                                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleAction(n._id, 'reject')}
                                className="px-5 py-1.5 border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/5 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {n.action?.chosen && (
                            <p className="text-[10px] font-bold uppercase tracking-wider mt-1">
                              Status: <span className={n.action.chosen === 'approve' ? 'text-emerald-600' : 'text-red-600'}>{n.action.chosen}ed</span>
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap shrink-0 mt-1">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
