import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';

export default function ForgotPasswordPage({ onNavigate }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ username: '', unidadeOrganizacionalId: '', code: '', senha: '', confirmaSenha: '', codigoAcessoId: '' });
    const [erro, setErro] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleForgot = async (e) => {
        e.preventDefault();
        setErro('');
        try {
            const res = await fetch('https://estoque-certo.onrender.com/v1/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: data.username, unidadeOrganizacionalId: data.unidadeOrganizacionalId })
            });
            if (res.ok) {
                setStep(2);
            } else {
                const mensagem = await extrairErro(res);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com a API.');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setErro('');
        try {
            const res = await fetch('https://estoque-certo.onrender.com/v1/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: data.code })
            });
            if (res.ok) {
                const result = await res.json();
                setData({ ...data, codigoAcessoId: result.codigoAcessoId });
                setStep(3);
            } else {
                const mensagem = await extrairErro(res);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro ao verificar código.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setErro('');
        if (data.senha !== data.confirmaSenha) {
            setErro('As senhas não coincidem.');
            return;
        }
        try {
            const res = await fetch('https://estoque-certo.onrender.com/v1/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoAcessoId: data.codigoAcessoId, senha: data.senha })
            });
            if (res.ok) {
                setShowSuccessModal(true);
            } else {
                const mensagem = await extrairErro(res);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com a API.');
        }
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, padding: '1.5rem', boxSizing: 'border-box'
    };

    const modalCardStyle = {
        width: '100%', maxWidth: '400px', height: 'fit-content',
        backgroundColor: '#0f172a',
        borderRadius: '12px', border: '1px solid #1e293b',
        padding: '2rem', boxSizing: 'border-box', color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center', margin: 'auto'
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Recuperar Acesso</h2>
                {erro && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{erro}</div>}

                {step === 1 && (
                    <form onSubmit={handleForgot}>
                        <PhoneInput
                            value={data.username}
                            onChange={e => setData({ ...data, username: e.target.value })}
                        />
                        <UnidadeComboBox value={data.unidadeOrganizacionalId} onChange={val => setData({ ...data, unidadeOrganizacionalId: val })} />

                        <div className="button-group" style={{ flexDirection: 'column', width: '100%', gap: '0.5rem' }}>
                            <button type="submit" className="button" style={{ width: '100%' }}>Enviar Código</button>
                            <button type="button" className="button button-outline" style={{ width: '100%' }} onClick={() => onNavigate('login')}>Cancelar</button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerify}>
                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal' }}>Código de 6 dígitos</label>
                        <input type="text" onChange={e => setData({ ...data, code: e.target.value })} required />

                        <div className="button-group" style={{ flexDirection: 'column', width: '100%', gap: '0.5rem' }}>
                            <button type="submit" className="button" style={{ width: '100%' }}>Verificar Código</button>
                            <button type="button" className="button button-outline" style={{ width: '100%' }} onClick={() => setStep(1)}>Voltar</button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleReset}>
                        <PasswordInput
                            label="Nova Senha"
                            placeholder="******"
                            value={data.senha}
                            onChange={e => setData({ ...data, senha: e.target.value })}
                        />

                        <PasswordInput
                            label="Confirmar Nova Senha"
                            placeholder="******"
                            value={data.confirmaSenha}
                            onChange={e => setData({ ...data, confirmaSenha: e.target.value })}
                        />

                        <div className="button-group" style={{ flexDirection: 'column', width: '100%', gap: '0.5rem' }}>
                            <button type="submit" className="button" style={{ width: '100%' }}>Redefinir Senha</button>
                            <button type="button" className="button button-outline" style={{ width: '100%' }} onClick={() => setStep(1)}>Voltar</button>
                        </div>
                    </form>
                )}
            </div>

            {showSuccessModal && (
                <div style={overlayStyle}>
                    <div style={modalCardStyle}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff' }}>Sucesso!</h2>
                        <p style={{ marginBottom: '2rem', color: '#cbd5e1' }}>A sua senha foi redefinida com sucesso.</p>

                        <button
                            type="button"
                            className="button"
                            style={{ width: '100%' }}
                            onClick={() => onNavigate('login')}
                        >
                            Ir para o Login
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}