// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Trash2, ChevronDown, User } from 'lucide-react';
import { deleteUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import DeleteAccountModal from './DeleteAccountModal';
import { executeGraphQL, GET_MY_GROUPS_QUERY, LEAVE_GROUP_MUTATION } from '../api/graphql';

export default function Navbar({ user, userProfile, signOut }) {
    const displayName = userProfile?.fullName || user?.signInDetails?.loginId || user?.username || "Thành viên";
    const userEmail = userProfile?.email || user?.signInDetails?.loginId || user?.username || "";
    const initial = (displayName || "U").charAt(0).toUpperCase();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const menuRef = useRef(null);

    // Đóng dropdown menu khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Xử lý xác nhận xóa tài khoản (tự động chuyển quyền chủ nhóm ngẫu nhiên nếu là chủ nhóm)
    async function handleConfirmDelete() {
        setDeletingAccount(true);
        try {
            // 1. Tự động rời các nhóm (chuyển quyền chủ nhóm ngẫu nhiên cho thành viên khác hoặc xóa nhóm nếu là người duy nhất)
            try {
                const res = await executeGraphQL(GET_MY_GROUPS_QUERY);
                const myGroups = res?.getMyGroups || [];
                for (const g of myGroups) {
                    try {
                        await executeGraphQL(LEAVE_GROUP_MUTATION, { groupId: g.groupId });
                    } catch (leaveErr) {
                        console.warn(`Lỗi rời nhóm ${g.groupId} khi xóa tài khoản:`, leaveErr);
                    }
                }
            } catch (groupCleanupErr) {
                console.warn("Lỗi tải danh sách nhóm để chuyển quyền:", groupCleanupErr);
            }

            // 2. Xóa tài khoản vĩnh viễn khỏi Cognito
            await deleteUser();
            toast.success("Đã xóa tài khoản thành công!");
            setShowDeleteModal(false);
            if (signOut) {
                signOut();
            }
        } catch (err) {
            console.error("Lỗi xóa tài khoản:", err);
            toast.error("Lỗi khi xóa tài khoản: " + err.message);
        } finally {
            setDeletingAccount(false);
        }
    }

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
                {/* Logo / Brand */}
                <Link
                    to="/groups"
                    className="flex items-center gap-2.5 hover:opacity-90 transition-opacity no-underline"
                >
                    <img
                        src={logoImg}
                        alt="Lên Kèo"
                        className="h-9 w-auto object-contain rounded-sm"
                    />
                    <div>
                        <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                            Trippy
                        </span>
                    </div>
                </Link>

                {/* Menu tài khoản người dùng */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors cursor-pointer shadow-xs select-none"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="true"
                    >
                        <div className="w-5 h-5 rounded-sm bg-brand-light text-brand border border-brand/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {initial}
                        </div>
                        <span className="font-semibold truncate max-w-[130px] sm:max-w-[200px]" title={displayName}>
                            {displayName}
                        </span>
                        <ChevronDown 
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-brand' : ''
                            }`} 
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-sm shadow-lg z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                            {/* Header thông tin người dùng */}
                            <div className="px-3 py-2 border-b border-slate-100 flex flex-col gap-0.5">
                                <span className="font-bold text-slate-900 truncate">
                                    {displayName}
                                </span>
                                {userEmail && (
                                    <span className="text-[11px] text-slate-500 truncate" title={userEmail}>
                                        {userEmail}
                                    </span>
                                )}
                            </div>

                            {/* Các mục chức năng */}
                            <div className="py-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (signOut) signOut();
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Đăng xuất</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setShowDeleteModal(true);
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Xóa tài khoản</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal xác nhận xóa tài khoản */}
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                deleting={deletingAccount}
                userEmail={userEmail}
            />
        </header>
    );
}
