// src/pages/home/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { listarEspacos } from '../../services/espacoService';
import { obterPizzaDashboard } from '../../services/relatorioService';
import PizzaDashboardChart from '../../components/charts/PizzaDashboardChart';
import { TIPOS_UNIDADE } from '../../constants/tiposUnidade';

export default function DashboardPage({ token, unidadeOrganizacionalId }) {
  const [espacos, setEspacos] = useState([]);
  const [espacoId, setEspacoId] = useState('');
  const [tipoUnidade, setTipoUnidade] = useState('');
  const [pizzaData, setPizzaData] = useState([]);
  const [loading, setLoading] = useState(false);

  // carrega espaços para o filtro
  useEffect(() => {
    if (!token || !unidadeOrganizacionalId) return;

    listarEspacos({ token, unidadeOrganizacionalId, top: 200 })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao listar espaços');
        const data = await res.json();
        setEspacos(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [token, unidadeOrganizacionalId]);

  // carrega dados da pizza sempre que filtro mudar
  useEffect(() => {
    if (!token || !unidadeOrganizacionalId) return;

    setLoading(true);
    obterPizzaDashboard({
      token,
      unidadeOrganizacionalId,
      espacoId: espacoId || undefined,
      tipoUnidadeMedida: tipoUnidade === '' ? undefined : Number(tipoUnidade),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao carregar dashboard');
        const data = await res.json(); // List<PizzaDashboardItem>
        setPizzaData(data);
      })
      .catch((err) => {
        console.error(err);
        setPizzaData([]);
      })
      .finally(() => setLoading(false));
  }, [token, unidadeOrganizacionalId, espacoId, tipoUnidade]);

  return (
    <div className="dashboard-page">
      <h2 className="page-title">Dashboard de Estoque</h2>

      <section className="dashboard-filtros">
        <div className="form-group">
          <label htmlFor="espaco">Espaço</label>
          <select
            id="espaco"
            value={espacoId}
            onChange={(e) => setEspacoId(e.target.value)}
          >
            <option value="">Todos os espaços</option>
            {espacos.map((e) => (
              <option key={e.espacoId} value={e.espacoId}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tipoUnidade">Tipo de unidade</label>
          <select
            id="tipoUnidade"
            value={tipoUnidade}
            onChange={(e) => setTipoUnidade(e.target.value)}
            // se não tiver espaço selecionado, mantém todos os tipos
            disabled={!espacoId}
          >
            {TIPOS_UNIDADE.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="dashboard-grafico">
        {loading && <p>Carregando dados do dashboard...</p>}

        {!loading && pizzaData.length === 0 && (
          <p>Não há dados para exibir com os filtros selecionados.</p>
        )}

        {!loading && pizzaData.length > 0 && (
          <PizzaDashboardChart data={pizzaData} />
        )}
      </section>
    </div>
  );
}