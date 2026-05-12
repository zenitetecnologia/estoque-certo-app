import React, { useState, useEffect } from 'react';
import { parseJwt } from '../utils/jwt';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import EspacoView from '../components/EspacoView';
import ItemEstoqueView from '../components/ItemEstoqueView';

export default function HomePage({ token, onLogout }) {
    const [view, setView] = useState('home');
    const [usuarioId, setUsuarioId] = useState('');
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const decoded = parseJwt(token);
        if (decoded) {
            const id = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || '';
            const uname = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || '';
            const uoId = decoded.UnidadeOrganizacionalId || '';

            setUsuarioId(id);
            setFormData(prev => ({ ...prev, username: uname, unidadeOrganizacionalId: uoId }));
        }
    }, [token]);

    const handleUpdateData = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        try {
            const response = await fetch(`http://localhost:5120/v1/usuarios/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSucesso('Dados atualizados com sucesso!');
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de comunicação com o servidor.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, width: '100%' }}>
            <input type="checkbox" id="menu-toggle" className="sidebar-checkbox" />

            <header style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center' }}>
                <label htmlFor="menu-toggle" className="button button-outline" style={{ margin: 0, cursor: 'pointer', padding: '0.5rem 1.5rem' }}>
                    ☰ Menu
                </label>
                <h3 style={{ margin: '0 0 0 1.5rem', color: 'var(--zf-accent)' }}>Estoque Certo</h3>
            </header>

            <div className="sidebar-overlay">
                <label htmlFor="menu-toggle" style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}></label>
            </div>

            <aside className="sidebar" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', left: 0, margin: 0 }}>
                <div style={{ padding: '4rem 1.5rem 2rem 1.5rem', flexGrow: 1 }}>
                    <h3 style={{ color: 'var(--zf-accent)', marginTop: 0 }}>Zênite Painel</h3>
                    <p>Menu de navegação</p>
                    <div className="sidebar-nav">
                        <label htmlFor="menu-toggle" onClick={() => setView('home')} className={view === 'home' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Início</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('espacos')} className={view === 'espacos' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Espaços</label>
                        <label htmlFor="menu-toggle" onClick={() => setView('itens-estoque')} className={view === 'itens-estoque' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block', marginBottom: '0.5rem' }}>Itens de Estoque</label>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <div className="sidebar-nav" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="menu-toggle" onClick={() => setView('profile')} className={view === 'profile' ? 'active' : ''} style={{ cursor: 'pointer', display: 'block' }}>Alterar Meus Dados</label>
                    </div>

                    <label htmlFor="menu-toggle" className="button button-outline" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}>
                        Fechar Menu
                    </label>
                    <button onClick={() => setShowLogoutModal(true)} className="button" style={{ width: '100%', backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}>
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            <main className="container" style={{ padding: '3rem 2rem', flexGrow: 1 }}>
                {view === 'home' && (
                    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                        <h1 style={{ fontSize: '3rem' }}>Homepage Zenite</h1>
                        <p>Bem-vindo ao sistema de gestão Estoque Certo. Selecione uma opção no menu lateral.</p>
                    </div>
                )}

                {view === 'espacos' && (
                    <EspacoView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} />
                )}

                {view === 'itens-estoque' && (
                    <ItemEstoqueView token={token} unidadeOrganizacionalId={formData.unidadeOrganizacionalId} usuarioId={usuarioId} />
                )}

                {view === 'profile' && (
                    <div className="zf-row" style={{ justifyContent: 'center' }}>
                        <div className="zf-col-xs-12 zf-col-md-8 zf-col-lg-6 zf-col-xl-5">
                            <div className="card" style={{ width: '100%' }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Alterar Meus Dados</h2>

                                {erro && <div className="alert alert-error">{erro}</div>}
                                {sucesso && <div className="alert alert-success">{sucesso}</div>}

                                <form onSubmit={handleUpdateData}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal' }}>Nome</label>
                                    <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />

                                    <PhoneInput
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />

                                    <PasswordInput
                                        label="Nova Senha"
                                        placeholder="Senha"
                                        value={formData.senha}
                                        onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                    />

                                    <UnidadeComboBox value={formData.unidadeOrganizacionalId} onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })} />

                                    <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Salvar Alterações</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showLogoutModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', height: 'fit-content', margin: 'auto', textAlign: 'center' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Sair do Sistema</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>Tem certeza que deseja encerrar a sua sessão?</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowLogoutModal(false)}>Cancelar</button>
                            <button type="button" className="button" style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }} onClick={onLogout}>Sair</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}