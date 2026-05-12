import React, { useState } from 'react';
import UnidadeComboBox from '../components/UnidadeComboBox';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { extrairErro } from '../utils/apiUtils';

export default function RegisterPage({ onNavigate }) {
    const [formData, setFormData] = useState({ nome: '', username: '', senha: '', unidadeOrganizacionalId: '' });
    const [erro, setErro] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const response = await fetch('https://estoque-certo.onrender.com/v1/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                setShowSuccessModal(true);
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
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Criar Conta</h2>
                <form onSubmit={handleRegister}>
                    {erro && <div className="alert alert-error">{erro}</div>}

                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal' }}>Nome Completo</label>
                    <input type="text" onChange={e => setFormData({ ...formData, nome: e.target.value })} required />

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

                    <div className="button-group" style={{ flexDirection: 'column', width: '100%', marginTop: '1rem' }}>
                        <button type="submit" className="button" style={{ width: '100%' }}>Criar Conta</button>
                        <button type="button" className="button button-outline" style={{ width: '100%' }} onClick={() => onNavigate('login')}>Voltar</button>
                    </div>
                </form>
            </div>

            {showSuccessModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="card" style={{
                        width: '90%',
                        maxWidth: '400px',
                        height: 'fit-content',
                        margin: 'auto',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Cadastro Realizado!</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>
                            Sua conta foi criada com sucesso. Aguarde a aprovação do Administrador para acessar o sistema.
                        </p>

                        <button
                            type="button"
                            className="button"
                            style={{ width: '100%' }}
                            onClick={() => onNavigate('login')}
                        >
                            Voltar para o Login
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}