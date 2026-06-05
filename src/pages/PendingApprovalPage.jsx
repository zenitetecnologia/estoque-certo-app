import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function PendingApprovalPage({ message }) {
    const navigate = useNavigate();
    const location = useLocation();
    const pendingMessage = location.state?.message || message;

    return (
        <>
            <div className="container">
                <div className="auth-page">
                    <div className="card auth-card text-center">
                        <ThemeToggle fixo={false} />
                        {pendingMessage && (
                            <p className="pending-description">
                                {pendingMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="button button-outline button-full"

                            onClick={() => navigate('/login')}
                        >
                            Voltar
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
}