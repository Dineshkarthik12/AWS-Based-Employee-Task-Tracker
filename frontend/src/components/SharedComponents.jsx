export function StatsCard({ icon: Icon, title, value, color = 'primary', trend }) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-700',
      text: 'text-primary-700',
      shadow: 'shadow-primary-100',
    },
    success: {
      bg: 'bg-success-50',
      iconBg: 'bg-gradient-to-br from-success-500 to-success-600',
      text: 'text-success-600',
      shadow: 'shadow-success-100',
    },
    warning: {
      bg: 'bg-warning-50',
      iconBg: 'bg-gradient-to-br from-warning-500 to-warning-600',
      text: 'text-warning-600',
      shadow: 'shadow-warning-100',
    },
    danger: {
      bg: 'bg-danger-50',
      iconBg: 'bg-gradient-to-br from-danger-500 to-danger-600',
      text: 'text-danger-600',
      shadow: 'shadow-danger-100',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-1 ${colors.text}`}>{trend}</p>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-2xl ${colors.iconBg} ${colors.shadow} shadow-lg transition-transform duration-300 group-hover:scale-110`}
        >
          {Icon && <Icon className="w-7 h-7 text-white" />}
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    High: 'bg-danger-50 text-danger-600 ring-danger-500/20',
    Medium: 'bg-warning-50 text-warning-600 ring-warning-500/20',
    Low: 'bg-success-50 text-success-600 ring-success-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
        styles[priority] || styles.Medium
      }`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    Pending: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    'In Progress': 'bg-primary-50 text-primary-600 ring-primary-500/20',
    Completed: 'bg-success-50 text-success-600 ring-success-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
}
