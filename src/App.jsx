// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';

// Cấu hình các trường nhập liệu khi Đăng ký tài khoản (bao gồm Họ và tên)
const formFields = {
    signUp: {
        name: {
            order: 1,
            label: 'Họ và tên',
            placeholder: 'Nhập họ và tên đầy đủ...',
            isRequired: true,
        },
        email: {
            order: 2,
            label: 'Email',
            placeholder: 'Nhập địa chỉ email của bạn...',
            isRequired: true,
        },
        password: {
            order: 3,
            label: 'Mật khẩu',
            placeholder: 'Nhập mật khẩu (tối thiểu 8 ký tự)...',
            isRequired: true,
        },
        confirm_password: {
            order: 4,
            label: 'Xác nhận lại mật khẩu',
            placeholder: 'Nhập lại mật khẩu...',
            isRequired: true,
        },
    },
};

function MainApp({ user, signOut }) {
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (!user) return;
        async function loadAttributes() {
            try {
                const attrs = await fetchUserAttributes();
                setUserProfile({
                    userId: user?.userId || user?.username,
                    fullName: attrs.name || attrs.email?.split('@')[0] || user?.username,
                    email: attrs.email || user?.signInDetails?.loginId || user?.username,
                });
            } catch (err) {
                console.error("Lỗi tải thông tin user attributes:", err);
                setUserProfile({
                    userId: user?.userId || user?.username,
                    fullName: user?.signInDetails?.loginId?.split('@')[0] || user?.username,
                    email: user?.signInDetails?.loginId || user?.username,
                });
            }
        }
        loadAttributes();
    }, [user]);

    return (
        <BrowserRouter>
            <div className="h-full h-[100dvh] w-full overflow-hidden bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
                {/* Toaster thông báo toàn ứng dụng */}
                <Toaster 
                    position="top-right" 
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e2e8f0',
                        },
                    }}
                />

                {/* Header thanh điều hướng */}
                <Navbar user={user} userProfile={userProfile} signOut={signOut} />

                {/* Khung nội dung chính căn giữa */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Định tuyến Trang (React Router DOM) */}
                    <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <Routes>
                            <Route path="/" element={<Navigate to="/groups" replace />} />
                            <Route 
                                path="/groups" 
                                element={
                                    <GroupsPage 
                                        user={user} 
                                        userProfile={userProfile}
                                    />
                                } 
                            />
                            <Route 
                                path="/groups/:groupId" 
                                element={
                                    <GroupDetailPage 
                                        user={user} 
                                        userProfile={userProfile}
                                    />
                                } 
                            />
                            <Route path="*" element={<Navigate to="/groups" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <Authenticator formFields={formFields}>
            {({ signOut, user }) => (
                <MainApp user={user} signOut={signOut} />
            )}
        </Authenticator>
    );
}
