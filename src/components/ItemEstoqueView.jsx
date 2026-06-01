import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarEspacos } from '../services/espacoService';
import { excluirItemEstoque, listarItensEstoque } from '../services/itemEstoqueService';
import { extrairErro, extrairMensagem } from '../utils/apiUtils';
import {
    filtrarItensEstoque,
    ordenarItensEstoque
} from '../utils/itemEstoqueViewModel';
import MessageModal from './MessageModal';
import ExcluirItensSelecionadosModal from './itemEstoque/ExcluirItensSelecionadosModal';
import ItemEstoqueList from './itemEstoque/ItemEstoqueList';

export default function ItemEstoqueView({ token, unidadeOrganizacionalId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [itens, setItens] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [pesquisa, setPesquisa] = useState('');
    const [itensSelecionados, setItensSelecionados] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                setItensSelecionados(prev =>
                    prev.filter(itemId => itensFiltrados.some(item => item.itemEstoqueId === itemId))
                );
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

    const getNomeEspaco = (id) => {
        const espaco = espacos.find(e => e.espacoId === id);
        return espaco ? espaco.nome : 'Espaço Desconhecido';
    };

    const handleSelecionarItem = (itemId) => {
        setItensSelecionados(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleExcluirSelecionados = async () => {
        if (itensSelecionados.length === 0) {
            setShowDeleteModal(false);
            return;
        }

        setErro('');
        setSucesso('');

        let ultimaMensagem = '';
        const removidos = [];

        try {
            for (const itemEstoqueId of itensSelecionados) {
                const response = await excluirItemEstoque({ token, itemEstoqueId });

                if (response.ok || response.status === 204) {
                    removidos.push(itemEstoqueId);
                    const mensagem = await extrairMensagem(response);
                    if (mensagem) ultimaMensagem = mensagem;
                } else {
                    const mensagem = await extrairErro(response);
                    setShowDeleteModal(false);
                    if (mensagem) setErro(mensagem);
                    break;
                }
            }

            if (removidos.length > 0) {
                setItens(prev => prev.filter(item => !removidos.includes(item.itemEstoqueId)));
                setItensSelecionados(prev => prev.filter(itemId => !removidos.includes(itemId)));
            }

            if (removidos.length === itensSelecionados.length) {
                setShowDeleteModal(false);
                if (ultimaMensagem) setSucesso(ultimaMensagem);
            }
        } catch (err) {
            console.error(err);
            setShowDeleteModal(false);
        }
    };

    const messageModal = (erro || sucesso) && (
        <MessageModal
            type={erro ? 'error' : 'success'}
            message={erro || sucesso}
            onClose={() => { setErro(''); setSucesso(''); }}
            autoClose={8000}
        />
    );

    return (
        <>
            <ItemEstoqueList
                getNomeEspaco={getNomeEspaco}
                itens={itens}
                loading={loading}
                onAbrirDetalhes={(item) => navigate(`/itens-estoque/${item.itemEstoqueId}`)}
                onAbrirNovo={() => navigate('/itens-estoque/novo')}
                onChangePesquisa={setPesquisa}
                onExcluirSelecionados={() => setShowDeleteModal(true)}
                onSelecionarItem={handleSelecionarItem}
                pesquisa={pesquisa}
                selecionados={itensSelecionados}
                messageModal={messageModal}
            />
            {showDeleteModal && (
                <ExcluirItensSelecionadosModal
                    quantidade={itensSelecionados.length}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleExcluirSelecionados}
                />
            )}
        </>
    );
}
