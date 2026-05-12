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

    //modais
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);

    const [itemAtivo, setItemAtivo] = useState(null);
    const [formData, setFormData] = useState({ itemEstoqueId: '', espacoId: '', descricao: '', tipoUnidadeMedida: 1, quantidade: 0 });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const resItens = await fetch(`https://estoque-certo.onrender.com/v1/itens-estoque?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resEspacos = await fetch(`https://estoque-certo.onrender.com/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&top=50`, {
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

    const abrirModalNovo = () => {
        setModalMode('create');
        setFormData({ itemEstoqueId: '', espacoId: espacos.length > 0 ? espacos[0].espacoId : '', descricao: '', tipoUnidadeMedida: 1, quantidade: 0 });
        setErro(''); setSucesso(''); setShowModal(true);
    };

    const abrirModalEditar = (item) => {
        setModalMode('edit');
        setFormData({ ...item });
        setErro(''); setSucesso(''); setShowModal(true);
    };

    const confirmarExclusao = (item) => {
        setItemAtivo(item);
        setShowDeleteModal(true);
    };

    const abrirModalMovimentar = (item) => {
        setItemAtivo(item);
        setMovimentacaoData({ tipoMovimentacao: 1, quantidadeMovimento: '' });
        setErro(''); setSucesso(''); setShowMovimentarModal(true);
    };

    const handleCriarEditar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso('');

        const payload = {
            unidadeOrganizacionalId: unidadeOrganizacionalId,
            espacoId: formData.espacoId,
            descricao: formData.descricao,
            tipoUnidadeMedida: parseInt(formData.tipoUnidadeMedida),
            quantidade: parseFloat(formData.quantidade)
        };

        const url = modalMode === 'create' ? 'https://estoque-certo.onrender.com/v1/itens-estoque' : `https://estoque-certo.onrender.com/v1/itens-estoque/${formData.itemEstoqueId}`;
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
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { setErro('Erro de conexão com o servidor.'); }
    };

    const handleExcluir = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await fetch(`https://estoque-certo.onrender.com/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
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
        setErro(''); setSucesso('');

        const payload = {
            quantidade: parseFloat(movimentacaoData.quantidadeMovimento),
            tipoMovimentacao: parseInt(movimentacaoData.tipoMovimentacao),
            usuarioId: usuarioId
        };

        try {
            const response = await fetch(`https://estoque-certo.onrender.com/v1/itens-estoque/${itemAtivo.itemEstoqueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSucesso('Movimentação realizada com sucesso!');
                setShowMovimentarModal(false);
                carregarDados();
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, padding: '1.5rem', boxSizing: 'border-box'
    };

    const modalCardStyle = {
        width: '100%', maxWidth: '450px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto',
        backgroundColor: '#0f172a',
        borderRadius: '12px', border: '1px solid #1e293b',
        padding: '2rem', boxSizing: 'border-box', color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
    };

    const inputBaseStyle = {
        width: '100%', padding: '0.85rem', borderRadius: '6px',
        backgroundColor: '#1e293b', color: '#f8fafc',
        border: '1px solid #334155', boxSizing: 'border-box', outline: 'none'
    };

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
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--zf-text-main)', margin: 0 }}>Nenhum item de estoque cadastrado.</p>
                </div>
            ) : (
                <div className="zf-row">
                    {itens.map(item => (
                        <div key={item.itemEstoqueId} className="zf-col-xs-12 zf-col-md-6 zf-col-lg-4 zf-col-xl-3" style={{ marginBottom: '1rem' }}>
                            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    ))}
                </div>
            )}

            {/*modal criar*/}
            {showModal && (
                <div style={overlayStyle}>
                    <div style={modalCardStyle}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: '#fff' }}>
                            {modalMode === 'create' ? 'Novo Item' : 'Editar Item'}
                        </h2>
                        <form onSubmit={handleCriarEditar}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Descrição do Produto</label>
                                <input type="text" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} required style={inputBaseStyle} />
                            </div>

                            <div className="zf-row">
                                <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Local (Espaço)</label>
                                    <select value={formData.espacoId} onChange={e => setFormData({ ...formData, espacoId: e.target.value })} required style={inputBaseStyle}>
                                        <option value="" disabled>Selecione...</option>
                                        {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                                    </select>
                                </div>
                                <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Unidade de Medida</label>
                                    <select value={formData.tipoUnidadeMedida} onChange={e => setFormData({ ...formData, tipoUnidadeMedida: e.target.value })} style={inputBaseStyle}>
                                        {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Quantidade Inicial</label>
                                <input type="number" step="0.001" value={formData.quantidade} onChange={e => setFormData({ ...formData, quantidade: e.target.value })} required style={inputBaseStyle} disabled={modalMode === 'edit'} title={modalMode === 'edit' ? "Use o botão Entrada/Saída para alterar o estoque" : ""} />
                                {modalMode === 'edit' && <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>Para alterar o estoque, use a função de Movimentação.</small>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1, borderColor: '#475569', color: '#fff' }} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="button" style={{ flex: 1 }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/*modal movimentar*/}
            {showMovimentarModal && (
                <div style={overlayStyle}>
                    <div style={{ ...modalCardStyle, maxWidth: '400px' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center', color: '#fff' }}>Movimentar Estoque</h2>
                        <p style={{ textAlign: 'center', color: 'var(--zf-accent)', marginBottom: '1.5rem', fontWeight: 'bold' }}>{itemAtivo?.descricao}</p>

                        <form onSubmit={handleMovimentar}>
                            <div className="zf-row">
                                <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Operação</label>
                                    <select value={movimentacaoData.tipoMovimentacao} onChange={e => setMovimentacaoData({ ...movimentacaoData, tipoMovimentacao: e.target.value })} style={inputBaseStyle}>
                                        <option value={1}>Entrada (+)</option>
                                        <option value={2}>Saída (-)</option>
                                    </select>
                                </div>
                                <div className="zf-col-xs-12 zf-col-md-6" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Quantidade</label>
                                    <input type="number" step="0.001" min="0.001" value={movimentacaoData.quantidadeMovimento} onChange={e => setMovimentacaoData({ ...movimentacaoData, quantidadeMovimento: e.target.value })} required style={inputBaseStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="button button-outline" style={{ flex: 1, borderColor: '#475569', color: '#fff' }} onClick={() => setShowMovimentarModal(false)}>Cancelar</button>
                                <button type="submit" className="button" style={{ flex: 1, backgroundColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', borderColor: movimentacaoData.tipoMovimentacao == 2 ? '#ef4444' : 'var(--zf-accent)', color: movimentacaoData.tipoMovimentacao == 2 ? '#fff' : '#000' }}>Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/*modal excluir*/}
            {showDeleteModal && (
                <div style={overlayStyle}>
                    <div style={{ ...modalCardStyle, maxWidth: '400px', textAlign: 'center' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff' }}>Excluir Item</h2>
                        <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>Tem certeza que deseja excluir o item de estoque? Todo o histórico de movimentações também será apagado.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="button button-outline" style={{ flex: 1, borderColor: '#475569', color: '#fff' }} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                            <button type="button" className="button" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleExcluir}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}