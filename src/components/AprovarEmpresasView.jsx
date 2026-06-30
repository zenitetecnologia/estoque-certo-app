import { useCallback, useEffect, useState } from 'react';
import { getBaseUrl } from '../utils/apiConfig';
import { extrairErro, extrairMensagem } from '../utils/apiUtils';
import { formatCnpj } from '../utils/cnpj';
import { encryptedJsonBody } from '../utils/payloadCrypto';
import { formatPhone } from '../utils/phone';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';
import ZeniteIcon from './ZeniteIcon';

const getUnidadeId = (unidade) => unidade?.unidadeOrganizacionalId || unidade?.id;
const getNomeEmpresa = (unidade) => unidade?.razaoSocial || unidade?.nomeFantasia || unidade?.nome || 'Empresa sem nome';
const isValorVerdadeiro = (valor) => valor === true || valor === 1 || String(valor).toLowerCase() === 'true';
const isUnidadeAprovada = (unidade) => [
    unidade?.aprovado,
    unidade?.Aprovado,
    unidade?.aprovada,
    unidade?.Aprovada,
    unidade?.validado,
    unidade?.Validado,
    unidade?.validada,
    unidade?.Validada
].some(isValorVerdadeiro);

export default function AprovarUnidadeOrganizacionalView({ token }) {
    const [unidadesOrganizacionais, setUnidadesOrganizacionais] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [unidadeOrganizacionalParaAprovar, setUnidadeOrganizacionalParaAprovar] = useState(null);

    const carregarUnidadesOrganizacionaisPendentes = useCallback(async () => {
        setErro('');
        setLoading(true);
        try {
            const response = await fetch(`${getBaseUrl()}/v1/unidades-organizacionais?aprovado=false&top=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const unidades = await response.json();
                setUnidadesOrganizacionais(unidades.filter(unidade => !isUnidadeAprovada(unidade)));
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        carregarUnidadesOrganizacionaisPendentes();
    }, [carregarUnidadesOrganizacionaisPendentes]);

    const handleAprovar = async () => {
        const unidadeOrganizacionalId = getUnidadeId(unidadeOrganizacionalParaAprovar);
        if (!unidadeOrganizacionalId) return;

        setErro('');
        setSucesso('');
        try {
            const response = await fetch(`${getBaseUrl()}/v1/unidades-organizacionais/${unidadeOrganizacionalId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: await encryptedJsonBody({ unidadeOrganizacionalId })
            });
            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setUnidadesOrganizacionais(prev => prev.filter(u => getUnidadeId(u) !== unidadeOrganizacionalId));
                setUnidadeOrganizacionalParaAprovar(null);
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            console.error(error);
            setErro(error.message);
        }
    };

    const renderEmptyState = () => (
        <div className="empty-state-plain validation-empty-state">
            <div className="empty-state-icon">
                <ZeniteIcon name="ban" size={92} strokeWidth={1.7} />
            </div>
            <p className="empty-state-text">
                {unidadesOrganizacionais.length === 0 ? 'Nenhuma empresa pendente de aprovação.' : 'Nenhum resultado encontrado para a pesquisa.'}
            </p>
        </div>
    );

    const unidadesOrganizacionaisFiltradas = unidadesOrganizacionais.filter(unidade => {
        if (isUnidadeAprovada(unidade)) return false;

        const termo = pesquisa.trim().toLowerCase();
        if (!termo) return true;

        const cnpj = unidade.cnpj || '';
        const telefone = unidade.telefone || '';

        return (
            getNomeEmpresa(unidade).toLowerCase().includes(termo) ||
            unidade.nomeFantasia?.toLowerCase().includes(termo) ||
            unidade.email?.toLowerCase().includes(termo) ||
            cnpj.toLowerCase().includes(termo) ||
            formatCnpj(cnpj).toLowerCase().includes(termo) ||
            telefone.toLowerCase().includes(termo) ||
            formatPhone(telefone).toLowerCase().includes(termo)
        );
    });

    return (
        <div className="w-full inventory-list-fixed validation-user-view">
            <div className="inventory-list-fixed-header">
                <div className="inventory-list-header">
                    <h2 className="page-title no-margin">Empresas Pendentes</h2>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar ..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="inventory-list-scroll validation-user-scroll">
                {loading ? (
                    <LoadingWaves variant="cards" rows={4} label="Carregando empresas pendentes" className="validation-loading-grid" />
                ) : unidadesOrganizacionaisFiltradas.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <div className="row validation-user-grid">
                        {unidadesOrganizacionaisFiltradas.map(unidade => (
                            <div key={getUnidadeId(unidade)} className="column-4 mb-1">
                                <div className="card validation-user-card">
                                    <h3 className="validation-user-title">{getNomeEmpresa(unidade)}</h3>

                                    <p className="validation-user-meta">
                                        <strong>CNPJ:</strong> {formatCnpj(unidade.cnpj) || 'Sem CNPJ'}
                                    </p>

                                    <p className="validation-user-description">
                                        <strong>Telefone:</strong> {formatPhone(unidade.telefone) || 'Sem telefone'}
                                    </p>

                                    {unidade.email && (
                                        <p className="validation-user-description">
                                            <strong>Email:</strong> {unidade.email}
                                        </p>
                                    )}

                                    <button className="button button-full" onClick={() => setUnidadeOrganizacionalParaAprovar(unidade)}>
                                        Aprovar Empresa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {unidadeOrganizacionalParaAprovar && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="modal-card-body">
                            <h2 className="modal-title">Aprovar Empresa</h2>
                            <p className="modal-description">
                                Deseja aprovar a empresa {getNomeEmpresa(unidadeOrganizacionalParaAprovar)}?
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setUnidadeOrganizacionalParaAprovar(null)}>
                                    Cancelar
                                </button>
                                <button type="button" className="button button-flex" onClick={handleAprovar}>
                                    Confirmar
                                </button>
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