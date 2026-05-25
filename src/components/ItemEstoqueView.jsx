import React, { useState, useEffect, useCallback } from 'react';
import { extrairErro } from '../utils/apiUtils';
import { formatQuantity, formatQuantityInput, maskQuantityInput, parseQuantity } from '../utils/quantity';
import LoadingWaves from './LoadingWaves';
import MessageModal from './MessageModal';

const TIPO_UNIDADE = {
    1: 'Quilos (KG)',
    2: 'Gramas (G)',
    3: 'Miligramas (MG)',
    4: 'Litros (L)',
    5: 'Mililitros (ML)',
    6: 'Unidades (UN)'
};

export default function ItemEstoqueView({ token, unidadeOrganizacionalId, usuarioId }) {
    const [viewMode, setViewMode] = useState('list');
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [pesquisa, setPesquisa] = useState('');

    //modais
    const [showModalNovo, setShowModalNovo] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);
    const [showTransferirModal, setShowTransferirModal] = useState(false);
    const [novoEspacoId, setNovoEspacoId] = useState('');

    const [itemAtivo, setItemAtivo] = useState(null);
    const [formDataNovo, setFormDataNovo] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' });
    const [formEdicao, setFormEdicao] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const getDataCadastro = (item) => (
        item.dataCadastro ||
        item.dataCriacao ||
        item.criadoEm ||
        item.createdAt ||
        item.dataHoraCadastro ||
        ''
    );

    const ordenarItens = (lista) => [...lista].sort((a, b) => {
        const espacoCompare = String(a.espacoId || '').localeCompare(String(b.espacoId || ''));
        if (espacoCompare !== 0) return espacoCompare;

        const dataA = new Date(getDataCadastro(a)).getTime() || 0;
        const dataB = new Date(getDataCadastro(b)).getTime() || 0;
        return dataB - dataA;
    });

    const filtrarItensLocalmente = (lista, termo, listaEspacos) => {
        const termoNormalizado = termo.trim().toLowerCase();
        if (!termoNormalizado) return lista;

        return lista.filter(item => {
            const espaco = listaEspacos.find(e => e.espacoId === item.espacoId);
            return [
                item.descricao,
                item.espacoId,
                espaco?.nome,
                espaco?.descricao,
                TIPO_UNIDADE[item.tipoUnidadeMedida]
            ].some(valor => String(valor || '').toLowerCase().includes(termoNormalizado));
        });
    };

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const paramsItens = new URLSearchParams({
                unidadeOrganizacionalId,
                skip: '0',
                top: '50'
            });

            if (pesquisa.trim()) {
                paramsItens.set('filtro', pesquisa.trim());
            }

            const resItens = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque?${paramsItens.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resEspacos = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resItens.ok && resEspacos.ok) {
                const itensRecebidos = await resItens.json();
                const espacosRecebidos = await resEspacos.json();
                const itensFiltrados = filtrarItensLocalmente(itensRecebidos, pesquisa, espacosRecebidos);

                setItens(ordenarItens(itensFiltrados));
                setEspacos(espacosRecebidos);
            } else {
                setErro('Falha ao carregar os dados do estoque.');
            }
        } catch (err) {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId, pesquisa]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const carregarHistorico = async (id) => {
        setLoadingHistorico(true);
        try {
            const res = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${id}/historico`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setHistorico(await res.json());
            }
        } catch (err) {

        } finally {
            setLoadingHistorico(false);
        }
    };

    const parseBackendErrors = async (res) => {
        try {
            const text = await res.text();
            if (!text) return;
            const errorData = JSON.parse(text);
            const mappedErrors = {};
            if (Array.isArray(errorData)) {
                errorData.forEach(err => {
                    const fieldName = err.field || err.Field;
                    if (fieldName) mappedErrors[fieldName] = err.error || err.Error;
                });
            } else if (errorData.errors) {
                Object.keys(errorData.errors).forEach(key => {
                    let cleanKey = key.replace('$.', '');
                    const fieldName = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
                    mappedErrors[fieldName] = errorData.errors[key][0];
                });
            }
            setFieldErrors(mappedErrors);
        } catch (e) {
            setErro('Verifique os campos preenchidos e tente novamente.');
        }
    };

    const abrirDetalhes = (item) => {
        setItemAtivo(item);
        setFormEdicao({
            espacoId: item.espacoId || '',
            descricao: item.descricao || '',
            tipoUnidadeMedida: item.tipoUnidadeMedida || 1,
            quantidade: formatQuantityInput(item.quantidade || 0)
        });
        setViewMode('detail');
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarHistorico(item.itemEstoqueId);
    };

    const voltarParaLista = () => {
        setViewMode('list');
        setItemAtivo(null);
        setErro(''); setSucesso(''); setFieldErrors({});
        carregarDados();
    };

    const handleCriar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formDataNovo.espacoId === '' ? '00000000-0000-0000-0000-000000000000' : formDataNovo.espacoId,
            descricao: formDataNovo.descricao,
            tipoUnidadeMedida: parseInt(formDataNovo.tipoUnidadeMedida),
            quantidade: formDataNovo.quantidade === '' ? 0 : parseQuantity(formDataNovo.quantidade)
        };

        try {
            const response = await fetch('https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowModalNovo(false);
                setSucesso('Item cadastrado com sucesso.');
                carregarDados();
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão com o servidor.'); }
    };

    const houveMudanca = itemAtivo && (
        itemAtivo.descricao !== formEdicao.descricao ||
        itemAtivo.espacoId !== formEdicao.espacoId ||
        itemAtivo.tipoUnidadeMedida != formEdicao.tipoUnidadeMedida ||
        parseQuantity(itemAtivo.quantidade) !== parseQuantity(formEdicao.quantidade)
    );

    const handleConfirmarEdicao = async () => {
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formEdicao.espacoId === '' ? '00000000-0000-0000-0000-000000000000' : formEdicao.espacoId,
            descricao: formEdicao.descricao,
            tipoUnidadeMedida: parseInt(formEdicao.tipoUnidadeMedida),
            quantidade: parseQuantity(formEdicao.quantidade)
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Item atualizado com sucesso.');
                setItemAtivo({ ...itemAtivo, ...payload });
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão com o servidor.'); }
    };

    const handleExcluir = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setShowDeleteModal(false);
                voltarParaLista();
                setTimeout(() => setSucesso('Item excluído com sucesso.'), 100);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
                setShowDeleteModal(false);
            }
        } catch (error) { setErro('Erro de conexão.'); setShowDeleteModal(false); }
    };

    const handleTransferir = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        if (!novoEspacoId) {
            setErro('Selecione o novo espaço de destino.');
            return;
        }

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}/transferir`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ novoEspacoId })
            });

            if (response.ok) {
                setSucesso('Item transferido com sucesso!');
                setShowTransferirModal(false);

                //atualiza na lista geral
                setItens(prev => prev.map(item =>
                    item.itemEstoqueId === itemAtivo.itemEstoqueId
                        ? { ...item, espacoId: novoEspacoId }
                        : item
                ));

                //atualiza o item ativo e o form na tela de detalhes
                setItemAtivo(prev => ({ ...prev, espacoId: novoEspacoId }));
                setFormEdicao(prev => ({ ...prev, espacoId: novoEspacoId }));

                setNovoEspacoId('');
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            setErro('Erro ao tentar transferir o item de espaço.');
        }
    };

    const handleMovimentar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const quantidadeMovimento = parseQuantity(movimentacaoData.quantidadeMovimento);
        if (!movimentacaoData.quantidadeMovimento || quantidadeMovimento <= 0) {
            setFieldErrors({ QuantidadeMovimento: 'Informe uma quantidade maior que zero.' });
            return;
        }

        const payload = {
            quantidade: quantidadeMovimento,
            tipoMovimentacao: parseInt(movimentacaoData.tipoMovimentacao),
            usuarioId: usuarioId || '00000000-0000-0000-0000-000000000000'
        };

        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Movimentação realizada com sucesso!');
                setShowMovimentarModal(false);

                carregarHistorico(itemAtivo.itemEstoqueId);
                const novaQtde = payload.tipoMovimentacao === 1
                    ? parseQuantity(itemAtivo.quantidade) + payload.quantidade
                    : parseQuantity(itemAtivo.quantidade) - payload.quantidade;

                setItemAtivo(prev => ({ ...prev, quantidade: novaQtde }));
                setFormEdicao(prev => ({ ...prev, quantidade: formatQuantityInput(novaQtde) }));

            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão.'); }
    };

    const getNomeEspaco = (id) => {
        const espaco = espacos.find(e => e.espacoId === id);
        return espaco ? espaco.nome : 'Espaço Desconhecido';
    };

    const abrirMovimentacao = (tipoMovimentacao) => {
        setMovimentacaoData({ tipoMovimentacao, quantidadeMovimento: '' });
        setShowMovimentarModal(true);
        setFieldErrors({});
    };

    const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

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
                    <h2 className="no-margin">Itens de Estoque</h2>
                    <button className="button inventory-list-header-action no-margin" onClick={() => { setFormDataNovo({ espacoId: espacos.length > 0 ? espacos[0].espacoId : '', descricao: '', tipoUnidadeMedida: 6, quantidade: '' }); setShowModalNovo(true); setFieldErrors({}); setErro(''); }}>+ Novo Item</button>
                </div>

                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Pesquisar itens por descrição..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="w-full no-field-margin"
                    />
                </div>

                {loading ? (
                    <LoadingWaves rows={3} label="Carregando itens" />
                ) : espacos.length === 0 ? (
                    <div className="alert alert-error">Você precisa cadastrar um Espaço antes de criar Itens.</div>
                ) : itens.length === 0 ? (
                    <div className="card empty-state-card">
                        <div className="empty-state-body">
                            <p className="empty-state-text">Nenhum item de estoque cadastrado.</p>
                        </div>
                    </div>
                ) : (
                    <div className="inventory-grid inventory-grid-compact">
                        {itens.map(item => (
                            <div key={item.itemEstoqueId} className="inventory-grid-item">
                                <div className="card inventory-card inventory-list-card inventory-item-list-card inventory-card-surface">
                                    <div className="inventory-card-header">
                                        <div className="inventory-card-title-row">
                                            <h3 className="inventory-card-title">{item.descricao}</h3>
                                            <span className="inventory-card-badge">
                                                {formatQuantity(item.quantidade)}
                                            </span>
                                        </div>
                                        <p className="inventory-card-description">
                                            Local: {getNomeEspaco(item.espacoId)}
                                        </p>
                                    </div>
                                    <div className="inventory-card-footer">
                                        <button className="button button-outline inventory-card-action" onClick={() => abrirDetalhes(item)}>
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
                        <div className="card modal-card-scroll">
                            <div className="modal-card-body">
                                <h2 className="form-modal-title">Novo Item</h2>
                                <form onSubmit={handleCriar} noValidate>
                                    <div className="mb-1">
                                        <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                                        <input type="text" value={formDataNovo.descricao} onChange={e => setFormDataNovo({ ...formDataNovo, descricao: e.target.value })} className={getInputClassName(fieldErrors.Descricao)} />
                                        {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                                    </div>

                                    <div className="row">
                                        <div className="column-6 mb-1">
                                            <label className={`label-sm ${fieldErrors.EspacoId ? 'error' : ''}`}>Local (Espaço)</label>
                                            <select value={formDataNovo.espacoId} onChange={e => setFormDataNovo({ ...formDataNovo, espacoId: e.target.value })} className={getInputClassName(fieldErrors.EspacoId)}>
                                                <option value="" disabled>Selecione...</option>
                                                {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                                            </select>
                                            {fieldErrors.EspacoId && <small className="invalid-feedback d-block">{fieldErrors.EspacoId}</small>}
                                        </div>
                                        <div className="column-6 mb-1">
                                            <label className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : ''}`}>Unidade de Medida</label>
                                            <select value={formDataNovo.tipoUnidadeMedida} onChange={e => setFormDataNovo({ ...formDataNovo, tipoUnidadeMedida: e.target.value })} className={getInputClassName(fieldErrors.TipoUnidadeMedida)}>
                                                {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                            </select>
                                            {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className={`label-sm ${fieldErrors.Quantidade ? 'error' : ''}`}>Quantidade Inicial</label>
                                        <input type="text" inputMode="decimal" value={formDataNovo.quantidade} onChange={e => setFormDataNovo({ ...formDataNovo, quantidade: maskQuantityInput(e.target.value) })} className={getInputClassName(fieldErrors.Quantidade)} />
                                        {fieldErrors.Quantidade && <small className="invalid-feedback d-block">{fieldErrors.Quantidade}</small>}
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
                <h2 className="no-margin">Detalhes do Item</h2>
            </div>

            {erro && <div className="alert alert-error mb-1">{erro}</div>}
            {sucesso && <div className="alert alert-success mb-1">{sucesso}</div>}

            <div className="card detail-card">
                <div className="detail-card-body">
                    <div className="row">
                        <div className="column-4 mb-1">
                            <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                            <input type="text" value={formEdicao.descricao} onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })} className={getInputClassName(fieldErrors.Descricao)} />
                            {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                        </div>
                        <div className="column-3 mb-1">
                            <label className={`label-sm ${fieldErrors.EspacoId ? 'error' : ''}`}>Local (Espaço)</label>
                            <select value={formEdicao.espacoId} onChange={e => setFormEdicao({ ...formEdicao, espacoId: e.target.value })} className={getInputClassName(fieldErrors.EspacoId)}>
                                {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                            </select>
                            {fieldErrors.EspacoId && <small className="invalid-feedback d-block">{fieldErrors.EspacoId}</small>}
                        </div>
                        <div className="column-3 mb-1">
                            <label className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : ''}`}>Unidade</label>
                            <select value={formEdicao.tipoUnidadeMedida} onChange={e => setFormEdicao({ ...formEdicao, tipoUnidadeMedida: e.target.value })} className={getInputClassName(fieldErrors.TipoUnidadeMedida)}>
                                {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                            </select>
                            {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                        </div>
                        <div className="column-2 mb-1">
                            <label className="label-sm text-muted">Saldo Atual</label>
                            <input type="text" inputMode="decimal" value={formEdicao.quantidade} onChange={e => setFormEdicao({ ...formEdicao, quantidade: maskQuantityInput(e.target.value) })} className="w-full no-field-margin" />
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="button button-outline button-full mb-2"

                onClick={() => {
                    setNovoEspacoId('');
                    setShowTransferirModal(true);
                }}
            >
                Transferir item para outro espaço
            </button>

            <div className="stock-movement-actions">
                <button className="button button-full" onClick={() => abrirMovimentacao(1)}>
                    + Entrada
                </button>
                <button className="button button-exit button-full" onClick={() => abrirMovimentacao(2)}>
                    - Saída
                </button>
            </div>

            <div className="section-heading">
                <h3 className="section-title-reset">Histórico de Movimentações</h3>
            </div>

            {loadingHistorico ? (
                <LoadingWaves rows={3} label="Carregando histórico" />
            ) : historico.length === 0 ? (
                <div className="card history-empty-card">
                    <div className="empty-state-body-compact">
                        <p className="empty-state-text">Nenhuma movimentação registrada.</p>
                    </div>
                </div>
            ) : (
                <div className="history-grid mb-2">
                    {historico.map((hist, index) => {
                        const qtd = Math.abs(hist.quantidadeResultante - hist.quantidadeAnterior);
                        const tipo = hist.tipoMovimentacao;
                        const data = hist.dataHora;

                        const nome = hist.nome || 'Sistema (Sem usuário)';

                        return (
                            <div key={hist.historicoId || index} className="history-grid-item">
                                <div className={`card history-card ${tipo === 1 ? 'history-entry' : 'history-exit'}`}>
                                    <div className="history-card-content">
                                        <div className="history-card-info">
                                            <h4 className="history-card-title">
                                                {tipo === 1 ? 'Entrada (+)' : 'Saída (-)'}
                                            </h4>
                                            <small className="history-card-meta">
                                                Data: {new Date(data).toLocaleString()}
                                            </small>
                                            <small className="history-card-meta">
                                                Responsável: <span className="text-accent">{nome}</span>
                                            </small>
                                        </div>
                                        <div className={`history-card-amount ${tipo === 1 ? 'history-amount-entry' : 'history-amount-exit'}`}>
                                            {tipo === 1 ? '+' : '-'}{formatQuantity(qtd)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

            {showMovimentarModal && (
                <div className="modal-overlay">
                    <div className="card movement-modal-card">
                        <div className="modal-card-body">
                            <h2 className="movement-modal-title">Movimentar Estoque</h2>
                            <p className="movement-item-name">{itemAtivo?.descricao}</p>

                            <form onSubmit={handleMovimentar} noValidate>
                                <div className="mb-2">
                                    <span className="label-sm text-muted">Operação</span>
                                    <div className={`movement-operation-summary ${movimentacaoData.tipoMovimentacao == 2 ? 'movement-operation-exit' : 'movement-operation-entry'}`}>
                                        {movimentacaoData.tipoMovimentacao == 2 ? 'Saída (-)' : 'Entrada (+)'}
                                    </div>
                                    {fieldErrors.TipoMovimentacao && <small className="invalid-feedback d-block">{fieldErrors.TipoMovimentacao}</small>}
                                </div>

                                <div className="mb-2">
                                    <label className="label-sm">Quantidade</label>
                                    <input type="text" inputMode="decimal" value={movimentacaoData.quantidadeMovimento} onChange={e => setMovimentacaoData({ ...movimentacaoData, quantidadeMovimento: maskQuantityInput(e.target.value) })} className={getInputClassName(fieldErrors.QuantidadeMovimento)} />
                                    {fieldErrors.QuantidadeMovimento && <small className="invalid-feedback d-block">{fieldErrors.QuantidadeMovimento}</small>}
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="button button-outline" onClick={() => setShowMovimentarModal(false)}>Cancelar</button>
                                    <button type="submit" className={`button ${movimentacaoData.tipoMovimentacao == 2 ? 'button-exit' : 'button-accent-confirm'}`}>Confirmar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="modal-card-body">
                            <h2 className="modal-title">Excluir Item</h2>
                            <p className="modal-description">Tem certeza que deseja excluir o item de estoque? Todo o histórico de movimentações também será perdido.</p>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button type="button" className="button button-exit button-flex" onClick={handleExcluir}>Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTransferirModal && (
                <div className="modal-overlay">
                    <div className="card transfer-modal-card">
                        <h2 className="modal-title">Transferir de Espaço</h2>
                        <p className="transfer-description">
                            Selecione o novo local para o item <strong>{itemAtivo?.descricao}</strong>:
                        </p>

                        <form onSubmit={handleTransferir} noValidate>
                            <div className="mb-2">
                                <label className="label-sm">Espaço de Destino</label>
                                <select
                                    value={novoEspacoId}
                                    onChange={e => setNovoEspacoId(e.target.value)}
                                    className="transfer-select"
                                >
                                    <option value="">Selecione um espaço...</option>
                                    {espacos
                                        .filter(e => e.espacoId !== itemAtivo?.espacoId)
                                        .map(e => (
                                            <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="button button-outline button-flex" onClick={() => setShowTransferirModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="button button-flex">
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {messageModal}
        </div>
    );
}