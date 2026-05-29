import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarEspacos } from '../services/espacoService';
import {
    atualizarItemEstoque,
    excluirItemEstoque,
    listarHistoricoItem,
    listarItensEstoque,
    movimentarItemEstoque,
    transferirItemEstoque
} from '../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import {
    criarPayloadItemEstoque,
    criarPayloadMovimentacao,
    filtrarItensEstoque,
    ordenarItensEstoque
} from '../utils/itemEstoqueViewModel';
import { formatQuantityInput, parseQuantity } from '../utils/quantity';
import MessageModal from './MessageModal';
import ItemEstoqueDetail from './itemEstoque/ItemEstoqueDetail';
import ItemEstoqueList from './itemEstoque/ItemEstoqueList';

export default function ItemEstoqueView({ token, unidadeOrganizacionalId, usuarioId }) {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMovimentarModal, setShowMovimentarModal] = useState(false);
    const [showTransferirModal, setShowTransferirModal] = useState(false);
    const [novoEspacoId, setNovoEspacoId] = useState('');

    const [itemAtivo, setItemAtivo] = useState(null);
    const [formEdicao, setFormEdicao] = useState({ espacoId: '', descricao: '', tipoUnidadeMedida: 1, quantidade: '' });
    const [movimentacaoData, setMovimentacaoData] = useState({ tipoMovimentacao: 1, quantidadeMovimento: '' });

    const carregarDados = useCallback(async () => {
        if (!unidadeOrganizacionalId) return;
        setLoading(true);
        setErro('');
        try {
            const resItens = await listarItensEstoque({ token, unidadeOrganizacionalId, filtro: pesquisa });
            const resEspacos = await listarEspacos({ token, unidadeOrganizacionalId });

            if (resItens.ok && resEspacos.ok) {
                const itensRecebidos = await resItens.json();
                const espacosRecebidos = await resEspacos.json();
                const itensFiltrados = filtrarItensEstoque(itensRecebidos, pesquisa, espacosRecebidos);

                setItens(ordenarItensEstoque(itensFiltrados));
                setEspacos(espacosRecebidos);
            } else {
                const mensagem = await extrairErro(!resItens.ok ? resItens : resEspacos);
                if (mensagem) setErro(mensagem);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, unidadeOrganizacionalId, pesquisa]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    useEffect(() => {
        if (!location.state?.sucesso) return;

        setSucesso(location.state.sucesso);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const carregarHistorico = async (id) => {
        setLoadingHistorico(true);
        try {
            const res = await listarHistoricoItem({ token, itemEstoqueId: id });
            if (res.ok) {
                setHistorico(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistorico(false);
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

    const houveMudanca = itemAtivo && (
        itemAtivo.descricao !== formEdicao.descricao ||
        itemAtivo.espacoId !== formEdicao.espacoId ||
        itemAtivo.tipoUnidadeMedida != formEdicao.tipoUnidadeMedida ||
        parseQuantity(itemAtivo.quantidade) !== parseQuantity(formEdicao.quantidade)
    );

    const handleConfirmarEdicao = async () => {
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = criarPayloadItemEstoque({
            unidadeOrganizacionalId,
            formData: formEdicao
        });

        try {
            const response = await atualizarItemEstoque({ token, itemEstoqueId: itemAtivo.itemEstoqueId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setItemAtivo({ ...itemAtivo, ...payload });
            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { console.error(error); }
    };

    const handleExcluir = async () => {
        setErro(''); setSucesso('');
        try {
            const response = await excluirItemEstoque({ token, itemEstoqueId: itemAtivo.itemEstoqueId });
            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                setShowDeleteModal(false);
                voltarParaLista();
                if (mensagem) setTimeout(() => setSucesso(mensagem), 100);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
                setShowDeleteModal(false);
            }
        } catch (error) { console.error(error); setShowDeleteModal(false); }
    };

    const handleTransferir = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        try {
            const response = await transferirItemEstoque({ token, itemEstoqueId: itemAtivo.itemEstoqueId, novoEspacoId, usuarioId });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
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
                carregarHistorico(itemAtivo.itemEstoqueId);

                setNovoEspacoId('');
            } else {
                setErro(await extrairErro(response));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleMovimentar = async (e) => {
        e.preventDefault();
        setErro(''); setSucesso(''); setFieldErrors({});

        const payload = criarPayloadMovimentacao({ movimentacaoData, usuarioId });

        try {
            const response = await movimentarItemEstoque({ token, itemEstoqueId: itemAtivo.itemEstoqueId, payload });

            if (response.ok) {
                const mensagem = await extrairMensagem(response);
                if (mensagem) setSucesso(mensagem);
                setShowMovimentarModal(false);

                carregarHistorico(itemAtivo.itemEstoqueId);
                const novaQtde = payload.tipoMovimentacao === 1
                    ? parseQuantity(itemAtivo.quantidade) + payload.quantidade
                    : parseQuantity(itemAtivo.quantidade) - payload.quantidade;

                setItemAtivo(prev => ({ ...prev, quantidade: novaQtde }));
                setFormEdicao(prev => ({ ...prev, quantidade: formatQuantityInput(novaQtde) }));

            } else if (response.status === 400) {
                await aplicarErrosCampos(response, setFieldErrors, setErro);
            } else {
                const msg = await extrairErro(response);
                setErro(msg);
            }
        } catch (error) { console.error(error); }
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
            <ItemEstoqueList
                getNomeEspaco={getNomeEspaco}
                itens={itens}
                loading={loading}
                onAbrirDetalhes={abrirDetalhes}
                onAbrirNovo={() => {
                    setFieldErrors({});
                    setErro('');
                    navigate('/itens-estoque/novo');
                }}
                onChangePesquisa={setPesquisa}
                pesquisa={pesquisa}
                messageModal={messageModal}
            />
        );
    }

    return (
        <ItemEstoqueDetail
            espacos={espacos}
            fieldErrors={fieldErrors}
            formEdicao={formEdicao}
            historico={historico}
            houveMudanca={houveMudanca}
            itemAtivo={itemAtivo}
            loadingHistorico={loadingHistorico}
            movimentacaoData={movimentacaoData}
            novoEspacoId={novoEspacoId}
            onAbrirMovimentacao={abrirMovimentacao}
            onChangeFormEdicao={setFormEdicao}
            onChangeMovimentacao={setMovimentacaoData}
            onChangeNovoEspaco={setNovoEspacoId}
            onCloseDelete={() => setShowDeleteModal(false)}
            onCloseMovimentar={() => setShowMovimentarModal(false)}
            onCloseTransferir={() => setShowTransferirModal(false)}
            onConfirmarEdicao={handleConfirmarEdicao}
            onExcluir={handleExcluir}
            onOpenDelete={() => setShowDeleteModal(true)}
            onOpenTransferir={() => {
                setNovoEspacoId('');
                setShowTransferirModal(true);
            }}
            onSubmitMovimentar={handleMovimentar}
            onSubmitTransferir={handleTransferir}
            onVoltar={voltarParaLista}
            showDeleteModal={showDeleteModal}
            showMovimentarModal={showMovimentarModal}
            showTransferirModal={showTransferirModal}
            messageModal={messageModal}
        />
    );
}