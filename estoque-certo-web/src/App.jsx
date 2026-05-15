import React, { useState, useEffect, useRef } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';

export default function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [showIosPrompt, setShowIosPrompt] = useState(false);

    const dialogRef = useRef(null);

    useEffect(() => {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isIos && !isInStandaloneMode) {
            setShowIosPrompt(true);
        }
    }, []);

    useEffect(() => {
        if (showIosPrompt && dialogRef.current) {
            dialogRef.current.showModal();
        }
    }, [showIosPrompt]);

    const handleLogin = (userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentPage('login');
    };

    const handleClosePrompt = () => {
        setShowIosPrompt(false);
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };

    if (!token) {
        if (currentPage === 'register') return <RegisterPage onNavigate={setCurrentPage} />;
        if (currentPage === 'forgot') return <ForgotPasswordPage onNavigate={setCurrentPage} />;
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />;
    }

    return (
        <div>
            <HomePage token={token} onLogout={handleLogout} />

            <dialog ref={dialogRef} style={{ maxWidth: '400px', border: 'none', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Instale o Estoque Certo</h3>

                <p>Para usar offline, toque em <b>Compartilhar</b> e depois em <b>"Adicionar a tela inicial"</b>.</p>

                <img
                    src="/tutorial-ios.gif"
                    alt="Tutorial de instalação"
                    style={{ width: '100%', borderRadius: '50   px', marginBottom: '16px' }}
                />
                <button
                    onClick={handleClosePrompt}
                    style={{
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        padding: '12px 24px',
                        fontSize: '18px',
                        borderRadius: '8px'
                    }}
                >
                    Entendi
                </button>
            </dialog>
        </div>
    );
}