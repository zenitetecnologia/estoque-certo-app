import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../../components/MessageModal';
import { criarEspaco } from '../../services/espacoService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../../utils/apiUtils';
import { criarPayloadEspaco } from '../../utils/espacoViewModel';

export default function NovoEspacoPage({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nome: '', descricao: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [erro, setErro] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErro('');
        setFieldErrors({});

        const payload = criarPayloadEspaco({ unidadeOrganizacionalId, formData });

        try {
            const response = await criarEspaco({ token, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                navigate('/espacos', { replace: true, state: { sucesso: mensagem } });
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="row profile-row">
            <div className="column-6">
                <div className="card profile-card">
                    <div className="modal-card-body">
                        <h2 className="auth-title">Novo Espaço</h2>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-1">
                                <label className="label-sm">Nome do Espaço (Obrigatório)</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                            </div>

                            <div className="mb-2">
                                <label className="label-sm">Descrição (Opcional)</label>
                                <input
                                    type="text"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                                />
                                {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                            </div>

                            <div className="modal-actions profile-actions">
                                <button type="button" className="button button-outline" onClick={() => navigate('/espacos')}>
                                    Cancelar
                                </button>
                                <button type="submit" className="button">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
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
        </div>
    );
}