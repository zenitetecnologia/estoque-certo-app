import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

export default function PendingApprovalPage({ onNavigate }) {
    return (
        <>
            <ThemeToggle />
            <div className="container">
                <div className="auth-page">
                    <div className="card auth-card text-center">

                        <h2 className="pending-title">
                            Aguarde mais um pouco por favor.
                        </h2>

                        <p className="pending-description">
                            Seu cadastro ainda está sendo validado pelo administrador do sistema.
                        </p>

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