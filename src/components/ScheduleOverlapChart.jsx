// src/components/ScheduleOverlapChart.jsx
import React, { useState, useRef } from 'react';
import {
    Calendar,
    CalendarPlus,
    CheckCircle2,
    Clock,
    Copy,
    Check,
    MessageSquare,
    Sparkles,
    Users,
    MoveHorizontal,
    Maximize2,
    Minimize2
} from 'lucide-react';
import {
    parseSlotHour,
    formatDateLabelVN,
    computeClientOverlap,
    copyToClipboard,
    formatDisplayName
} from '../utils/dateUtils';
import toast from 'react-hot-toast';

export default function ScheduleOverlapChart({
    members = [],
    serverOverlap = null,
    currentUserId,
    ownerId,
    onCalculateOverlap,
    calculatingOverlap,
    onFillChatInput,
    onOpenAvailabilityModal,
    mobileViewMode = 'split',
    onToggleMobileExpand = null
}) {
    // 1. Tính toán danh sách khung giờ trùng
    const clientOverlap = computeClientOverlap(members);
    const effectiveOverlap = (serverOverlap !== null) ? serverOverlap : clientOverlap;

    // 2. Thu thập tất cả các ngày xuất hiện trong lịch
    const dateSet = new Set();
    members.forEach(m => {
        const slots = Array.isArray(m.timeSlots) ? m.timeSlots : [];
        slots.forEach(s => {
            const p = parseSlotHour(s.startTime);
            if (p) dateSet.add(p.dateStr);
        });
    });

    effectiveOverlap.forEach(ov => {
        const p = parseSlotHour(ov.startTime);
        if (p) dateSet.add(p.dateStr);
    });

    const dates = Array.from(dateSet).sort();

    const [selectedDate, setSelectedDate] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Drag-to-scroll (kéo thả biểu đồ)
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const activeDate = (selectedDate && dates.includes(selectedDate)) ? selectedDate : (dates[0] || null);

    const membersWithSlots = members.filter(m => Array.isArray(m.timeSlots) && m.timeSlots.length > 0);

    // Xử lý kéo thả (Pan / Drag to scroll)
    const handleMouseDown = (e) => {
        if (e.button !== 0 || e.target.closest('button')) return;
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeftState(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftState - walk;
    };

    // Empty state khi chưa có ai đăng ký lịch
    if (membersWithSlots.length === 0) {
        return (
            <div className="bg-white rounded-sm border border-slate-200 shadow-xs p-5 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">
                        Biểu đồ so sánh lịch rảnh & Giờ giao nhau
                    </h2>
                </div>

                <div className="my-auto py-8 flex flex-col items-center justify-center text-center gap-2">
                    <Calendar className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">
                        Chưa có thành viên nào đăng ký khung giờ rảnh
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mb-2">
                        Bấm nút bên dưới để chọn các khung giờ bạn có thể rảnh trong tuần này.
                    </p>
                    {onOpenAvailabilityModal && (
                        <button
                            type="button"
                            onClick={onOpenAvailabilityModal}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            <span>Đặt khung giờ rảnh của bạn</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Các thành viên có khung giờ trong ngày đang chọn
    const dateMembers = members
        .map(m => {
            const raw = Array.isArray(m.timeSlots) ? m.timeSlots : [];
            const parsedSlots = raw
                .map(s => {
                    const startP = parseSlotHour(s.startTime);
                    const endP = parseSlotHour(s.endTime);
                    if (!startP || !endP || endP.timestamp <= startP.timestamp) return null;
                    if (startP.dateStr !== activeDate && endP.dateStr !== activeDate) return null;
                    return {
                        ...s,
                        startP,
                        endP,
                        startH: startP.dateStr === activeDate ? startP.hourFloat : 0,
                        endH: endP.dateStr === activeDate ? endP.hourFloat : 24,
                    };
                })
                .filter(Boolean);

            return {
                ...m,
                slotsOnDate: parsedSlots,
            };
        })
        .filter(m => m.slotsOnDate.length > 0);

    // Đảm bảo người dùng hiện tại luôn hiển thị và ĐƯỢC XẾP LÊN ĐẦU TIÊN
    const displayMembers = [...dateMembers];
    if (currentUserId && !displayMembers.some(m => m.userId === currentUserId)) {
        const meObj = members.find(m => m.userId === currentUserId);
        displayMembers.push({
            userId: currentUserId,
            userName: meObj?.userName || "Bạn",
            slotsOnDate: [],
        });
    }

    // Luôn ưu tiên đưa bản thân (currentUserId) lên hàng đầu tiên
    displayMembers.sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return (a.userName || '').localeCompare(b.userName || '');
    });

    // Khung giờ trùng trên ngày đang chọn
    const dateOverlaps = effectiveOverlap
        .map(ov => {
            const startP = parseSlotHour(ov.startTime);
            const endP = parseSlotHour(ov.endTime);
            if (!startP || !endP || endP.timestamp <= startP.timestamp) return null;
            if (startP.dateStr !== activeDate && endP.dateStr !== activeDate) return null;
            return {
                ...ov,
                startP,
                endP,
                startH: startP.dateStr === activeDate ? startP.hourFloat : 0,
                endH: endP.dateStr === activeDate ? endP.hourFloat : 24,
            };
        })
        .filter(Boolean);

    // Tính khoảng trục giờ
    const allHourValues = [
        ...displayMembers.flatMap(m => m.slotsOnDate.flatMap(s => [s.startH, s.endH])),
        ...dateOverlaps.flatMap(o => [o.startH, o.endH]),
    ];

    const minH = allHourValues.length > 0 ? Math.min(...allHourValues) : 8;
    const maxH = allHourValues.length > 0 ? Math.max(...allHourValues) : 18;

    const axisStart = Math.max(0, Math.floor(minH) - 1);
    let axisEnd = Math.min(24, Math.ceil(maxH) + 1);
    if (axisEnd - axisStart < 6) {
        axisEnd = Math.min(24, axisStart + 6);
    }
    const totalHours = Math.max(1, axisEnd - axisStart);

    // Bước nhảy ruler: 2 tiếng để trục thông thoáng
    const step = totalHours > 14 ? 3 : (totalHours >= 6 ? 2 : 1);
    const hourMarks = [];
    for (let h = axisStart; h <= axisEnd; h += step) {
        hourMarks.push(h);
    }
    if (axisEnd - hourMarks[hourMarks.length - 1] >= step) {
        hourMarks.push(axisEnd);
    }

    async function handleCopySlotText(slot, index) {
        const text = `Lịch hẹn nhóm (${formatDateLabelVN(activeDate)}): từ ${slot.startP.timeStr} đến ${slot.endP.timeStr} (Cả nhóm cùng rảnh)`;
        await copyToClipboard(text);
        setCopiedIndex(index);
        toast.success(`Đã sao chép khung giờ: ${slot.startP.timeStr} - ${slot.endP.timeStr}`, { duration: 2000 });
        setTimeout(() => setCopiedIndex(null), 2000);
    }

    return (
        <div className="bg-white rounded-sm border border-slate-200 shadow-xs p-2.5 sm:p-4 flex flex-col h-full overflow-hidden gap-2 sm:gap-3">
            {/* Header biểu đồ & Nút hành động */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
                <div className="min-w-0">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 truncate">
                        Biểu đồ so sánh lịch rảnh
                    </h2>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {/* Legend ẩn trên mobile nhỏ để gọn gàng */}
                    <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-200">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <span className="font-medium text-slate-700">Cả nhóm rảnh</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-brand"></span>
                            <span className="font-medium text-slate-700">Lịch thành viên</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCalculateOverlap}
                        disabled={calculatingOverlap}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-brand bg-white hover:bg-brand-light border border-brand/40 rounded-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        title="Tính toán lại khung giờ trùng trên máy chủ"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">{calculatingOverlap ? "Đang tính..." : "Tính giờ rảnh"}</span>
                        <span className="sm:hidden">{calculatingOverlap ? "Đang tính..." : "Tính giờ"}</span>
                    </button>

                    {onToggleMobileExpand && (
                        <button
                            type="button"
                            onClick={onToggleMobileExpand}
                            className="lg:hidden p-1 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                            title={mobileViewMode === 'chart' ? "Thu nhỏ về dạng chia đôi" : "Phóng to biểu đồ"}
                        >
                            {mobileViewMode === 'chart' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs chọn ngày */}
            {dates.length > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 shrink-0">
                    {dates.map((dateStr) => {
                        const hasOverlapOnDate = effectiveOverlap.some(ov => {
                            const p = parseSlotHour(ov.startTime);
                            return p && p.dateStr === dateStr;
                        });
                        const isActive = dateStr === activeDate;

                        return (
                            <button
                                key={dateStr}
                                type="button"
                                onClick={() => setSelectedDate(dateStr)}
                                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-sm text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${isActive
                                    ? 'bg-brand-light border-brand text-brand'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateLabelVN(dateStr)}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold ${hasOverlapOnDate
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {hasOverlapOnDate ? "Có giờ rảnh" : "So khớp"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Bảng biểu đồ Timeline (Hỗ trợ kéo thả chuột Drag-to-scroll & Touch pan trên mobile) */}
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`timeline-scroll flex-1 min-h-0 overflow-auto border border-slate-200 rounded-sm bg-white select-none touch-pan-x ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
            >
                <div className="min-w-[480px] sm:min-w-[650px] flex flex-col">
                    {/* Thước đo giờ (Ruler Header) */}
                    <div className="sticky top-0 z-20 flex border-b-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 h-8">
                        <div className="w-28 sm:w-48 min-w-[110px] sm:min-w-[190px] px-2 sm:px-3 flex items-center justify-between uppercase tracking-wider text-[10px] text-slate-500 border-r border-slate-200 bg-slate-50">
                            <span>Thành viên</span>
                            <Users className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="flex-1 relative h-full">
                            {hourMarks.map((h) => {
                                const leftPercent = ((h - axisStart) / totalHours) * 100;
                                return (
                                    <div
                                        key={h}
                                        className="absolute top-0 bottom-0 -translate-x-1/2 flex items-center text-[10px] font-semibold text-slate-500"
                                        style={{ left: `${leftPercent}%` }}
                                    >
                                        <span>{String(h).padStart(2, '0')}:00</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hàng 1: Khung giờ cả nhóm cùng rảnh (GIAO NHAU) */}
                    <div className="flex border-b-2 border-emerald-200 bg-emerald-50/70 min-h-[38px] sm:min-h-[46px] items-stretch relative">
                        <div className="w-28 sm:w-48 min-w-[110px] sm:min-w-[190px] px-2 sm:px-3 py-1.5 border-r border-slate-200 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-800 z-10 bg-inherit">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">Cả nhóm rảnh</span>
                        </div>
                        <div className="flex-1 relative min-h-[46px]">
                            {/* Grid lines */}
                            {hourMarks.map((h) => (
                                <div
                                    key={h}
                                    className="absolute top-0 bottom-0 w-px bg-slate-100 pointer-events-none"
                                    style={{ left: `${((h - axisStart) / totalHours) * 100}%` }}
                                />
                            ))}

                            {/* Dải giao nhau dọc */}
                            {dateOverlaps.map((ov, oIdx) => {
                                const left = Math.max(0, Math.min(100, ((ov.startH - axisStart) / totalHours) * 100));
                                const right = Math.max(0, Math.min(100, ((ov.endH - axisStart) / totalHours) * 100));
                                const width = Math.max(0.5, right - left);
                                return (
                                    <div
                                        key={oIdx}
                                        className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-dashed border-emerald-500/40 pointer-events-none z-[1]"
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                    />
                                );
                            })}

                            {/* Overlap Bars */}
                            {dateOverlaps.length > 0 ? (
                                dateOverlaps.map((ov, oIdx) => {
                                    const left = Math.max(0, Math.min(100, ((ov.startH - axisStart) / totalHours) * 100));
                                    const right = Math.max(0, Math.min(100, ((ov.endH - axisStart) / totalHours) * 100));
                                    const width = Math.max(1, right - left);
                                    return (
                                        <div
                                            key={oIdx}
                                            onClick={() => handleCopySlotText(ov, oIdx)}
                                            className="absolute top-2 bottom-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border border-emerald-700 shadow-xs flex items-center justify-center px-2 text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis z-[5] hover:-translate-y-0.5 transition-all cursor-pointer"
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                            title={`Khung giờ rảnh chung: ${ov.startP.timeStr} - ${ov.endP.timeStr} (Nhấn để sao chép)`}
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                                            <span>{ov.startP.timeStr} - {ov.endP.timeStr}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="absolute inset-0 flex items-center pl-4 text-xs text-slate-400 italic">
                                    {membersWithSlots.length < 2
                                        ? "Cần ít nhất 2 thành viên đăng ký lịch rảnh"
                                        : "Không có khung giờ nào cả nhóm cùng rảnh ngày này"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hàng 2..N: Từng thành viên và khung giờ rảnh */}
                    {displayMembers.map((m) => {
                        const isMe = m.userId === currentUserId;
                        const displayName = formatDisplayName(m.userName, isMe ? "Bạn" : "Thành viên");
                        const initial = displayName.charAt(0).toUpperCase() || "T";
                        const isOwner = m.userId === ownerId;

                        return (
                            <div
                                key={m.userId}
                                className={`flex border-b border-slate-100 min-h-[46px] items-stretch relative ${isMe ? 'bg-brand-light/30' : 'hover:bg-slate-50/50'
                                    }`}
                            >
                                <div className="w-28 sm:w-48 min-w-[110px] sm:min-w-[190px] px-2 sm:px-3 py-1.5 border-r border-slate-200 flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-800 z-10 bg-inherit overflow-hidden">
                                    <div className="w-6 h-6 rounded-sm bg-brand-light text-brand border border-brand/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {initial}
                                    </div>
                                    <span className="truncate" title={displayName}>{displayName}</span>

                                    {isMe && (
                                        <span className="inline-flex items-center gap-1 shrink-0 ml-auto">
                                            <span className="text-[10px] font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded-sm">
                                                (Bạn)
                                            </span>
                                            {onOpenAvailabilityModal && (
                                                <button
                                                    type="button"
                                                    onClick={onOpenAvailabilityModal}
                                                    className="w-5 h-5 inline-flex items-center justify-center rounded-sm border border-slate-300 hover:border-brand hover:bg-brand-light text-brand transition-colors cursor-pointer"
                                                    title="Đặt / sửa khung giờ rảnh của bạn"
                                                >
                                                    <CalendarPlus className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    )}

                                    {isOwner && !isMe && (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm shrink-0 ml-auto">
                                            Chủ
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 relative min-h-[46px]">
                                    {/* Grid lines */}
                                    {hourMarks.map((h) => (
                                        <div
                                            key={h}
                                            className="absolute top-0 bottom-0 w-px bg-slate-100 pointer-events-none"
                                            style={{ left: `${((h - axisStart) / totalHours) * 100}%` }}
                                        />
                                    ))}

                                    {/* Dải giao nhau dọc */}
                                    {dateOverlaps.map((ov, oIdx) => {
                                        const left = Math.max(0, Math.min(100, ((ov.startH - axisStart) / totalHours) * 100));
                                        const right = Math.max(0, Math.min(100, ((ov.endH - axisStart) / totalHours) * 100));
                                        const width = Math.max(0.5, right - left);
                                        return (
                                            <div
                                                key={oIdx}
                                                className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-dashed border-emerald-500/40 pointer-events-none z-[1]"
                                                style={{ left: `${left}%`, width: `${width}%` }}
                                            />
                                        );
                                    })}

                                    {/* Thanh khung giờ thành viên */}
                                    {m.slotsOnDate && m.slotsOnDate.length > 0 ? (
                                        m.slotsOnDate.map((slot, sIdx) => {
                                            const left = Math.max(0, Math.min(100, ((slot.startH - axisStart) / totalHours) * 100));
                                            const right = Math.max(0, Math.min(100, ((slot.endH - axisStart) / totalHours) * 100));
                                            const width = Math.max(1, right - left);
                                            return (
                                                <div
                                                    key={sIdx}
                                                    className="absolute top-2 bottom-2 rounded-sm bg-teal-50 text-brand border border-brand shadow-xs flex items-center justify-center px-2 text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis z-[5] hover:-translate-y-0.5 transition-transform"
                                                    style={{ left: `${left}%`, width: `${width}%` }}
                                                    title={`${displayName}: ${slot.startP.timeStr} - ${slot.endP.timeStr}`}
                                                >
                                                    <span>{slot.startP.timeStr} - {slot.endP.timeStr}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        isMe ? (
                                            <div
                                                onClick={onOpenAvailabilityModal}
                                                className="absolute inset-0 flex items-center pl-4 text-xs text-brand font-medium hover:underline cursor-pointer"
                                                title="Bấm để đặt lịch rảnh của bạn"
                                            >
                                                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                                                <span>Chưa đặt lịch ngày này - Bấm để thêm</span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center pl-4 text-xs text-slate-400 italic">
                                                <span>Chưa đăng ký khung giờ ngày này</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tóm tắt & Hành động khi có khung giờ giao nhau - ẨN TRÊN MOBILE, CHỈ HIỆN TRÊN TABLET / DESKTOP */}
            {dateOverlaps.length > 0 && (
                <div className="hidden sm:flex bg-emerald-50 border border-emerald-200 rounded-sm p-2 sm:p-2.5 flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-emerald-900">
                            Cả nhóm cùng rảnh:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {dateOverlaps.map((ov, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleCopySlotText(ov, idx)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer group"
                                    title="Nhấn để sao chép khung giờ này"
                                >
                                    <Clock className="w-3 h-3 text-emerald-200" />
                                    <span>{ov.startP.timeStr} - {ov.endP.timeStr}</span>
                                    {copiedIndex === idx ? (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-white text-emerald-800 px-1 py-0.2 rounded-xs font-semibold">
                                            <Check className="w-2.5 h-2.5 text-emerald-700" />
                                            Đã chép
                                        </span>
                                    ) : (
                                        <Copy className="w-3 h-3 text-emerald-200 group-hover:text-white transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {onFillChatInput && dateOverlaps.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const best = dateOverlaps[0];
                                    const text = `Kèo này chốt nhé cả nhóm: ${formatDateLabelVN(activeDate)} từ ${best.startP.timeStr} đến ${best.endP.timeStr} (Cả nhóm đều rảnh)!`;
                                    onFillChatInput(text);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-sm shadow-xs transition-all cursor-pointer"
                                title="Gửi khung giờ chốt vào hộp chat nhóm"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Gửi vào Chat</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
