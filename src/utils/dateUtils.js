// src/utils/dateUtils.js
// Các hàm tiện ích xử lý định dạng ngày giờ và thuật toán tính khung giờ trùng (overlap)

/**
 * Định dạng ngày giờ chuẩn hiển thị tiếng Việt
 * Trả về: { dayName, dateStr, timeStr, full }
 */
export function formatDateTimeVN(isoString) {
    if (!isoString) return { dayName: "", dateStr: "", timeStr: "", full: "" };
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { dayName: "", dateStr: isoString, timeStr: "", full: isoString };

    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const dayName = days[d.getDay()];
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

    return { 
        dayName, 
        dateStr, 
        timeStr, 
        full: `${dayName}, ${dateStr} lúc ${timeStr}` 
    };
}

/**
 * Định dạng giờ tin nhắn trong Chat Box (HH:mm)
 */
export function formatMessageTime(isoString) {
    if (!isoString) return "";
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return "";
    }
}

/**
 * Định dạng nhãn ngày theo dạng: Thứ X, DD/MM/YYYY
 */
export function formatDateLabelVN(dateStr) {
    if (!dateStr) return "";
    try {
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        return `${dayNames[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
        return dateStr;
    }
}

/**
 * Lấy thông tin ngày và giờ dưới dạng số float (để tính tỷ lệ % trên trục timeline)
 */
export function parseSlotHour(isoStr) {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return null;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    const hours = d.getHours();
    const minutes = d.getMinutes();
    const hourFloat = hours + minutes / 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
        dateStr,
        hourFloat,
        timeStr,
        timestamp: d.getTime(),
    };
}

/**
 * Gộp các khoảng thời gian bị đè nhau hoặc liên tiếp của 1 người
 */
export function mergeMemberIntervals(intervals) {
    if (!intervals || intervals.length <= 1) return intervals || [];
    const sorted = [...intervals].sort((a, b) => a.start - b.start);

    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const curr = sorted[i];
        if (curr.start <= last.end) {
            last.end = Math.max(last.end, curr.end);
        } else {
            merged.push(curr);
        }
    }
    return merged;
}

/**
 * Tìm giao điểm (overlap) giữa 2 danh sách khoảng thời gian
 */
export function intersectTwoIntervalLists(listA, listB) {
    let i = 0;
    let j = 0;
    const result = [];
    while (i < listA.length && j < listB.length) {
        const start = Math.max(listA[i].start, listB[j].start);
        const end = Math.min(listA[i].end, listB[j].end);
        if (start < end) {
            result.push({ start, end });
        }
        if (listA[i].end < listB[j].end) {
            i++;
        } else if (listB[j].end < listA[i].end) {
            j++;
        } else {
            i++;
            j++;
        }
    }
    return result;
}

/**
 * Tính toán khung giờ rảnh chung của tất cả thành viên đã đăng ký lịch (Client-side)
 */
export function computeClientOverlap(members) {
    if (!Array.isArray(members) || members.length < 2) return [];

    const activeMembers = members
        .map(m => {
            const raw = Array.isArray(m.timeSlots) ? m.timeSlots : [];
            const intervals = raw
                .map(s => {
                    const startP = parseSlotHour(s.startTime);
                    const endP = parseSlotHour(s.endTime);
                    if (!startP || !endP || endP.timestamp <= startP.timestamp) return null;
                    return {
                        start: startP.timestamp,
                        end: endP.timestamp,
                    };
                })
                .filter(Boolean);
            return mergeMemberIntervals(intervals);
        })
        .filter(list => list.length > 0);

    if (activeMembers.length < 2) return [];

    let common = activeMembers[0];
    for (let k = 1; k < activeMembers.length; k++) {
        common = intersectTwoIntervalLists(common, activeMembers[k]);
        if (common.length === 0) break;
    }

    return common.map(item => ({
        startTime: new Date(item.start).toISOString(),
        endTime: new Date(item.end).toISOString(),
    }));
}

/**
 * Hàm sao chép an toàn hoạt động trên cả HTTPS, HTTP LAN (qua IP) và thiết bị di động
 */
export async function copyToClipboard(text) {
    if (!text) return false;
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fallback sang execCommand bên dưới
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
    } catch {
        return false;
    }
}

/**
 * Chuẩn hóa tên hiển thị của người dùng:
 * - Loại bỏ hậu tố email (ví dụ: 'abc@gmail.com' -> 'abc')
 * - Không hiển thị mã UUID thô của Cognito sub
 * - Trả về fallback nếu rỗng hoặc chỉ có khoảng trắng
 */
export function formatDisplayName(rawName, fallback = "Thành viên") {
    if (!rawName || typeof rawName !== 'string') return fallback;
    const trimmed = rawName.trim();
    if (!trimmed) return fallback;

    // Kiểm tra nếu là Cognito sub / UUID (36 ký tự hex phân tách bởi dấu gạch ngang)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
        return fallback;
    }

    // Nếu chứa địa chỉ email (ví dụ user@gmail.com)
    if (trimmed.includes('@')) {
        const prefix = trimmed.split('@')[0];
        return prefix || fallback;
    }

    return trimmed;
}

