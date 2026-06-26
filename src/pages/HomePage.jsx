import { useEffect, useMemo, useState } from 'react';
import MessageModal from '../components/MessageModal';
import AppHeader from '../components/layout/AppHeader';
import LogoutModal from '../components/layout/LogoutModal';
import Sidebar from '../components/layout/Sidebar';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePwaInstall } from '../hooks/usePwaInstall';
import AuthenticatedRoutes from '../routes/AuthenticatedRoutes';
import { getNomeExibicaoUnidade, listarUnidadesOrganizacionais } from '../services/unidadeOrganizacionalService';
import { getUserFromToken } from '../utils/authUser';

export default function HomePage({ token, onLogout }) {
    const usuario = useMemo(() => getUserFromToken(token), [token]);
    const {
        erro,
        sucesso,
        fieldErrors,
        formData,
        setFormData,
        handleUpdateData,
        handleCancelProfile,
        clearMessages
    } = useProfileForm({ token, usuario });
    const pwaInstall = usePwaInstall();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [nomeUnidadeOrganizacional, setNomeUnidadeOrganizacional] = useState(usuario.unidadeOrganizacionalNome || '');

    useEffect(() => {
        let cancelado = false;

        if (usuario.unidadeOrganizacionalNome) {
            setNomeUnidadeOrganizacional(usuario.unidadeOrganizacionalNome);
            return () => {
                cancelado = true;
            };
        }

        if (!usuario.unidadeOrganizacionalId) {
            setNomeUnidadeOrganizacional('');
            return () => {
                cancelado = true;
            };
        }

        listarUnidadesOrganizacionais()
            .then(res => (res.ok ? res.json() : []))
            .then(data => {
                if (cancelado || !Array.isArray(data)) return;

                const unidade = data.find(item => item.unidadeOrganizacionalId === usuario.unidadeOrganizacionalId);
                setNomeUnidadeOrganizacional(getNomeExibicaoUnidade(unidade));
            })
            .catch(() => {
                if (!cancelado) setNomeUnidadeOrganizacional('');
            });

        return () => {
            cancelado = true;
        };
    }, [usuario.unidadeOrganizacionalId, usuario.unidadeOrganizacionalNome]);

    return (
        <div className="app-shell">
            <input type="checkbox" id="menu-toggle" className="sidebar-checkbox" />

            <AppHeader />
            <Sidebar
                isAdmin={usuario.isAdmin}
                isInstalled={pwaInstall.isInstalled}
                organizacaoNome={nomeUnidadeOrganizacional}
                onInstallClick={pwaInstall.install}
                onLogoutClick={() => setShowLogoutModal(true)}
                usuarioNome={usuario.nome}
            />

            <main className="container app-main">
                <AuthenticatedRoutes
                    fieldErrors={fieldErrors}
                    formData={formData}
                    isAdmin={usuario.isAdmin}
                    onCancelProfile={handleCancelProfile}
                    onChangeProfile={setFormData}
                    onSubmitProfile={handleUpdateData}
                    token={token}
                    unidadeOrganizacionalId={formData.unidadeOrganizacionalId}
                    usuarioId={usuario.usuarioId}
                />
            </main>

            {showLogoutModal && (
                <LogoutModal
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={onLogout}
                />
            )}

            {(erro || sucesso) && (
                <MessageModal
                    type={erro ? 'error' : 'success'}
                    message={erro || sucesso}
                    onClose={clearMessages}
                    autoClose={8000}
                />
            )}
        </div>
    );
}