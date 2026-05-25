import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

export default function PendingApprovalPage({ onNavigate, message }) {
    return (
        <>
            <ThemeToggle />
            <div className="container">
                <div className="auth-page">
                    <div className="card auth-card text-center">
                        {message && (
                            <p className="pending-description">
                                {message}
                            </p>
                        )}

                        <button
                            type="button"
                            className="button button-outline button-full"

                            onClick={() => onNavigate('login')}
                        >
                            Voltar
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
}