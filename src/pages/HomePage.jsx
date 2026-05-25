import React, { useState, useEffect } from 'react';
import { parseJwt } from '../utils/jwt';
import PasswordInput from '../components/PasswordInput';
import { extrairErro, extrairErrosCampos, extrairMensagem } from '../utils/apiUtils';
import EspacoView from '../components/EspacoView';
import ItemEstoqueView from '../components/ItemEstoqueView';
import ThemeToggle from '../components/ThemeToggle';
import ValidarUsuariosView from '../components/ValidarUsuariosView';
import MessageModal from '../components/MessageModal';

export default function HomePage({ token, onLogout }) {
    const [view, setView] = useState('home');
    const [usuarioId, setUsuarioId] = useState('');
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', confirmaSenha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const isIOS = () => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    };

    useEffect(() => {
        const decoded = parseJwt(token);
        if (decoded) {
            const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || '';
            const uname = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || '';
            const uoId = decoded.UnidadeOrganizacionalId || '';
            const nome = decoded.Nome || decoded.nome || '';
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || '';

            if (role === 'Admin') {
                setIsAdmin(true);
            }

            setUsuarioId(id);
            setFormData(prev => ({ ...prev, nome, username: uname, unidadeOrganizacionalId: uoId }));
        }
    }, [token]);

    const handleUpdateData = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = {
            nome: formData.nome
        };

        if (formData.senha || formData.confirmaSenha) {
            payload.senha = formData.senha;
            payload.confirmaSenha = formData.confirmaSenha;
        }

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setFormData(prev => ({ ...prev, senha: '', confirmaSenha: '' }));
            } else if (response.status === 400) {
                const { fieldErrors: mappedErrors, message } = await extrairErrosCampos(response);
                setFieldErrors(mappedErrors);
                if (Object.keys(mappedErrors).length === 0 && message) setErro(message);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelProfile = () => {
        setErro('');
        setSucesso('');
        setFieldErrors({});
        setFormData(prev => ({ ...prev, senha: '', confirmaSenha: '' }));
        setView('home');
    };

    return (
        <div className="app-shell">
            <input type="checkbox" id="menu-toggle" className="sidebar-checkbox" />

            <header className="app-header">
                <div className="app-header-left">
                    <label htmlFor="menu-toggle" className="button button-outline btn-mobile header-menu-button">
                        ☰<span className="texto-mobile button-icon-text">Menu</span>
                    </label>
                </div>

                <h3 className="app-brand">
                    Estoque Certo
                </h3>

                <div className="app-header-right">
                    <ThemeToggle fixo={false} />
                </div>
            </header>

            <div className="sidebar-overlay">
                <label htmlFor="menu-toggle" className="sidebar-backdrop-toggle"></label>
            </div>

            <aside className="sidebar">
                <div className="sidebar-body">
                    <h3 className="sidebar-title">Zênite Tecnologia</h3>
                    <p>Estoque Certo</p>
                    <div className="sidebar-nav">
                        <label htmlFor="menu-toggle" onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>Início</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('espacos')} className={view === 'espacos' ? 'active' : ''}>Espaços</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('itens-estoque')} className={view === 'itens-estoque' ? 'active' : ''}>Itens de Estoque</label>
                        <label htmlFor="menu-toggle" onClick={() => {
                            if (isIOS()) { setView('ios-install'); }
                            else {
                                //andriod install
                            }
                        }}
                            className={view === 'ios-install' ? 'active' : ''}
                        > Adicionar a tela inicial
                        </label>

                        {isAdmin && (
                            <label htmlFor="menu-toggle" onClick={() => setView('validar-usuarios')} className={view === 'validar-usuarios' ? 'active' : ''}>Aprovar Usuários</label>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <label
                        htmlFor="menu-toggle"
                        onClick={() => setView('profile')}
                        className={`link-action text-center d-block mb-1 ${view === 'profile' ? 'active' : ''}`}
                    >
                        Alterar Meus Dados
                    </label>

                    <label htmlFor="menu-toggle" className="button button-outline sidebar-close-button">
                        Fechar Menu
                    </label>
                    <button onClick={() => setShowLogoutModal(true)} className="button button-danger sidebar-logout-button">
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            <main className="container app-main">
                {view === 'home' && (
                    <div className="home-hero">
                        <img src="/logo-zenite.png" alt="Logo Zênite" className="home-logo" />
                        <h2 className="home-subtitle">Bem-vindo ao Estoque Certo.</h2>
                    </div>
                )}

                {view === 'espacos' && (
                    <EspacoView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} />
                )}

                {view === 'itens-estoque' && (
                    <ItemEstoqueView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} usuarioId={usuarioId} />
                )}

                {view === 'validar-usuarios' && isAdmin && (
                    <ValidarUsuariosView token={token} />
                )}

                {view === 'ios-install' && (
                    <div className="install-panel">
                        <h3 className="install-title">Instale o Estoque Certo</h3>

                        <p> <b>Role a tela e siga o tutorial</b> <br />
                            Para instalar o aplicativo, <br /> toque nos <b>...</b> </p>

                        <img
                            src="/pg1.jpeg"
                            alt="Tutorial de instalação 1"
                            className="install-step-image"
                        />

                        <p>e depois em <b>"Compartilhar"</b>.
                        </p>

                        <img
                            src="/pg2.jpeg"
                            alt="Tutorial de instalação 2"
                            className="install-step-image"
                        />

                        <p>Role a tela para baixo e clique em <b>"Adicionar a tela de início"</b> </p>

                        <img
                            src="/pg3.jpeg"
                            alt="Tutorial de instalação 3"
                            className="install-step-image"
                        />

                        <p>Depois clique em <b>"Adicionar"</b> </p>

                        <img
                            src="/pg4.jpeg"
                            alt="Tutorial de instalação 4"
                            className="install-step-image"
                        />

                        <p> assim o aplicativo será adicionado à sua tela de início.</p>

                        <img
                            src="/pg5.jpeg"
                            alt="Tutorial de instalação 5"
                            className="install-step-image"
                        />


                        <button
                            onClick={() => setView('home')}

                            className="button install-button">
                            Entendi
                        </button>
                    </div>
                )}

                {view === 'profile' && (
                    <div className="row profile-row">
                        <div className="column-6">
                            <div className="card profile-card">
                                <div className="modal-card-body">
                                    <h2 className="auth-title">Alterar Meus Dados</h2>

                                    <form onSubmit={handleUpdateData} noValidate>
                                        <div className="mb-1">
                                            <label className={`label-sm ${fieldErrors.Nome ? 'error' : ''}`}>
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nome}
                                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                                className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                            />
                                            {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                                        </div>

                                        <PasswordInput
                                            label="Nova Senha"
                                            placeholder="Senha"
                                            value={formData.senha}
                                            onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                            error={!!fieldErrors.Senha}
                                            errorMessage={fieldErrors.Senha}
                                        />

                                        <PasswordInput
                                            label="Confirmar Senha"
                                            placeholder="Confirme a senha"
                                            value={formData.confirmaSenha}
                                            onChange={e => setFormData({ ...formData, confirmaSenha: e.target.value })}
                                            error={!!fieldErrors.ConfirmaSenha}
                                            errorMessage={fieldErrors.ConfirmaSenha}
                                        />

                                        <div className="modal-actions profile-actions">
                                            <button type="button" className="button button-outline" onClick={handleCancelProfile}>Cancelar</button>
                                            <button type="submit" className="button">Salvar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="modal-card-body">
                            <h2 className="modal-title">Sair do Sistema</h2>
                            <p className="modal-description">Tem certeza que deseja encerrar a sua sessão?</p>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setShowLogoutModal(false)}>Cancelar</button>
                                <button type="button" className="button button-danger button-flex" onClick={onLogout}>Sair</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(erro || sucesso) && (
                <MessageModal
                    type={erro ? 'error' : 'success'}
                    message={erro || sucesso}
                    onClose={() => { setErro(''); setSucesso(''); }}
                    autoClose={8000}
                />
            )}
        </div>
    );
}