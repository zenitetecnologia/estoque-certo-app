import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    atualizarEspaco,
    excluirEspaco,
    listarEspacos,
    listarItensDoEspaco
} from '../services/espacoService';
import { atualizarItemEstoque } from '../services/itemEstoqueService';
import { aplicarErrosCampos, extrairErro, extrairMensagem } from '../utils/apiUtils';
import { criarPayloadEspaco, filtrarEspacos } from '../utils/espacoViewModel';
import { formatQuantityInput, maskQuantityInput, parseQuantity } from '../utils/quantity';
import MessageModal from './MessageModal';
import EspacoDetail from './espacos/EspacoDetail';
import EspacoList from './espacos/EspacoList';

export default function EspacoView({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [viewMode, setViewMode] = useState('list');
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [pesquisa, setPesquisa] = useState('');

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
            const response = await listarEspacos({ token, unidadeOrganizacionalId });
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
        if (!location.state?.sucesso) return;

        setSucesso(location.state.sucesso);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!erro && !sucesso) return;

        const timer = setTimeout(() => {
            setErro('');
            setSucesso('');
        }, 8000);
        return () => clearTimeout(timer);
    }, [erro, sucesso]);

    const abrirDetalhes = async (espaco) => {
        setEspacoSelecionado(espaco);
        setFormEdicao({ nome: espaco.nome, descricao: espaco.descricao || '' });
        setViewMode('detail');
        setErro(''); setSucesso(''); setFieldErrors({});

        setLoadingItens(true);
        try {
            const res = await listarItensDoEspaco({ token, espacoId: espaco.espacoId });
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
        const payload = criarPayloadEspaco({ unidadeOrganizacionalId, formData: formEdicao });

        try {
            const response = await atualizarEspaco({ token, espacoId: espacoSelecionado.espacoId, payload });

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
            const response = await excluirEspaco({ token, espacoId: espacoSelecionado.espacoId });

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
            const response = await atualizarItemEstoque({ token, itemEstoqueId: item.itemEstoqueId, payload });

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

    const espacosFiltrados = filtrarEspacos(espacos, pesquisa);

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
            <EspacoList
                espacos={espacos}
                espacosFiltrados={espacosFiltrados}
                loading={loading}
                messageModal={messageModal}
                onAbrirDetalhes={abrirDetalhes}
                onAbrirNovo={() => {
                    setFieldErrors({});
                    setErro('');
                    navigate('/espacos/novo');
                }}
                onChangePesquisa={setPesquisa}
                pesquisa={pesquisa}
            />
        );
    }

    return (
        <EspacoDetail
            fieldErrors={fieldErrors}
            formEdicao={formEdicao}
            houveMudanca={houveMudanca}
            itensDoEspaco={itensDoEspaco}
            loadingItens={loadingItens}
            messageModal={messageModal}
            onChangeFormEdicao={setFormEdicao}
            onCloseDelete={() => setShowDeleteModal(false)}
            onConfirmarEdicao={handleConfirmarEdicao}
            onExcluir={handleExcluirEspaco}
            onOpenDelete={() => setShowDeleteModal(true)}
            onQuantidadeItemChange={handleQuantidadeItemChange}
            onSalvarQuantidadeItem={handleSalvarQuantidadeItem}
            onVoltar={voltarParaLista}
            quantidadesEditadas={quantidadesEditadas}
            salvandoItemId={salvandoItemId}
            showDeleteModal={showDeleteModal}
        />
    );
}