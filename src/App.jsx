import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import HomePage from './pages/HomePage';

export default function App() {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [pendingMessage, setPendingMessage] = useState('');

    const handleLogin = (userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
        navigate('/', { replace: true });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login', { replace: true });
    };

    const handlePendingApproval = (message) => {
        setPendingMessage(message);
        navigate('/pending-approval', { replace: true, state: { message } });
    };

    return (
        <Routes>
            <Route
                path="/login"
                element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} onPendingApproval={handlePendingApproval} />}
            />
            <Route
                path="/register"
                element={token ? <Navigate to="/" replace /> : <RegisterPage />}
            />
            <Route
                path="/forgot-password"
                element={token ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
            />
            <Route
                path="/pending-approval"
                element={token ? <Navigate to="/" replace /> : <PendingApprovalPage message={pendingMessage} />}
            />
            <Route
                path="/*"
                element={token ? <HomePage token={token} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
            />
        </Routes>
    );
}