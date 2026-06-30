import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getEmployees, createTask } from '../services/taskService';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineFlag,
  HiOutlineCalendar,
  HiOutlineArrowLeft,
} from 'react-icons/hi';

export default function AssignTask() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    deadline: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(res.data.data);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Task title is required';
    if (!form.assigned_to) errs.assigned_to = 'Please select an employee';
    if (!form.deadline) errs.deadline = 'Deadline is required';
    if (form.deadline && new Date(form.deadline) < new Date().setHours(0, 0, 0, 0)) {
      errs.deadline = 'Deadline cannot be in the past';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to: form.assigned_to,
        priority: form.priority,
        deadline: form.deadline,
      });
      toast.success('Task assigned successfully!');
      navigate('/manager/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create task';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Assign New Task</h1>
        <p className="text-slate-400 text-sm mt-1">Create and assign a task to an employee</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1.5">
              Task Title <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <HiOutlineClipboardList className="w-5 h-5 text-slate-300" />
              </div>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter task title"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.title ? 'border-danger-400 ring-2 ring-danger-500/10' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all`}
              />
            </div>
            {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the task details..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
            />
          </div>

          {/* Employee */}
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-slate-600 mb-1.5">
              Assign to Employee <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <HiOutlineUser className="w-5 h-5 text-slate-300" />
              </div>
              <select
                id="employee"
                value={form.assigned_to}
                onChange={(e) => handleChange('assigned_to', e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.assigned_to ? 'border-danger-400 ring-2 ring-danger-500/10' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer`}
              >
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            {errors.assigned_to && <p className="text-xs text-danger-500 mt-1">{errors.assigned_to}</p>}
          </div>

          {/* Priority & Deadline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-600 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiOutlineFlag className="w-5 h-5 text-slate-300" />
                </div>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-600 mb-1.5">
                Deadline <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiOutlineCalendar className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.deadline ? 'border-danger-400 ring-2 ring-danger-500/10' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all`}
                />
              </div>
              {errors.deadline && <p className="text-xs text-danger-500 mt-1">{errors.deadline}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300/50 hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning Task...
                </>
              ) : (
                <>
                  <HiOutlineClipboardList className="w-5 h-5" />
                  Assign Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
