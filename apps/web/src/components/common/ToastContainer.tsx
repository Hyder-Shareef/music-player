import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} color="#30d158" />}
          {toast.type === 'error' && <AlertCircle size={16} color="#ff453a" />}
          {(!toast.type || toast.type === 'info') && <Info size={16} color="#0a84ff" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
