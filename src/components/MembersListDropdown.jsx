// src/components/MembersListDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Users, Crown, ChevronDown, Check, Clock } from 'lucide-react';
import { formatDisplayName } from '../utils/dateUtils';

export default function MembersListDropdown({
    members = [],
    ownerId = "",
    currentUserId = "",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sắp xếp: Chủ nhóm lên đầu, sau đó đến bản thân, sau đó là các thành viên khác
    const sortedMembers = [...members].sort((a, b) => {
        if (a.userId === ownerId) return -1;
        if (b.userId === ownerId) return 1;
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return 0;
    });

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                title="Xem danh sách thành viên trong nhóm"
                aria-expanded={isOpen}
            >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Thành viên</span>
                <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full text-[10px] border border-slate-200">
                    {members.length}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-sm shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                    {/* Header */}
                    <div className="px-3 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                            Thành viên nhóm ({members.length})
                        </span>
                    </div>

                    {/* Danh sách thành viên */}
                    <div className="flex flex-col">
                        {sortedMembers.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-slate-400 text-center">
                                Chưa có thành viên nào
                            </div>
                        ) : (
                            sortedMembers.map((m) => {
                                const isMe = m.userId === currentUserId;
                                const isOwner = m.userId === ownerId;
                                const name = formatDisplayName(m.userName, isMe ? "Bạn" : "Thành viên");
                                const initial = name.charAt(0).toUpperCase() || "T";
                                const slotCount = Array.isArray(m.timeSlots) ? m.timeSlots.length : 0;

                                return (
                                    <div
                                        key={m.userId}
                                        className={`px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                                            isMe ? 'bg-brand-light/20' : ''
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-7 h-7 rounded-sm bg-brand-light text-brand border border-brand/20 flex items-center justify-center text-xs font-bold shrink-0">
                                            {initial}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-slate-800 truncate" title={name}>
                                                    {name}
                                                </span>
                                                {isOwner && (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded-xs shrink-0" title="Chủ nhóm">
                                                        <Crown className="w-2.5 h-2.5" />
                                                        <span>Chủ</span>
                                                    </span>
                                                )}
                                                {isMe && (
                                                    <span className="text-[9px] font-bold text-brand bg-brand-light border border-brand/20 px-1 py-0.2 rounded-xs shrink-0">
                                                        Bạn
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span>
                                                    {slotCount > 0 ? `${slotCount} khung giờ rảnh` : "Chưa đặt lịch"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
