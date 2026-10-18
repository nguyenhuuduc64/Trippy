// src/components/DeleteAccountModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    deleting = false,
    userEmail = ""
}) {
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-sm shadow-2xl border border-slate-200 max-w-md w-full p-6 flex flex-col gap-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <h3 className="text-base font-bold text-slate-900">
                            Xác nhận xóa tài khoản
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm flex flex-col gap-1.5">
                        <span className="font-bold text-rose-800">
                            Cảnh báo: Hành động này không thể hoàn tác!
                        </span>
                        <p className="text-rose-700">
                            Tài khoản của bạn {userEmail ? <strong>({userEmail})</strong> : ''} sẽ bị xóa vĩnh viễn khỏi hệ thống Cognito. Bạn sẽ mất toàn bộ quyền truy cập vào các nhóm và dữ liệu liên quan.
                        </p>
                    </div>
                    <p>
                        Nếu bạn chắc chắn muốn xóa tài khoản này, vui lòng bấm nút <strong>"Xác nhận xóa vĩnh viễn"</strong> bên dưới.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deleting ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
