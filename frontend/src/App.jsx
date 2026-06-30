import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './layouts/Sidebar';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import AssignTask from './pages/AssignTask';
import EditTask from './pages/EditTask';
import ManagerTasks from './pages/ManagerTasks';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeTasks from './pages/EmployeeTasks';

function RootRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === 'Manager' ? (
    <Navigate to="/manager/dashboard" replace />
  ) : (
    <Navigate to="/employee/dashboard" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e293b',
              borderRadius: '14px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#f0fdf4',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fef2f2',
              },
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Manager Routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="Manager">
                <Sidebar />
              </ProtectedRoute>
            }
          >
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/assign-task" element={<AssignTask />} />
            <Route path="/manager/edit-task/:taskId" element={<EditTask />} />
            <Route path="/manager/tasks" element={<ManagerTasks />} />
          </Route>

          {/* Employee Routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="Employee">
                <Sidebar />
              </ProtectedRoute>
            }
          >
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/tasks" element={<EmployeeTasks />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
