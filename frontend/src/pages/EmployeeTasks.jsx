import { useState, useEffect } from 'react';
import { getMyTasks, updateMyTask } from '../services/taskService';
import { PriorityBadge, StatusBadge, Spinner, EmptyState } from '../components/SharedComponents';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlinePencil,
  HiOutlineChat,
  HiOutlineX,
} from 'react-icons/hi';

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getMyTasks();
      setTasks(res.data.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      status: task.status,
      remarks: task.remarks || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingTask) return;

    setSubmitting(true);
    try {
      await updateMyTask(editingTask.task_id, {
        status: editForm.status,
        remarks: editForm.remarks.trim(),
      });
      toast.success('Task updated successfully!');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update task';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">View and update your assigned tasks</p>
        </div>
        <div className="flex gap-2">
          {['', 'Pending', 'In Progress', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-500/20'
                  : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-slate-200'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="No tasks found"
          description={statusFilter ? `No ${statusFilter.toLowerCase()} tasks.` : 'No tasks assigned yet.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.task_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{task.description || 'No description'}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <StatusBadge status={task.status} />
                    </div>
                    <span>Deadline: <span className="text-slate-600 font-medium">{task.deadline}</span></span>
                    <span>Assigned by: <span className="text-slate-600 font-medium">{task.assigned_by_name}</span></span>
                  </div>

                  {task.remarks && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 flex items-start gap-2">
                      <HiOutlineChat className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-500 italic">"{task.remarks}"</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openEdit(task)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors flex-shrink-0"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Update Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-700 mb-1">{editingTask.title}</p>
              <p className="text-xs text-slate-400">{editingTask.description}</p>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Work Remarks</label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g., API completed and ready for testing..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold shadow-lg shadow-primary-200 hover:shadow-xl disabled:opacity-60 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Task'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
