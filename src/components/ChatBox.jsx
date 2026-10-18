import React, { useRef } from 'react';
import { Send, Maximize2, Minimize2 } from 'lucide-react';
import { formatMessageTime, formatDisplayName } from '../utils/dateUtils';

export default function ChatBox({
    groupName = "",
    userId,
    userProfile,
    members = [],
    messages = [],
    loadingMessages = false,
    inputMessage = "",
    setInputMessage,
    onSendMessage,
    sendingMessage = false,
    chatEndRef,
    mobileViewMode = 'split',
    onToggleMobileExpand = null
}) {
    const inputRef = useRef(null);

    function handleSubmit(e) {
        e.preventDefault();
        if (!inputMessage.trim()) return;
        onSendMessage(e);
        // Giữ focus trên ô input để bàn phím ảo liên tục mở như app chat native
        setTimeout(() => {
            inputRef.current?.focus();
        }, 10);
    }
    return (
        <aside className="bg-white rounded-sm border border-slate-200 shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block" title={groupName ? `Box chat ${groupName}` : "Box chat nhóm"}>
                        Box chat {groupName || "nhóm"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] sm:text-[11px] font-semibold">Trực tiếp</span>
                    </div>

                    {onToggleMobileExpand && (
                        <button
                            type="button"
                            onClick={onToggleMobileExpand}
                            className="lg:hidden p-1 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                            title={mobileViewMode === 'chat' ? "Thu nhỏ về dạng chia đôi" : "Phóng to chat"}
                        >
                            {mobileViewMode === 'chat' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Danh sách tin nhắn phong cách Messenger */}
            <div className="flex-1 min-h-0 p-2.5 sm:p-3 overflow-y-auto flex flex-col gap-2 bg-slate-50/40">
                {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                        Đang tải tin nhắn...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-slate-400 gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">Chưa có tin nhắn nào</span>
                        <span className="text-[11px] text-slate-400 max-w-[200px]">
                            Hãy gửi tin nhắn đầu tiên để cùng lên kèo hẹn nhé!
                        </span>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === userId;
                        const memberMatch = members.find(m => m.userId === msg.senderId);

                        let candidateName = null;
                        if (isMe && userProfile?.fullName) {
                            const cleaned = formatDisplayName(userProfile.fullName, null);
                            if (cleaned) candidateName = cleaned;
                        }
                        if (!candidateName && memberMatch?.userName) {
                            const cleaned = formatDisplayName(memberMatch.userName, null);
                            if (cleaned) candidateName = cleaned;
                        }
                        if (!candidateName && msg.senderName) {
                            const cleaned = formatDisplayName(msg.senderName, null);
                            if (cleaned) candidateName = cleaned;
                        }
                        const senderDisplayName = candidateName || (isMe ? "Bạn" : "Thành viên");
                        const initial = senderDisplayName.charAt(0).toUpperCase() || "T";
                        const timeDisplay = formatMessageTime(msg.createdAt);

                        return (
                            <div
                                key={msg.messageId || index}
                                className={`flex gap-1.5 sm:gap-2 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'}`}
                            >
                                {!isMe && (
                                    <div 
                                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-light text-brand flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 self-end mb-3 sm:mb-4 shadow-2xs border border-brand/20"
                                        title={senderDisplayName}
                                    >
                                        {initial}
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <span className="text-[10px] font-semibold text-slate-500 mb-0.5 ml-1.5">
                                            {senderDisplayName}
                                        </span>
                                    )}

                                    <div
                                        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs leading-relaxed break-words shadow-2xs ${
                                            isMe
                                                ? 'bg-brand text-white rounded-2xl rounded-br-xs'
                                                : 'bg-slate-200/90 text-slate-900 rounded-2xl rounded-bl-xs'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>

                                    <div className="flex items-center gap-1 mt-0.5 px-1.5 text-[9px] sm:text-[10px] text-slate-400">
                                        {timeDisplay && <span>{timeDisplay}</span>}
                                        {msg.pending && <span className="text-amber-600 font-medium">Đang gửi...</span>}
                                        {msg.error && <span className="text-rose-600 font-medium">Lỗi gửi</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Khung nhập tin nhắn phong cách Messenger (bo tròn pill) */}
            <form onSubmit={handleSubmit} className="p-2 sm:p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onFocus={() => {
                        setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 200);
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3.5 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-xs bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                    disabled={!inputMessage.trim()}
                    className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand hover:bg-brand-hover active:scale-95 text-white transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                    title="Gửi tin nhắn"
                >
                    <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
            </form>
        </aside>
    );
}
