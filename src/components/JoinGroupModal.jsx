// src/components/JoinGroupModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogIn, X } from 'lucide-react';

export default function JoinGroupModal({
    isOpen,
    onClose,
    onJoinGroup,
    loading = false
}) {
    const [groupId, setGroupId] = useState("");

    if (!isOpen) return null;

    function handleSubmit(e) {
        e.preventDefault();
        const code = groupId.trim();
        if (!code) return;
        onJoinGroup(code);
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
                        Tham gia nhóm bằng mã
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

                <p className="text-xs text-slate-500">
                    Nhập mã định danh nhóm (gồm 6 ký tự) do trưởng nhóm hoặc bạn bè chia sẻ để tham gia nhóm.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            Mã tham gia nhóm <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ví dụ: 8e576f"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            required
                            autoFocus
                            maxLength={10}
                            disabled={loading}
                            className="px-3.5 py-2.5 text-base font-mono tracking-widest text-center font-bold text-brand bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand focus:bg-white transition-all uppercase"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !groupId.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{loading ? "Đang tham gia..." : "Tham gia ngay"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
