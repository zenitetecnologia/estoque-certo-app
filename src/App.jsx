import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import HomePage from './pages/HomePage';

export default function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [pendingMessage, setPendingMessage] = useState('');

    const handleLogin = (userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentPage('login');
    };

    const handlePendingApproval = (message) => {
        setPendingMessage(message);
        setCurrentPage('pending');
    };

    if (!token) {
        if (currentPage === 'register') return <RegisterPage onNavigate={setCurrentPage} />;
        if (currentPage === 'forgot') return <ForgotPasswordPage onNavigate={setCurrentPage} />;
        if (currentPage === 'pending') return <PendingApprovalPage onNavigate={setCurrentPage} message={pendingMessage} />;
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} onPendingApproval={handlePendingApproval} />;
    }

    return (
        <HomePage token={token} onLogout={handleLogout} />
    );
}