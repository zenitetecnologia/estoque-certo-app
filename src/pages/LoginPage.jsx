import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import ThemeToggle from '../components/ThemeToggle';
import MessageModal from '../components/MessageModal';

export default function LoginPage({ onLogin, onNavigate }) {
    const [formData, setFormData] = useState({ username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setFieldErrors({});

        const payload = {
            ...formData,
            unidadeOrganizacionalId: formData.unidadeOrganizacionalId === '' ? null : formData.unidadeOrganizacionalId
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.token);
            } else if (response.status === 400) {
                const errorData = await response.json();
                const mappedErrors = {};

                if (Array.isArray(errorData)) {
                    errorData.forEach(err => {
                        const fieldName = err.field || err.Field;
                        const errorMessage = err.error || err.Error;
                        if (fieldName) {
                            mappedErrors[fieldName] = errorMessage;
                        }
                    });
                }
                else if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                        mappedErrors[fieldName] = errorData.errors[key][0];
                    });
                } else {
                    setErro("Verifique os campos obrigatórios.");
                }

                setFieldErrors(mappedErrors);
            } else if (response.status === 403) {
                onNavigate('pending');
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    return (
        <>
            <ThemeToggle />
            <div className="auth-page">
                <div className="card auth-card">
                    <h2 className="auth-title">Login</h2>
                    <form onSubmit={handleSubmit} noValidate>

                        <PhoneInput
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            error={!!fieldErrors.Username}
                            errorMessage={fieldErrors.Username}
                        />

                        <PasswordInput
                            label="Senha"
                            placeholder="******"
                            value={formData.senha}
                            onChange={e => setFormData({ ...formData, senha: e.target.value })}
                            error={!!fieldErrors.Senha}
                            errorMessage={fieldErrors.Senha}
                        />

                        <UnidadeComboBox
                            value={formData.unidadeOrganizacionalId}
                            onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })}
                            error={!!fieldErrors.UnidadeOrganizacionalId}
                            errorMessage={fieldErrors.UnidadeOrganizacionalId}
                        />

                        <button type="submit" className="button button-full mt-1">Entrar</button>

                        <div className="auth-link-row">
                            <a className="link-action" onClick={() => onNavigate('register')}>Registrar</a>
                            <a className="link-action" onClick={() => onNavigate('forgot')}>Esqueci a senha</a>
                        </div>
                    </form>
                </div>
            </div>

            {erro && (
                <MessageModal
                    type="error"
                    message={erro}
                    onClose={() => setErro('')}
                    autoClose={8000}
                />
            )}
        </>
    );
}