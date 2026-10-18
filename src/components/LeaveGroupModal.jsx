// src/components/LeaveGroupModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, LogOut, X } from 'lucide-react';

export default function LeaveGroupModal({
    isOpen,
    onClose,
    onConfirm,
    leaving = false,
    groupName = "",
    isOwner = false,
    otherMembersCount = 0
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
                    <div className="flex items-center gap-2 text-amber-600">
                        <LogOut className="w-5 h-5 shrink-0" />
                        <h3 className="text-base font-bold text-slate-900">
                            Xác nhận rời nhóm
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={leaving}
                        className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
                    <p>
                        Bạn có chắc chắn muốn rời khỏi nhóm <strong className="text-slate-900">"{groupName || "này"}"</strong>?
                    </p>

                    {isOwner ? (
                        otherMembersCount > 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm flex flex-col gap-1.5 text-amber-900">
                                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                    <span>Chuyển quyền chủ nhóm tự động</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-amber-800/90">
                                    Bạn hiện là <strong>Chủ nhóm</strong>. Khi bạn rời đi, hệ thống sẽ <strong>chọn ngẫu nhiên một thành viên khác</strong> trong nhóm làm Chủ nhóm mới để tiếp tục quản lý nhóm.
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm flex flex-col gap-1.5 text-rose-900">
                                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                    <span>Nhóm sẽ bị xóa hoàn toàn</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-rose-800/90">
                                    Bạn là thành viên duy nhất còn lại trong nhóm. Khi bạn rời đi, nhóm sẽ tự động được xóa vĩnh viễn khỏi hệ thống.
                                </p>
                            </div>
                        )
                    ) : (
                        <p className="text-slate-500">
                            Sau khi rời nhóm, lịch rảnh của bạn sẽ được xóa và bạn sẽ không còn nhận được tin nhắn hay xem được biểu đồ hẹn lịch của nhóm nữa.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={leaving}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={leaving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{leaving ? "Đang xử lý..." : "Xác nhận rời nhóm"}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
