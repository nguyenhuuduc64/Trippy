// src/pages/GroupsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    LogIn,
    RefreshCw,
    Copy,
    Check,
    ChevronRight,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    executeGraphQL,
    GET_MY_GROUPS_QUERY,
    CREATE_GROUP_MUTATION,
    JOIN_GROUP_MUTATION
} from '../api/graphql';
import { formatDateTimeVN } from '../utils/dateUtils';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';

export default function GroupsPage({ user }) {
    const navigate = useNavigate();
    const userId = user?.userId || user?.username;

    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [joiningGroup, setJoiningGroup] = useState(false);

    // Copy code state
    const [copiedGroupId, setCopiedGroupId] = useState(null);

    useEffect(() => {
        loadGroups();
    }, []);

    async function loadGroups() {
        setLoadingGroups(true);
        try {
            const data = await executeGraphQL(GET_MY_GROUPS_QUERY);
            setGroups(data.getMyGroups || []);
        } catch (err) {
            console.error("Lỗi tải danh sách nhóm:", err);
            toast.error("Lỗi tải danh sách nhóm: " + err.message);
        } finally {
            setLoadingGroups(false);
        }
    }

    async function handleCreateGroup(name) {
        setCreatingGroup(true);
        try {
            const data = await executeGraphQL(CREATE_GROUP_MUTATION, { name });
            const created = data.createGroup;
            setIsCreateOpen(false);
            toast.success(`Đã tạo nhóm "${created.name}" thành công (Mã: ${created.groupId})`);
            navigate(`/groups/${created.groupId}`);
        } catch (err) {
            toast.error("Lỗi khi tạo nhóm: " + err.message);
        } finally {
            setCreatingGroup(false);
        }
    }

    async function handleJoinGroup(code) {
        setJoiningGroup(true);
        try {
            const data = await executeGraphQL(JOIN_GROUP_MUTATION, { groupId: code });
            const joined = data.joinGroup;
            setIsJoinOpen(false);
            toast.success(`Đã tham gia nhóm "${joined.name}" thành công!`);
            navigate(`/groups/${joined.groupId}`);
        } catch (err) {
            toast.error(err.message || "Không thể tham gia nhóm");
        } finally {
            setJoiningGroup(false);
        }
    }

    function handleCopyCode(code, e) {
        e.stopPropagation();
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedGroupId(code);
        toast.success(`Đã chép mã: ${code}`, { duration: 2000 });
        setTimeout(() => setCopiedGroupId(null), 2000);
    }

    return (
        <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Nhóm của bạn
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Chọn một nhóm bên dưới để xem lịch rảnh hoặc tạo nhóm mới để lên kèo hẹn.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                        type="button"
                        onClick={loadGroups}
                        disabled={loadingGroups}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm shadow-xs transition-colors cursor-pointer"
                        title="Tải lại danh sách nhóm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingGroups ? 'animate-spin-custom' : ''}`} />
                        <span>Làm mới</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm bg-brand hover:bg-brand-hover text-white shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo nhóm mới</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsJoinOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Tham gia nhóm</span>
                    </button>
                </div>
            </div>

            {/* Danh sách các nhóm */}
            {loadingGroups ? (
                <div className="py-16 text-center text-sm text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin-custom text-brand" />
                    <span>Đang tải danh sách nhóm của bạn...</span>
                </div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-sm border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Bạn chưa tham gia nhóm nào</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                        Hãy tạo một nhóm mới hoặc nhập mã 6 số do bạn bè chia sẻ để bắt đầu tìm giờ hẹn chung.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-sm shadow-xs transition-colors cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tạo nhóm mới</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsJoinOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm transition-colors cursor-pointer"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Tham gia bằng mã</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => {
                        const isOwner = group.ownerId === userId;
                        const createdFormatted = group.createdAt ? formatDateTimeVN(group.createdAt) : null;

                        return (
                            <div
                                key={group.groupId}
                                onClick={() => navigate(`/groups/${group.groupId}`)}
                                className="group bg-white rounded-sm border border-slate-200 hover:border-brand hover:shadow-xs p-5 flex flex-col justify-between transition-all cursor-pointer relative gap-4"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-brand transition-colors truncate">
                                                {group.name}
                                            </h3>
                                            {createdFormatted && (
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Tạo ngày {createdFormatted.dateStr}</span>
                                                </div>
                                            )}
                                        </div>

                                        {isOwner && (
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm shrink-0">
                                                Chủ nhóm
                                            </span>
                                        )}
                                    </div>

                                    {/* 6-Digit Code Badge */}
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                                Mã nhóm
                                            </span>
                                            <span className="font-mono text-sm font-bold text-brand tracking-wider">
                                                {group.groupId}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyCode(group.groupId, e)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-brand bg-white hover:bg-slate-100 border border-slate-300 rounded-sm transition-colors cursor-pointer shadow-xs"
                                            title="Sao chép mã nhóm"
                                        >
                                            {copiedGroupId === group.groupId ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-600" />
                                                    <span className="text-[11px] text-emerald-600">Đã chép</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />
                                                    <span className="text-[11px]">Sao chép</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand font-semibold">
                                    <span>Vào xem chi tiết & lịch rảnh</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal tạo nhóm mới (popup form) */}
            <CreateGroupModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreateGroup={handleCreateGroup}
                loading={creatingGroup}
            />

            {/* Modal tham gia nhóm (popup form) */}
            <JoinGroupModal
                isOpen={isJoinOpen}
                onClose={() => setIsJoinOpen(false)}
                onJoinGroup={handleJoinGroup}
                loading={joiningGroup}
            />
        </div>
    );
}
