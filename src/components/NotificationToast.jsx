// src/components/NotificationToast.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function NotificationToast({ message, onClose }) {
    if (!message) return null;

    const isSuccess = message.type === 'success';

    return (
        <div 
            className={`flex items-center justify-between gap-3 p-3.5 rounded-sm border text-sm font-medium transition-all shadow-xs ${
                isSuccess 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
            role="alert"
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">{message.text}</span>
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={`p-1 rounded-sm transition-colors shrink-0 ${
                        isSuccess 
                            ? 'hover:bg-emerald-100 text-emerald-700' 
                            : 'hover:bg-rose-100 text-rose-700'
                    }`}
                    title="Đóng thông báo"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
