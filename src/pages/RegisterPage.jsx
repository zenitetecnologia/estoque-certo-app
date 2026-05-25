import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';
import ThemeToggle from '../components/ThemeToggle';
import MessageModal from '../components/MessageModal';

export default function RegisterPage({ onNavigate }) {
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setFieldErrors({});

        const payload = {
            ...formData,
            unidadeOrganizacionalId: formData.unidadeOrganizacionalId === '' ? null : formData.unidadeOrganizacionalId
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Conta criada com sucesso! Redirecionando...');
                setTimeout(() => onNavigate('login'), 2000);
            } else if (response.status === 400) {
                const errorData = await response.json();
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
            <div className="container">
                <div className="auth-page">
                    <div className="card auth-card">
                        <h2 className="auth-title">Criar Conta</h2>
                        <form onSubmit={handleSubmit} noValidate>

                            <div className="mb-1">
                                <label>
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className={`w-full no-field-margin ${(fieldErrors.Nome || fieldErrors.nome) ? 'is-invalid' : ''}`}
                                />
                                {(fieldErrors.Nome || fieldErrors.nome) && <small className="invalid-feedback d-block">{fieldErrors.Nome || fieldErrors.nome}</small>}
                            </div>

                            <PhoneInput
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                error={!!(fieldErrors.Username || fieldErrors.username)}
                                errorMessage={fieldErrors.Username || fieldErrors.username}
                            />

                            <PasswordInput
                                label="Senha"
                                value={formData.senha}
                                onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                error={!!(fieldErrors.Senha || fieldErrors.senha)}
                                errorMessage={fieldErrors.Senha || fieldErrors.senha}
                            />

                            <UnidadeComboBox
                                value={formData.unidadeOrganizacionalId}
                                onChange={val => setFormData({ ...formData, unidadeOrganizacionalId: val })}
                                error={!!(fieldErrors.UnidadeOrganizacionalId || fieldErrors.unidadeOrganizacionalId)}
                                errorMessage={fieldErrors.UnidadeOrganizacionalId || fieldErrors.unidadeOrganizacionalId}
                            />

                            <button type="submit" className="button button-full mt-1">Cadastrar</button>
                            <div className="auth-link-row-centered">
                                <a className="link-action" onClick={() => onNavigate('login')}>Já tenho uma conta</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {(erro || sucesso) && (
                <MessageModal
                    type={erro ? 'error' : 'success'}
                    message={erro || sucesso}
                    onClose={() => { setErro(''); setSucesso(''); }}
                    autoClose={8000}
                />
            )}
        </>
    );
}