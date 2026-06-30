import { useState, useEffect } from 'react';
import { getAllTasks, deleteTask as deleteTaskApi } from '../services/taskService';
import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge, Spinner, EmptyState } from '../components/SharedComponents';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
} from 'react-icons/hi';

export default function ManagerTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewTask, setViewTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getAllTasks({ search, status: statusFilter });
      setTasks(res.data.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskApi(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">Manage and track all assigned tasks</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
          />
        </div>
        <div className="relative">
          <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="No tasks found"
          description="Adjust your search or create a new task."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 line-clamp-2 flex-1 mr-2">{task.title}</h3>
                <PriorityBadge priority={task.priority} />
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{task.description || 'No description'}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {task.assigned_to_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-xs text-slate-500">{task.assigned_to_name}</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={task.status} />
                <span className="text-xs text-slate-400">{task.deadline}</span>
              </div>

              {task.remarks && (
                <div className="bg-slate-50 rounded-lg p-2.5 mb-4">
                  <p className="text-xs text-slate-500 italic">"{task.remarks}"</p>
                </div>
              )}

              <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewTask(task)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <HiOutlineEye className="w-3.5 h-3.5" />
                  View
                </button>
                <button
                  onClick={() => navigate(`/manager/edit-task/${task.task_id}`, { state: { task } })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <HiOutlinePencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.task_id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-danger-500 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Task Modal */}
      {viewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setViewTask(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{viewTask.title}</h3>
              <PriorityBadge priority={viewTask.priority} />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-400 font-medium">Description:</span>
                <p className="text-slate-600 mt-1">{viewTask.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Assigned To:</span>
                  <p className="text-slate-600">{viewTask.assigned_to_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned By:</span>
                  <p className="text-slate-600">{viewTask.assigned_by_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Status:</span>
                  <div className="mt-1"><StatusBadge status={viewTask.status} /></div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Deadline:</span>
                  <p className="text-slate-600">{viewTask.deadline}</p>
                </div>
              </div>
              {viewTask.remarks && (
                <div>
                  <span className="text-slate-400 font-medium">Remarks:</span>
                  <p className="text-slate-600 mt-1 bg-slate-50 rounded-lg p-3 italic">"{viewTask.remarks}"</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewTask(null)}
              className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
