// src/components/CreateGroupModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';

export default function CreateGroupModal({
    isOpen,
    onClose,
    onCreateGroup,
    loading = false
}) {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return;
        onCreateGroup(name.trim());
    }

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
                    <h3 className="text-base font-bold text-slate-900">
                        Tạo nhóm hẹn mới
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Đóng modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            Tên nhóm hẹn:
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Team Cà Phê, Kèo Đá Banh, Hội Bạn Thân..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                            required
                            autoFocus
                        />
                        <span className="text-[11px] text-slate-400">
                            Sau khi tạo nhóm, hệ thống sẽ cấp mã 6 chữ số để bạn gửi bạn bè tham gia.
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{loading ? "Đang tạo nhóm..." : "Tạo nhóm ngay"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
