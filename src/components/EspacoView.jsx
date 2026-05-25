import React, { useState, useEffect, useCallback } from 'react';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { getBaseUrl } from '../utils/apiConfig';
import { formatQuantity, formatQuantityInput, maskQuantityInput, parseQuantity } from '../utils/quantity';
import { TIPO_UNIDADE } from '../constants/tipoUnidade';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';

export default function EspacoView({ token, unidadeOrganizacionalId }) {

    const [viewMode, setViewMode] = useState('list');
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [pesquisa, setPesquisa] = useState('');

    const [showModalNovo, setShowModalNovo] = useState(false);
    const [formDataNovo, setFormDataNovo] = useState({ nome: '', descricao: '' });

    const [espacoSelecionado, setEspacoSelecionado] = useState(null);
    const [formEdicao, setFormEdicao] = useState({ nome: '', descricao: '' });
    const [itensDoEspaco, setItensDoEspaco] = useState([]);
    const [quantidadesEditadas, setQuantidadesEditadas] = useState({});
    const [salvandoItemId, setSalvandoItemId] = useState(null);
    const [loadingItens, setLoadingItens] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // GET com os parâmetros filtro, skip e top
    const carregarEspacos = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const response = await fetch(`${getBaseUrl()}/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&skip=0&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEspacos(data);
            } else {
                const mensagem = await extrairErro(response);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId]);

    useEffect(() => {
        carregarEspacos();
    }, [carregarEspacos]);

    useEffect(() => {
        if (!erro && !sucesso) return;

        const timer = setTimeout(() => {
            setErro('');
            setSucesso('');
        }, 8000);
        return () => clearTimeout(timer);
    }, [erro, sucesso]);

    const handleCriarEspaco = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            nome: formDataNovo.nome,
            descricao: formDataNovo.descricao
        };

        try {
            const response = await fetch(`${getBaseUrl()}/v1/espacos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setShowModalNovo(false);
                if (mensagem) setSucesso(mensagem);
                carregarEspacos();
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

    const abrirDetalhes = async (espaco) => {
        setEspacoSelecionado(espaco);
        setFormEdicao({ nome: espaco.nome, descricao: espaco.descricao || '' });
        setViewMode('detail');
        setErro(''); setSucesso(''); setFieldErrors({});

        setLoadingItens(true);
        try {
            const res = await fetch(`${getBaseUrl()}/v1/itens-estoque?espacoId=${espaco.espacoId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const itens = await res.json();
                setItensDoEspaco(itens);
                setQuantidadesEditadas(Object.fromEntries(
                    itens.map(item => [item.itemEstoqueId, formatQuantityInput(item.quantidade)])
                ));
            } else {
                const mensagem = await extrairErro(res);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingItens(false);
        }
    };

    const voltarParaLista = () => {
        setViewMode('list');
        setEspacoSelecionado(null);
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarEspacos();
    };

    const houveMudanca = espacoSelecionado && (
        espacoSelecionado.nome !== formEdicao.nome ||
        (espacoSelecionado.descricao || '') !== formEdicao.descricao
    );

    const handleConfirmarEdicao = async () => {
        setErro(''); setSucesso(''); setFieldErrors({});
        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            nome: formEdicao.nome,
            descricao: formEdicao.descricao
        };

        try {
            const response = await fetch(`${getBaseUrl()}/v1/espacos/${espacoSelecionado.espacoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setEspacoSelecionado({ ...espacoSelecionado, nome: formEdicao.nome, descricao: formEdicao.descricao });
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

    const handleExcluirEspaco = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`${getBaseUrl()}/v1/espacos/${espacoSelecionado.espacoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok || response.status === 204) {
                const mensagem = await extrairMensagem(response);
                setShowDeleteModal(false);
                voltarParaLista();
                if (mensagem) setTimeout(() => setSucesso(mensagem), 100);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error(error);
            setShowDeleteModal(false);
        }
    };

    const handleQuantidadeItemChange = (itemId, value) => {
        setQuantidadesEditadas(prev => ({
            ...prev,
            [itemId]: maskQuantityInput(value)
        }));
    };

    const handleSalvarQuantidadeItem = async (item) => {
        setErro('');
        setSucesso('');
        setSalvandoItemId(item.itemEstoqueId);

        const novaQuantidade = parseQuantity(quantidadesEditadas[item.itemEstoqueId]);
        const payload = {
            unidadeOrganizacionalId,
            espacoId: item.espacoId || espacoSelecionado.espacoId,
            descricao: item.descricao,
            tipoUnidadeMedida: parseInt(item.tipoUnidadeMedida),
            quantidade: novaQuantidade
        };

        try {
            const response = await fetch(`${getBaseUrl()}/v1/itens-estoque/${item.itemEstoqueId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setItensDoEspaco(prev => prev.map(atual =>
                    atual.itemEstoqueId === item.itemEstoqueId
                        ? { ...atual, quantidade: novaQuantidade }
                        : atual
                ));
                setQuantidadesEditadas(prev => ({
                    ...prev,
                    [item.itemEstoqueId]: formatQuantityInput(novaQuantidade)
                }));
                if (mensagem) setSucesso(mensagem);
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const mensagem = await extrairErro(response);
                setErro(mensagem);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSalvandoItemId(null);
        }
    };

    const espacosFiltrados = espacos.filter(espaco =>
        espaco.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
        espaco.descricao?.toLowerCase().includes(pesquisa.toLowerCase())
    );

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    if (viewMode === 'list') {
        return (
            <div className="w-full">
                <div className="inventory-list-header">
                    <h2 className="no-margin">Gestão de Espaços</h2>
                    <button className="button inventory-list-header-action no-margin" onClick={() => { setFormDataNovo({ nome: '', descricao: '' }); setShowModalNovo(true); setFieldErrors({}); setErro(''); }}>
                        + Novo espaço
                    </button>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar espaços por nome ou descrição..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="w-full no-field-margin"
                    />
                </div>

                {loading ? (
                    <LoadingWaves rows={3} label="Carregando espaços" />
                ) : espacosFiltrados.length === 0 ? (
                    <div className="card empty-state-card">
                        <div className="empty-state-body">
                            <p className="empty-state-text">
                                {espacos.length === 0 ? 'Nenhum espaço cadastrado nesta unidade.' : 'Nenhum espaço encontrado para a pesquisa.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="inventory-grid">
                        {espacosFiltrados.map(espaco => (
                            <div key={espaco.espacoId} className="inventory-grid-item">
                                <div className="card inventory-card inventory-list-card inventory-card-surface">
                                    <div className="inventory-card-header">
                                        <h3 className="inventory-card-title">{espaco.nome}</h3>
                                        <p className="inventory-card-description">
                                            {espaco.descricao || 'Sem descrição'}
                                        </p>
                                    </div>
                                    <div className="inventory-card-footer">
                                        <button className="button button-outline inventory-card-action" onClick={() => abrirDetalhes(espaco)}>
                                            Visualizar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModalNovo && (
                    <div className="modal-overlay">
                        <div className="card modal-card-wide">
                            <div className="modal-card-body">
                                <h2 className="form-modal-title">Novo Espaço</h2>
                                <form onSubmit={handleCriarEspaco} noValidate>
                                    <div className="mb-1">
                                        <label className={`label-sm ${fieldErrors.Nome ? 'error' : ''}`}>Nome do Espaço (Obrigatório)</label>
                                        <input
                                            type="text"
                                            value={formDataNovo.nome}
                                            onChange={e => setFormDataNovo({ ...formDataNovo, nome: e.target.value })}
                                            className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                                        />
                                        {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                                    </div>
                                    <div className="mb-2">
                                        <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formDataNovo.descricao}
                                            onChange={e => setFormDataNovo({ ...formDataNovo, descricao: e.target.value })}
                                            className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                                        />
                                        {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="button button-outline button-flex" onClick={() => setShowModalNovo(false)}>Cancelar</button>
                                        <button type="submit" className="button button-flex">Salvar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {messageModal}
            </div>
        );
    }

    return (
        <div className="detail-view w-full">
            <div className="detail-heading">
                <h2 className="no-margin">Detalhes do Espaço</h2>
            </div>

            <div className="card detail-card">
                <div className="detail-card-body">
                    <div className="row">
                        <div className="column-6 mb-1">
                            <label className={`label-sm ${fieldErrors.Nome ? 'error' : ''}`}>Nome do Espaço</label>
                            <input
                                type="text"
                                value={formEdicao.nome}
                                onChange={e => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                        </div>
                        <div className="column-6 mb-1">
                            <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição</label>
                            <input
                                type="text"
                                value={formEdicao.descricao}
                                onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="section-title">Itens neste espaço</h3>
            {loadingItens ? (
                <LoadingWaves variant="cards" rows={3} label="Carregando inventário" />
            ) : itensDoEspaco.length === 0 ? (
                <div className="card detail-card">
                    <div className="empty-state-body-compact">
                        <p className="empty-state-text">Este espaço está vazio.</p>
                    </div>
                </div>
            ) : (
                <div className="inventory-grid inventory-grid-compact mb-2">
                    {itensDoEspaco.map(item => (
                        <div key={item.itemEstoqueId} className="inventory-grid-item">
                            <div className="card inventory-card space-item-card">
                                <div className="space-item-card-body">
                                    <div className="space-item-card-header">
                                        <div>
                                            <h4 className="space-item-title">{item.descricao}</h4>
                                            <small className="space-item-unit">{TIPO_UNIDADE[item.tipoUnidadeMedida] || 'UN'}</small>
                                        </div>
                                        <div className="space-item-quantity-badge">
                                            {formatQuantity(item.quantidade)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-sm">Quantidade</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={quantidadesEditadas[item.itemEstoqueId] ?? ''}
                                            onChange={e => handleQuantidadeItemChange(item.itemEstoqueId, e.target.value)}
                                            className="w-full no-field-margin"
                                        />
                                    </div>
                                    <button
                                        className="button button-outline button-full"

                                        onClick={() => handleSalvarQuantidadeItem(item)}
                                        disabled={salvandoItemId === item.itemEstoqueId || parseQuantity(quantidadesEditadas[item.itemEstoqueId]) === parseQuantity(item.quantidade)}
                                    >
                                        {salvandoItemId === item.itemEstoqueId ? 'Salvando...' : 'Atualizar quantidade'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="detail-action-bar">
                <button className="button button-outline" onClick={voltarParaLista}>
                    Voltar
                </button>
                <button
                    className={`button ${!houveMudanca ? '' : ''}`}
                    onClick={handleConfirmarEdicao}
                    disabled={!houveMudanca}
                >
                    Editar
                </button>
                <button
                    className="button button-danger"
                    onClick={() => setShowDeleteModal(true)}>
                    Excluir
                </button>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="modal-card-body">
                            <h2 className="modal-title">Excluir Espaço</h2>
                            <p className="modal-description">
                                Tem certeza que deseja excluir este espaço?
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button type="button" className="button button-danger button-flex" onClick={handleExcluirEspaco}>Excluir Definitivo</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/*modal de mensagens (erro e sucesso)*/}
            {messageModal}
        </div>
    );
}