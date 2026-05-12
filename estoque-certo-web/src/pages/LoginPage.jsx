import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';

export default function LoginPage({ onLogin, onNavigate }) {
    const [formData, setFormData] = useState({ username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const response = await fetch('http://localhost:5120/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.token);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h2>
                <form onSubmit={handleSubmit}>
                    {erro && <div className="alert alert-error">{erro}</div>}

                    <PhoneInput
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />

                    <PasswordInput
                        label="Senha"
                        placeholder="******"
                        value={formData.senha}
                        onChange={e => setFormData({ ...formData, senha: e.target.value })}
                    />

                    <UnidadeComboBox value={formData.unidadeOrganizacionalId} onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })} />

                    <button type="submit" className="button" style={{ width: '100%', marginTop: '1rem' }}>Entrar</button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.95rem' }}>
                        <a style={{ cursor: 'pointer', color: 'var(--zf-accent)' }} onClick={() => onNavigate('register')}>Registrar</a>
                        <a style={{ cursor: 'pointer', color: 'var(--zf-accent)' }} onClick={() => onNavigate('forgot')}>Esqueci a senha</a>
                    </div>
                </form>
            </div>
        </div>
    );
}