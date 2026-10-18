// src/components/AvailabilityModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, Clock, Plus, Trash2, Check, X } from 'lucide-react';
import { formatDateTimeVN } from '../utils/dateUtils';

export default function AvailabilityModal({
    isOpen,
    onClose,
    mySlots = [],
    onAddSlot,
    onRemoveSlot,
    onSaveAllSlots,
    saving = false,
}) {
    const [newSlotStart, setNewSlotStart] = useState("2026-10-18T09:00");
    const [newSlotEnd, setNewSlotEnd] = useState("2026-10-18T11:00");
    const [formError, setFormError] = useState("");

    if (!isOpen) return null;

    function handleAdd(e) {
        e.preventDefault();
        setFormError("");

        if (!newSlotStart || !newSlotEnd) {
            setFormError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
            return;
        }

        const start = new Date(newSlotStart).getTime();
        const end = new Date(newSlotEnd).getTime();

        if (isNaN(start) || isNaN(end) || start >= end) {
            setFormError("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!");
            return;
        }

        const exists = mySlots.some(s => {
            const sStart = new Date(s.startTime).getTime();
            const sEnd = new Date(s.endTime).getTime();
            return sStart === start && sEnd === end;
        });
        if (exists) {
            setFormError("Khung giờ này đã có trong danh sách của bạn.");
            return;
        }

        onAddSlot({ startTime: newSlotStart, endTime: newSlotEnd });
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-sm shadow-2xl border border-slate-200 max-w-lg w-full p-6 flex flex-col gap-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">
                        Đặt khung giờ rảnh của bạn
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex flex-col gap-3.5 text-sm">
                    <p className="text-slate-500 text-xs leading-relaxed">
                        Thêm các khoảng thời gian bạn có thể rảnh. Biểu đồ sẽ tự động so khớp để tìm ra các mốc giờ cả nhóm cùng rảnh.
                    </p>

                    {/* Form thêm khung giờ */}
                    <form onSubmit={handleAdd} className="bg-slate-50 border border-dashed border-slate-300 rounded-sm p-3.5 flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-700">Giờ bắt đầu:</label>
                                <input
                                    type="datetime-local"
                                    value={newSlotStart}
                                    onChange={(e) => setNewSlotStart(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-700">Giờ kết thúc:</label>
                                <input
                                    type="datetime-local"
                                    value={newSlotEnd}
                                    onChange={(e) => setNewSlotEnd(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                                    required
                                />
                            </div>
                        </div>

                        {formError && (
                            <div className="text-xs text-rose-600 font-medium">
                                {formError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand bg-brand-light hover:bg-brand hover:text-white border border-brand/30 rounded-sm transition-colors cursor-pointer shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm khung giờ này</span>
                        </button>
                    </form>

                    {/* Danh sách các khung giờ đã chọn */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800">
                                Khung giờ đã chọn ({mySlots.length}):
                            </span>
                        </div>

                        {mySlots.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-sm border border-slate-200 text-xs text-slate-400">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Bạn chưa thêm khung giờ rảnh nào. Hãy chọn giờ ở trên và bấm "Thêm khung giờ này".</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                {mySlots.map((slot, idx) => {
                                    const s = formatDateTimeVN(slot.startTime);
                                    const e = formatDateTimeVN(slot.endTime);
                                    const label = s.dateStr === e.dateStr 
                                        ? `${s.dateStr}: ${s.timeStr} - ${e.timeStr}`
                                        : `${s.dateStr} ${s.timeStr} - ${e.dateStr} ${e.timeStr}`;

                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-sm text-xs transition-colors"
                                        >
                                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                                <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
                                                <span>{label}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveSlot(idx)}
                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                                                title="Xóa khung giờ này"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSaveAllSlots}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>{saving ? "Đang lưu..." : `Lưu tất cả (${mySlots.length} khung giờ)`}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
