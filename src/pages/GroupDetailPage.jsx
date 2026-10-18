// src/pages/GroupDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Copy, 
    Check, 
    Trash2,
    LogOut,
    Split,
    Calendar,
    MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
    client, 
    executeGraphQL, 
    GET_MY_GROUPS_QUERY,
    GET_USERS_FROM_GROUP_QUERY, 
    SET_AVAILABILITY_MUTATION, 
    CALCULATE_OVERLAP_QUERY, 
    GET_GROUP_MESSAGES_QUERY, 
    SEND_MESSAGE_MUTATION, 
    ON_NEW_MESSAGE_SUBSCRIPTION,
    ON_AVAILABILITY_UPDATED_SUBSCRIPTION,
    DELETE_GROUP_MUTATION,
    LEAVE_GROUP_MUTATION
} from '../api/graphql';
import ScheduleOverlapChart from '../components/ScheduleOverlapChart';
import ChatBox from '../components/ChatBox';
import AvailabilityModal from '../components/AvailabilityModal';
import DeleteGroupModal from '../components/DeleteGroupModal';
import LeaveGroupModal from '../components/LeaveGroupModal';
import MembersListDropdown from '../components/MembersListDropdown';
import Breadcrumb from '../components/Breadcrumb';
import { copyToClipboard, formatDisplayName } from '../utils/dateUtils';

export default function GroupDetailPage({ user, userProfile }) {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const userId = user?.userId || user?.username;
    const userEmail = user?.signInDetails?.loginId || user?.username;
    const userDisplayName = formatDisplayName(userProfile?.fullName, formatDisplayName(userEmail, "Thành viên"));

    // Group info state
    const [group, setGroup] = useState(null);
    const [loadingGroup, setLoadingGroup] = useState(true);

    // Members and availability
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [mySlots, setMySlots] = useState([]);
    const [savingAvailability, setSavingAvailability] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

    // Overlap slots
    const [overlappingSlots, setOverlappingSlots] = useState(null);
    const [calculatingOverlap, setCalculatingOverlap] = useState(false);

    // Delete group state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState(false);

    // Leave group state
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leavingGroup, setLeavingGroup] = useState(false);

    // Copy group ID state
    const [copiedGroupId, setCopiedGroupId] = useState(null);

    // Chat Box state
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [inputMessage, setInputMessage] = useState("");
    const chatEndRef = useRef(null);

    // Chế độ xem trên Mobile ('split' | 'chart' | 'chat')
    const [mobileViewMode, setMobileViewMode] = useState('split');

    // 1. Tải thông tin nhóm và thành viên
    useEffect(() => {
        if (!groupId) return;
        loadGroupInfoAndMembers();
    }, [groupId]);

    async function loadGroupInfoAndMembers() {
        setLoadingGroup(true);
        setLoadingMembers(true);
        try {
            const groupRes = await executeGraphQL(GET_MY_GROUPS_QUERY);
            const found = (groupRes.getMyGroups || []).find(g => g.groupId === groupId);
            if (found) {
                setGroup(found);
            } else {
                setGroup({ groupId, name: `Nhóm #${groupId}` });
            }

            await loadMembers();
        } catch (err) {
            console.error("Lỗi tải thông tin nhóm:", err);
            toast.error("Lỗi tải thông tin nhóm: " + err.message);
        } finally {
            setLoadingGroup(false);
            setLoadingMembers(false);
        }
    }

    async function loadMembers() {
        try {
            const data = await executeGraphQL(GET_USERS_FROM_GROUP_QUERY, { groupId });
            const list = data.getUsersFromGroup || [];

            const sanitizedList = list.map(m => {
                if (m.userId === userId && userDisplayName) {
                    return { ...m, userName: userDisplayName };
                }
                return { ...m, userName: formatDisplayName(m.userName, "Thành viên") };
            });
            setMembers(sanitizedList);

            const me = list.find(m => m.userId === userId);
            if (me) {
                if (Array.isArray(me.timeSlots) && me.timeSlots.length > 0) {
                    setMySlots(me.timeSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })));
                } else {
                    setMySlots([]);
                }

                // Nếu tên cũ trong database đang chứa email hoặc UUID và hiện tại đã có display name đẹp
                if (userDisplayName && (me.userName?.includes('@') || /^[0-9a-f]{8}-/i.test(me.userName || '')) && me.userName !== userDisplayName) {
                    executeGraphQL(SET_AVAILABILITY_MUTATION, {
                        groupId,
                        userId,
                        userName: userDisplayName,
                        timeSlots: (me.timeSlots || []).map(s => ({ startTime: s.startTime, endTime: s.endTime }))
                    }).catch(err => console.warn("Tự động đồng bộ tên thành viên:", err));
                }
            } else {
                setMySlots([]);
            }
        } catch (err) {
            console.error("Lỗi tải thành viên:", err);
            setMembers([]);
        }
    }

    // 2. Tính toán khung giờ rảnh trùng trên Server với CALCULATE_OVERLAP_QUERY
    async function handleCalculateOverlap() {
        setCalculatingOverlap(true);
        try {
            const data = await executeGraphQL(CALCULATE_OVERLAP_QUERY, { groupId });
            const overlaps = data.calculateOverlap?.overlappingSlots || [];
            setOverlappingSlots(overlaps);
            if (overlaps.length === 0) {
                toast("Không tìm thấy khung giờ nào mà tất cả cùng rảnh. Vui lòng mở rộng khung giờ!", {
                    icon: 'ℹ️',
                });
            } else {
                toast.success(`Đã tìm thấy ${overlaps.length} khung giờ trùng hợp giữa các thành viên!`);
            }
        } catch (err) {
            toast.error("Lỗi tính toán: " + err.message);
        } finally {
            setCalculatingOverlap(false);
        }
    }

    // 3. Quản lý khung giờ rảnh cục bộ & lưu lên Server
    function handleAddSlot(slot) {
        setMySlots([...mySlots, slot]);
    }

    function handleRemoveSlot(index) {
        setMySlots(mySlots.filter((_, i) => i !== index));
    }

    async function handleSaveAllSlots() {
        setSavingAvailability(true);
        try {
            const cleanSlots = mySlots.map(s => {
                const startDate = new Date(s.startTime);
                const endDate = new Date(s.endTime);
                return {
                    startTime: isNaN(startDate.getTime()) ? s.startTime : startDate.toISOString(),
                    endTime: isNaN(endDate.getTime()) ? s.endTime : endDate.toISOString()
                };
            });

            await executeGraphQL(SET_AVAILABILITY_MUTATION, {
                groupId,
                userId,
                userName: userDisplayName,
                timeSlots: cleanSlots
            });

            await loadMembers();
            setShowAvailabilityModal(false);
            toast.success(`Đã lưu thành công ${mySlots.length} khung giờ rảnh của bạn vào nhóm!`);
        } catch (err) {
            toast.error("Lỗi khi lưu khung giờ: " + err.message);
        } finally {
            setSavingAvailability(false);
        }
    }

    // 4. Xóa nhóm (dành cho chủ nhóm)
    async function handleDeleteGroup() {
        if (!group) return;
        setDeletingGroup(true);
        try {
            await executeGraphQL(DELETE_GROUP_MUTATION, { groupId: group.groupId });
            setShowDeleteModal(false);
            toast.success(`Đã xóa nhóm "${group.name}" thành công.`);
            navigate('/groups');
        } catch (err) {
            toast.error("Lỗi xóa nhóm: " + err.message);
            setShowDeleteModal(false);
        } finally {
            setDeletingGroup(false);
        }
    }

    // 4b. Rời nhóm (dành cho mọi thành viên, bao gồm chủ nhóm)
    async function handleLeaveGroup() {
        if (!groupId) return;
        setLeavingGroup(true);
        try {
            await executeGraphQL(LEAVE_GROUP_MUTATION, { groupId });
            setShowLeaveModal(false);

            const isGroupOwner = group && group.ownerId === userId;
            const otherCount = members.filter(m => m.userId !== userId).length;

            if (isGroupOwner && otherCount > 0) {
                toast.success("Bạn đã rời nhóm. Quyền chủ nhóm đã được chuyển ngẫu nhiên cho thành viên khác.");
            } else if (isGroupOwner && otherCount === 0) {
                toast.success("Bạn đã rời nhóm. Nhóm đã tự động xóa do không còn thành viên.");
            } else {
                toast.success("Bạn đã rời nhóm thành công.");
            }
            navigate('/groups');
        } catch (err) {
            console.error("Lỗi rời nhóm:", err);
            toast.error("Lỗi rời nhóm: " + err.message);
            setShowLeaveModal(false);
        } finally {
            setLeavingGroup(false);
        }
    }

    // 5. Chat Box Realtime WebSockets
    useEffect(() => {
        if (!groupId) return;

        let isMounted = true;
        setLoadingMessages(true);

        async function fetchMessages() {
            try {
                const res = await client.graphql({
                    query: GET_GROUP_MESSAGES_QUERY,
                    variables: { groupId, limit: 50 }
                });
                if (isMounted) {
                    setMessages(res.data?.getGroupMessages || []);
                }
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        }

        fetchMessages();

        let sub = null;
        try {
            sub = client.graphql({
                query: ON_NEW_MESSAGE_SUBSCRIPTION,
                variables: { groupId }
            }).subscribe({
                next: ({ data }) => {
                    if (!isMounted || !data?.onNewMessage) return;
                    const newMsg = data.onNewMessage;
                    setMessages((prev) => {
                        if (prev.some(m => m.messageId === newMsg.messageId)) return prev;
                        const optIdx = prev.findIndex(
                            m => m.pending && m.content === newMsg.content && m.senderId === newMsg.senderId
                        );
                        if (optIdx !== -1) {
                            const updated = [...prev];
                            updated[optIdx] = newMsg;
                            return updated;
                        }
                        return [...prev, newMsg];
                    });
                },
                error: (subErr) => {
                    console.error("Lỗi WebSocket Subscription:", subErr);
                }
            });
        } catch (subInitErr) {
            console.error("Lỗi khởi tạo WebSocket:", subInitErr);
        }

        return () => {
            isMounted = false;
            if (sub && typeof sub.unsubscribe === 'function') {
                sub.unsubscribe();
            }
        };
    }, [groupId]);

    // 6. Realtime WebSocket cập nhật lịch rảnh tức thì khi có thành viên sửa
    useEffect(() => {
        if (!groupId) return;

        let isMounted = true;
        let availSub = null;

        try {
            availSub = client.graphql({
                query: ON_AVAILABILITY_UPDATED_SUBSCRIPTION,
                variables: { groupId }
            }).subscribe({
                next: ({ data }) => {
                    if (!isMounted || !data?.onAvailabilityUpdated) return;
                    const updated = data.onAvailabilityUpdated;

                    // 1. Cập nhật state members theo thời gian thực
                    setMembers((prev) => {
                        const idx = prev.findIndex(m => m.userId === updated.userId);
                        if (idx !== -1) {
                            const nextList = [...prev];
                            nextList[idx] = {
                                ...nextList[idx],
                                userName: updated.userName || nextList[idx].userName,
                                timeSlots: updated.timeSlots || []
                            };
                            return nextList;
                        } else {
                            return [...prev, updated];
                        }
                    });

                    // 2. Nếu là chính mình (đặt từ tab/thiết bị khác), đồng bộ lại mySlots
                    if (updated.userId === userId && Array.isArray(updated.timeSlots)) {
                        setMySlots(updated.timeSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })));
                    }

                    // 3. Xóa cache serverOverlap để biểu đồ dùng ngay clientOverlap mới nhất theo thời gian thực
                    setOverlappingSlots(null);
                },
                error: (subErr) => {
                    console.error("Lỗi WebSocket Availability Subscription:", subErr);
                }
            });
        } catch (subInitErr) {
            console.error("Lỗi khởi tạo Availability WebSocket:", subInitErr);
        }

        return () => {
            isMounted = false;
            if (availSub && typeof availSub.unsubscribe === 'function') {
                availSub.unsubscribe();
            }
        };
    }, [groupId, userId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    async function handleSendMessage(e) {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || !groupId) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const optimisticMsg = {
            messageId: tempId,
            groupId,
            senderId: userId,
            senderName: userDisplayName,
            content: text,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInputMessage("");
        setSendingMessage(true);

        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);

        try {
            const res = await client.graphql({
                query: SEND_MESSAGE_MUTATION,
                variables: { groupId, content: text }
            });
            const sent = res.data?.sendMessage;
            if (sent) {
                setMessages((prev) => prev.map(m => m.messageId === tempId ? sent : m));
            }
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
            setMessages((prev) => prev.map(m => m.messageId === tempId ? { ...m, pending: false, error: true } : m));
        } finally {
            setSendingMessage(false);
        }
    }

    async function handleCopyCode(code) {
        if (!code) return;
        await copyToClipboard(code);
        setCopiedGroupId(code);
        toast.success(`Đã sao chép mã nhóm: ${code}`, { duration: 2000 });
        setTimeout(() => setCopiedGroupId(null), 2000);
    }

    const isGroupOwner = group?.ownerId === userId;

    return (
        <div className="flex flex-col gap-3 flex-1 min-h-0 h-full overflow-hidden">
            {/* Thanh điều hướng: Hàng trên là Breadcrumb & Xóa nhóm, Trên mobile có hàng thanh công cụ ngang gồm Switcher & Sao chép */}
            <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-200 shrink-0">
                {/* Hàng 1: Trái là Breadcrumb, Phải là Xóa nhóm & Mã nhóm (trên Desktop) */}
                <div className="flex items-center justify-between gap-2.5 min-w-0">
                    {/* VỊ TRÍ BÊN TRÁI: ĐIỀU HƯỚNG DẠNG a > b > c */}
                    <div className="flex items-center min-w-0 flex-1">
                        <Breadcrumb 
                            items={[
                                { label: 'Danh sách nhóm', to: '/groups' },
                                { label: group?.name || `Nhóm #${groupId}` }
                            ]} 
                        />
                    </div>

                    {/* VỊ TRÍ BÊN PHẢI TRÊN DESKTOP: MÃ NHÓM & SAO CHÉP, CHỦ NHÓM, NÚT XÓA */}
                    <div className="hidden lg:flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-sm">
                            <span className="text-xs text-slate-500 font-medium">Mã nhóm:</span>
                            <span className="font-mono text-xs font-bold text-brand">
                                {groupId}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(groupId)}
                                className="inline-flex items-center gap-1 ml-1 text-[11px] font-semibold text-slate-600 hover:text-brand cursor-pointer transition-colors"
                                title="Sao chép mã nhóm"
                            >
                                {copiedGroupId === groupId ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span className="text-emerald-600">Đã chép</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Chép</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {isGroupOwner && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm">
                                Chủ nhóm
                            </span>
                        )}

                        {/* Dropdown xem danh sách thành viên */}
                        <MembersListDropdown
                            members={members}
                            ownerId={group?.ownerId}
                            currentUserId={userId}
                        />

                        {/* Nút rời nhóm */}
                        <button
                            type="button"
                            onClick={() => setShowLeaveModal(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:text-white bg-white hover:bg-amber-600 border border-amber-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                            title="Rời khỏi nhóm này"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Rời nhóm</span>
                        </button>

                        {/* Nút xóa nhóm (dành riêng cho chủ nhóm) */}
                        {isGroupOwner && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                                title="Xóa nhóm này"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa nhóm</span>
                            </button>
                        )}
                    </div>

                    {/* VỊ TRÍ BÊN PHẢI TRÊN MOBILE: DROPDOWN THÀNH VIÊN, NÚT RỜI & NÚT XÓA */}
                    <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                        <MembersListDropdown
                            members={members}
                            ownerId={group?.ownerId}
                            currentUserId={userId}
                        />

                        <button
                            type="button"
                            onClick={() => setShowLeaveModal(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 hover:text-white bg-white hover:bg-amber-600 border border-amber-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                            title="Rời khỏi nhóm này"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Rời</span>
                        </button>

                        {isGroupOwner && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                                title="Xóa nhóm này"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Hàng 2: TRÊN MOBILE - CỤM CHUYỂN CHẾ ĐỘ XEM VÀ NÚT SAO CHÉP MÃ NHÓM NẰM NGANG HÀNG NHAU */}
                <div className="flex lg:hidden items-center justify-between gap-1.5 w-full pt-0.5">
                    {/* Cụm switcher chế độ xem: Chia đôi | Biểu đồ | Chat */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200 shrink-0">
                        <button
                            type="button"
                            onClick={() => setMobileViewMode('split')}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                mobileViewMode === 'split' 
                                    ? 'bg-white text-brand shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Chia đôi màn hình: Vừa xem biểu đồ vừa chat"
                        >
                            <Split className="w-3 h-3 shrink-0" />
                            <span>Chia đôi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileViewMode('chart')}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                mobileViewMode === 'chart' 
                                    ? 'bg-white text-brand shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Phóng to biểu đồ"
                        >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Biểu đồ</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileViewMode('chat')}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${
                                mobileViewMode === 'chat' 
                                    ? 'bg-white text-brand shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Phóng to chat"
                        >
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            <span>Chat</span>
                        </button>
                    </div>

                    {/* Nút mã nhóm & Sao chép gọn gàng, bấm trực tiếp để sao chép */}
                    <button
                        type="button"
                        onClick={() => handleCopyCode(groupId)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200/80 active:scale-95 border border-slate-300 rounded-sm cursor-pointer transition-all shadow-2xs shrink-0 select-none"
                        title="Nhấn để sao chép mã nhóm"
                    >
                        <span className="font-mono text-xs font-bold text-brand">{groupId}</span>
                        {copiedGroupId === groupId ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Đã chép</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 font-semibold">
                                <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>Chép</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* BỐ CỤC: TRÊN DESKTOP LÀ 2 CỘT 8-4 FULL HEIGHT. TRÊN MOBILE LÀ SPLIT VIEW (TRÊN 48%, DƯỚI FLEX-1) */}
            <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:h-full gap-2.5 sm:gap-4 overflow-hidden">
                {/* CỘT TRÁI: BIỂU ĐỒ SO SÁNH LỊCH RẢNH (Desktop luôn lg:h-full) */}
                <div 
                    className={`min-h-0 flex flex-col overflow-hidden lg:col-span-8 lg:h-full ${
                        mobileViewMode === 'split' 
                            ? 'max-lg:h-[48%] max-lg:min-h-[160px]' 
                            : mobileViewMode === 'chart' 
                                ? 'h-full flex-1' 
                                : 'max-lg:hidden lg:flex'
                    }`}
                >
                    <ScheduleOverlapChart
                        members={members}
                        serverOverlap={overlappingSlots}
                        currentUserId={userId}
                        ownerId={group?.ownerId}
                        onCalculateOverlap={handleCalculateOverlap}
                        calculatingOverlap={calculatingOverlap}
                        onFillChatInput={(text) => {
                            setInputMessage(text);
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        onOpenAvailabilityModal={() => setShowAvailabilityModal(true)}
                        mobileViewMode={mobileViewMode}
                        onToggleMobileExpand={() => setMobileViewMode(mobileViewMode === 'chart' ? 'split' : 'chart')}
                    />
                </div>

                {/* CỘT PHẢI: HỘP CHAT BOX NHÓM (Desktop luôn lg:h-full) */}
                <div 
                    className={`min-h-0 flex flex-col overflow-hidden lg:col-span-4 lg:h-full ${
                        mobileViewMode === 'split' 
                            ? 'max-lg:flex-1 max-lg:min-h-[200px]' 
                            : mobileViewMode === 'chat' 
                                ? 'h-full flex-1' 
                                : 'max-lg:hidden lg:flex'
                    }`}
                >
                    <ChatBox
                        groupName={group?.name}
                        userId={userId}
                        userProfile={userProfile}
                        members={members}
                        messages={messages}
                        loadingMessages={loadingMessages}
                        inputMessage={inputMessage}
                        setInputMessage={setInputMessage}
                        onSendMessage={handleSendMessage}
                        sendingMessage={sendingMessage}
                        chatEndRef={chatEndRef}
                        mobileViewMode={mobileViewMode}
                        onToggleMobileExpand={() => setMobileViewMode(mobileViewMode === 'chat' ? 'split' : 'chat')}
                    />
                </div>
            </div>

            {/* MODAL ĐẶT / SỬA KHUNG GIỜ RẢNH */}
            <AvailabilityModal
                isOpen={showAvailabilityModal}
                onClose={() => setShowAvailabilityModal(false)}
                mySlots={mySlots}
                onAddSlot={handleAddSlot}
                onRemoveSlot={handleRemoveSlot}
                onSaveAllSlots={handleSaveAllSlots}
                saving={savingAvailability}
            />

            {/* MODAL XÁC NHẬN XÓA NHÓM */}
            <DeleteGroupModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                group={group}
                onConfirm={handleDeleteGroup}
                deleting={deletingGroup}
            />

            {/* MODAL XÁC NHẬN RỜI NHÓM */}
            <LeaveGroupModal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                onConfirm={handleLeaveGroup}
                leaving={leavingGroup}
                groupName={group?.name}
                isOwner={group && group.ownerId === userId}
                otherMembersCount={members.filter(m => m.userId !== userId).length}
            />
        </div>
    );
}
