import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';

export default function ForgotPasswordPage({ onNavigate }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ username: '', unidadeOrganizacionalId: '', code: '', senha: '', confirmaSenha: '', codigoAcessoId: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const parseBackendErrors = async (res) => {
        const errorData = await res.json();
        const mappedErrors = {};
        if (Array.isArray(errorData)) {
            errorData.forEach(err => {
                const fieldName = err.field || err.Field;
                if (fieldName) mappedErrors[fieldName] = err.error || err.Error;
            });
        } else if (errorData.errors) {
            Object.keys(errorData.errors).forEach(key => {
                const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                mappedErrors[fieldName] = errorData.errors[key][0];
            });
        }
        setFieldErrors(mappedErrors);
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});
        try {
            const res = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    unidadeOrganizacionalId: data.unidadeOrganizacionalId === '' ? null : data.unidadeOrganizacionalId
                })
            });
            if (res.ok) setStep(2);
            else if (res.status === 400) await parseBackendErrors(res);
            else setErro(await extrairErro(res));
        } catch (error) { setErro('Erro de conexão.'); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});
        if (data.senha !== data.confirmaSenha) {
            setFieldErrors({ ConfirmaSenha: 'As senhas não coincidem.' });
            return;
        }
        try {
            const res = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoAcessoId: data.codigoAcessoId, senha: data.senha })
            });
            if (res.ok) setShowSuccessModal(true);
            else if (res.status === 400) await parseBackendErrors(res);
            else setErro(await extrairErro(res));
        } catch (error) { setErro('Erro de conexão.'); }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Recuperar Acesso</h2>
                {erro && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{erro}</div>}

                {step === 1 && (
                    <form onSubmit={handleForgot} noValidate>
                        <PhoneInput
                            value={data.username}
                            onChange={e => setData({ ...data, username: e.target.value })}
                            error={!!fieldErrors.Username}
                            errorMessage={fieldErrors.Username}
                        />
                        <UnidadeComboBox
                            value={data.unidadeOrganizacionalId}
                            onChange={val => setData({ ...data, unidadeOrganizacionalId: val })}
                            error={!!fieldErrors.UnidadeOrganizacionalId}
                            errorMessage={fieldErrors.UnidadeOrganizacionalId}
                        />
                        <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Enviar Código</button>
                        <button type="button" className="button button-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => onNavigate('login')}>Cancelar</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} noValidate>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Código Enviado</label>
                            <input type="text" value={data.code} onChange={e => setData({ ...data, code: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <button type="submit" className="button" style={{ width: '100%' }}>Verificar</button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleReset} noValidate>
                        <PasswordInput
                            label="Nova Senha"
                            value={data.senha}
                            onChange={e => setData({ ...data, senha: e.target.value })}
                            error={!!fieldErrors.Senha}
                            errorMessage={fieldErrors.Senha}
                        />
                        <PasswordInput
                            label="Confirmar Nova Senha"
                            value={data.confirmaSenha}
                            onChange={e => setData({ ...data, confirmaSenha: e.target.value })}
                            error={!!fieldErrors.ConfirmaSenha}
                            errorMessage={fieldErrors.ConfirmaSenha}
                        />
                        <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Redefinir Senha</button>
                    </form>
                )}
            </div>
        </div>
    );
}