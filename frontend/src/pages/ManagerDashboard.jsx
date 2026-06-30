import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getAllTasks, deleteTask as deleteTaskApi } from '../services/taskService';
import { StatsCard, PriorityBadge, StatusBadge, Spinner, EmptyState } from '../components/SharedComponents';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlineRefresh,
} from 'react-icons/hi';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModalTask, setDeleteModalTask] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes] = await Promise.all([
        getDashboardStats(),
        getAllTasks(),
      ]);
      setStats(statsRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await getAllTasks({ search, status: statusFilter });
      setTasks(res.data.data);
    } catch (err) {
      toast.error('Failed to search tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteModalTask) return;
    setDeleting(true);
    try {
      await deleteTaskApi(deleteModalTask.task_id);
      toast.success('Task deleted successfully');
      setDeleteModalTask(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !stats) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name}. Here's your overview.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all duration-200"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/manager/assign-task')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300/50 transition-all duration-300"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Assign New Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard icon={HiOutlineUsers} title="Total Employees" value={stats.total_employees} color="primary" />
          <StatsCard icon={HiOutlineClipboardList} title="Total Tasks" value={stats.total_tasks} color="warning" />
          <StatsCard icon={HiOutlineClock} title="Pending Tasks" value={stats.pending_tasks} color="danger" />
          <StatsCard icon={HiOutlineCheckCircle} title="Completed Tasks" value={stats.completed_tasks} color="success" />
        </div>
      )}

      {/* Task Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by task title or employee name..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>
            <div className="relative">
              <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <Spinner />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={HiOutlineClipboardList}
            title="No tasks found"
            description="No tasks match your search criteria. Try adjusting your filters or create a new task."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Task Title</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Assigned Employee</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Priority</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Deadline</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                          {task.assigned_to_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-slate-600">{task.assigned_to_name || task.assigned_to}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">{task.deadline}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/manager/edit-task/${task.task_id}`, { state: { task } })}
                          className="p-2 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          title="Edit task"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalTask(task)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          title="Delete task"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in zoom-in-95">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 mx-auto mb-4">
              <HiOutlineTrash className="w-6 h-6 text-danger-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Task</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to delete "{deleteModalTask.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalTask(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-danger-500 text-white text-sm font-semibold hover:bg-danger-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Task'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
