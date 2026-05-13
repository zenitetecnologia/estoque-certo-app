import React, { useState, useEffect, useCallback } from 'react';
import { extrairErro } from '../utils/apiUtils';

const TIPO_UNIDADE = {
    1: 'Unidades (UN)',
    2: 'Quilogramas (KG)',
    3: 'Litros (L)',
    4: 'Caixas (CX)'
};

export default function ItemEstoqueView({ token, unidadeOrganizacionalId, usuarioId }) {
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    //modais
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);

    const [itemAtivo, setItemAtivo] = useState(null);
    const [formData, setFormData] = useState({ itemEstoqueId: '', espacoId: '', descricao: '', tipoUnidadeMedida: 1, quantidade: '' });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const resItens = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resEspacos = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resItens.ok && resEspacos.ok) {
                setItens(await resItens.json());
                setEspacos(await resEspacos.json());
            } else {
                setErro('Falha ao carregar os dados do estoque.');
            }
        } catch (err) {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

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

    const abrirModalNovo = () => {
        setModalMode('create');
        setFormData({ itemEstoqueId: '', espacoId: espacos.length > 0 ? espacos[0].espacoId : '', descricao: '', tipoUnidadeMedida: 1, quantidade: '' });
        setErro(''); setSucesso(''); setFieldErrors({}); setShowModal(true);
    };

    const abrirModalEditar = (item) => {
        setModalMode('edit');
        setFormData({ ...item });
        setErro(''); setSucesso(''); setFieldErrors({}); setShowModal(true);
    };

    const confirmarExclusao = (item) => {
        setItemAtivo(item);
        setShowDeleteModal(true);
    };

    const abrirModalMovimentar = (item) => {
        setItemAtivo(item);
        setMovimentacaoData({ tipoMovimentacao: 1, quantidadeMovimento: '' });
        setErro(''); setSucesso(''); setFieldErrors({}); setShowMovimentarModal(true);
    };

    const handleCriarEditar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formData.espacoId === '' ? '00000000-0000-0000-0000-000000000000' : formData.espacoId,
            descricao: formData.descricao,
            tipoUnidadeMedida: parseInt(formData.tipoUnidadeMedida),
            quantidade: formData.quantidade === '' ? 0 : parseFloat(formData.quantidade)
        };

        const url = modalMode === 'create'
            ? 'https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque'
            : `https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${formData.itemEstoqueId}`;

        const method = modalMode === 'create' ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowModal(false);
                setSucesso(modalMode === 'create' ? 'Item cadastrado com sucesso.' : 'Item atualizado com sucesso.');
                carregarDados();
            } else if (response.status === 400) {
                await parseBackendErrors(response);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    const handleExcluir = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://api.estoquecerto.zenitetecnologia.ia.br/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSucesso('Item excluído com sucesso.');
                setShowDeleteModal(false);
                carregarDados();
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
                setShowDeleteModal(false);
            }
        } catch (error) { setErro('Erro de conexão.'); setShowDeleteModal(false); }
    };

    const handleMovimentar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = {
            quantidade: movimentacaoData.quantidadeMovimento === '' ? 0 : parseFloat(movimentacaoData.quantidadeMovimento),
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
                carregarDados();
            } else if (response.status === 400) {
                try {
                    const text = await response.text();
                    if (text) {
                        const errorData = JSON.parse(text);
                        const mappedErrors = {};
                        if (Array.isArray(errorData)) {
                            errorData.forEach(err => {
                                const fieldName = err.field || err.Field;
                                if (fieldName) mappedErrors[fieldName === 'Quantidade' ? 'QuantidadeMovimento' : fieldName] = err.error || err.Error;
                            });
                        } else if (errorData.errors) {
                            Object.keys(errorData.errors).forEach(key => {
                                let cleanKey = key.replace('$.', '');
                                const fieldName = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
                                mappedErrors[fieldName === 'Quantidade' ? 'QuantidadeMovimento' : fieldName] = errorData.errors[key][0];
                            });
                        }
                        setFieldErrors(mappedErrors);
                    }
                } catch (e) {
                    setErro('Verifique os campos preenchidos.');
                }
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

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, padding: '1.5rem', boxSizing: 'border-box'
    };

    const getInputBaseStyle = (isError) => ({
        width: '100%',
        marginBottom: 0,
        borderColor: isError ? '#ff4444' : undefined,
        outlineColor: isError ? '#ff4444' : undefined
    });

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Itens de Estoque</h2>
                <button className="button" onClick={abrirModalNovo}>+ Novo Item</button>
            </div>

            {erro && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{erro}</div>}
            {sucesso && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{sucesso}</div>}

            {loading ? (
                <p>Carregando itens...</p>
            ) : espacos.length === 0 ? (
                <div className="alert alert-error">Você precisa cadastrar um Espaço antes de criar Itens.</div>
            ) : itens.length === 0 ? (
                <div className="card" style={{ backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                        <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Nenhum item de estoque cadastrado.</p>
                    </div>
                </div>
            ) : (
                <div className="zf-row">
                    {itens.map(item => (
                        <div key={item.itemEstoqueId} className="zf-col-xs-12 zf-col-md-6 zf-col-lg-4 zf-col-xl-3" style={{ marginBottom: '1rem' }}>
                            <div className="card" style={{ height: '100%', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--zf-text-h)', fontSize: '1.2rem' }}>{item.descricao}</h3>
                                        <span style={{ backgroundColor: 'var(--zf-accent)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {parseFloat(item.quantidade)} {TIPO_UNIDADE[item.tipoUnidadeMedida] || 'UN'}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--zf-text-main)', fontSize: '0.85rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                                        Local: {getNomeEspaco(item.espacoId)}
                                    </p>

                                    <button className="button" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={() => abrirModalMovimentar(item)}>
                                        Entrada / Saída
                                    </button>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="button button-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }} onClick={() => abrirModalEditar(item)}>Editar</button>
                                        <button className="button button-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', borderColor: '#dc3545', color: '#dc3545' }} onClick={() => confirmarExclusao(item)}>Excluir</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/*modal criar*/}
            {showModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '450px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--zf-text-h)' }}>
                                {modalMode === 'create' ? 'Novo Item' : 'Editar Item'}
                            </h2>
                            <form onSubmit={handleCriarEditar} noValidate>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Descricao ? '#ff4444' : 'inherit' }}>Descrição do Produto</label>
                                    <input type="text" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} style={getInputBaseStyle(fieldErrors.Descricao)} />
                                    {fieldErrors.Descricao && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Descricao}</small>}
                                </div>

                                <div className="zf-row">
                                    <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.EspacoId ? '#ff4444' : 'inherit' }}>Local (Espaço)</label>
                                        <select value={formData.espacoId} onChange={e => setFormData({ ...formData, espacoId: e.target.value })} style={getInputBaseStyle(fieldErrors.EspacoId)}>
                                            <option value="" disabled>Selecione...</option>
                                            {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                                        </select>
                                        {fieldErrors.EspacoId && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.EspacoId}</small>}
                                    </div>
                                    <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.TipoUnidadeMedida ? '#ff4444' : 'inherit' }}>Unidade de Medida</label>
                                        <select value={formData.tipoUnidadeMedida} onChange={e => setFormData({ ...formData, tipoUnidadeMedida: e.target.value })} style={getInputBaseStyle(fieldErrors.TipoUnidadeMedida)}>
                                            {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                        </select>
                                        {fieldErrors.TipoUnidadeMedida && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.TipoUnidadeMedida}</small>}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.Quantidade ? '#ff4444' : 'inherit' }}>Quantidade Inicial</label>
                                    <input type="number" step="0.001" value={formData.quantidade} onChange={e => setFormData({ ...formData, quantidade: e.target.value })} style={getInputBaseStyle(fieldErrors.Quantidade)} disabled={modalMode === 'edit'} title={modalMode === 'edit' ? "Use o botão Entrada/Saída para alterar o estoque" : ""} />
                                    {fieldErrors.Quantidade && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.Quantidade}</small>}
                                    {modalMode === 'edit' && <small style={{ color: 'var(--zf-text-main)', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>Para alterar o estoque, use a função de Movimentação.</small>}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="button" style={{ flex: 1 }}>Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/*modal movimentar*/}
            {showMovimentarModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--zf-text-h)' }}>Movimentar Estoque</h2>
                            <p style={{ textAlign: 'center', color: 'var(--zf-accent)', marginBottom: '1.5rem', fontWeight: 'bold' }}>{itemAtivo?.descricao}</p>

                            <form onSubmit={handleMovimentar} noValidate>
                                <div className="zf-row">
                                    <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.TipoMovimentacao ? '#ff4444' : 'inherit' }}>Operação</label>
                                        <select value={movimentacaoData.tipoMovimentacao} onChange={e => setMovimentacaoData({ ...movimentacaoData, tipoMovimentacao: e.target.value })} style={getInputBaseStyle(fieldErrors.TipoMovimentacao)}>
                                            <option value={1}>Entrada (+)</option>
                                            <option value={2}>Saída (-)</option>
                                        </select>
                                        {fieldErrors.TipoMovimentacao && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.TipoMovimentacao}</small>}
                                    </div>
                                    <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: fieldErrors.QuantidadeMovimento ? '#ff4444' : 'inherit' }}>Quantidade</label>
                                        <input type="number" step="0.001" min="0.001" value={movimentacaoData.quantidadeMovimento} onChange={e => setMovimentacaoData({ ...movimentacaoData, quantidadeMovimento: e.target.value })} style={getInputBaseStyle(fieldErrors.QuantidadeMovimento)} />
                                        {fieldErrors.QuantidadeMovimento && <small style={{ color: '#ff4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>{fieldErrors.QuantidadeMovimento}</small>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowMovimentarModal(false)}>Cancelar</button>
                                    <button type="submit" className="button" style={{ flex: 1, backgroundColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', borderColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', color: movimentacaoData.tipoMovimentacao == 2 ? '#fff' : '#000' }}>Confirmar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/*modal excluir*/}
            {showDeleteModal && (
                <div style={overlayStyle}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', height: 'fit-content', margin: 'auto', textAlign: 'center', backgroundColor: 'var(--zf-background-secondary)', borderRadius: '10px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--zf-text-h)' }}>Excluir Item</h2>
                            <p style={{ marginBottom: '2rem', color: 'var(--zf-text-main)' }}>Tem certeza que deseja excluir o item de estoque? Todo o histórico de movimentações também será apagado.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                <button type="button" className="button" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleExcluir}>Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}