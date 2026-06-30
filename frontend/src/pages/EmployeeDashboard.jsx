import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyTasks, getMyTaskStats } from '../services/taskService';
import { StatsCard, PriorityBadge, StatusBadge, Spinner, EmptyState } from '../components/SharedComponents';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineRefresh as HiOutlineSpinner,
  HiOutlineCheckCircle,
  HiOutlineViewGrid,
} from 'react-icons/hi';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes] = await Promise.all([
        getMyTaskStats(),
        getMyTasks(),
      ]);
      setStats(statsRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}! 👋</h1>
          <p className="text-primary-100 text-sm">Here's a summary of your tasks and progress today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard icon={HiOutlineViewGrid} title="Assigned Tasks" value={stats.total_tasks} color="primary" />
          <StatsCard icon={HiOutlineClock} title="Pending" value={stats.pending_tasks} color="danger" />
          <StatsCard icon={HiOutlineSpinner} title="In Progress" value={stats.in_progress_tasks} color="warning" />
          <StatsCard icon={HiOutlineCheckCircle} title="Completed" value={stats.completed_tasks} color="success" />
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Recent Tasks</h2>
          <button
            onClick={() => navigate('/employee/tasks')}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            View All →
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={HiOutlineClipboardList}
            title="No tasks assigned yet"
            description="Your manager hasn't assigned any tasks to you yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Title</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 hidden sm:table-cell">Priority</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.slice(0, 5).map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate('/employee/tasks')}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 hidden sm:block">{task.description}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{task.deadline}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
