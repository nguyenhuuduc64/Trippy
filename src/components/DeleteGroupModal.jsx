// src/components/DeleteGroupModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteGroupModal({
    isOpen,
    onClose,
    group,
    onConfirm,
    deleting = false
}) {
    if (!isOpen || !group) return null;

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
                        <Trash2 className="w-5 h-5 text-rose-600" />
                        <h3 className="text-base font-bold text-slate-900">
                            Xác nhận xóa nhóm
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="text-sm text-slate-600 leading-relaxed">
                    Bạn có chắc chắn muốn xóa nhóm <strong className="text-slate-900">"{group.name}"</strong> (Mã: {group.groupId}) không?
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>Hành động này sẽ xóa hoàn toàn dữ liệu nhóm và tất cả lịch rảnh của các thành viên. Thao tác này không thể hoàn tác!</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
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
                        <span>{deleting ? "Đang xóa..." : "Xóa nhóm ngay"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
