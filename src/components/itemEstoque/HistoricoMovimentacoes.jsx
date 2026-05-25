import { formatQuantity } from '../../utils/quantity';
import LoadingWaves from '../LoadingWaves';

export default function HistoricoMovimentacoes({ historico, loading }) {
    if (loading) {
        return <LoadingWaves rows={3} label="Carregando histórico" />;
    }

    if (historico.length === 0) {
        return (
            <div className="card history-empty-card">
                <div className="empty-state-body-compact">
                    <p className="empty-state-text">Nenhuma movimentação registrada.</p>
                </div>
            </div>
        );
    }

    return (
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
    );
}