export default function ExcluirItensSelecionadosModal({ quantidade, onClose, onConfirm }) {
    return (
        <div className="modal-overlay">
            <div className="card modal-card">
                <div className="modal-card-body">
                    <h2 className="modal-title">Excluir Itens</h2>
                    <p className="modal-description">
                        Tem certeza que deseja excluir {quantidade} itens de estoque? Todo o histórico de movimentações também será perdido.
                    </p>
                    <div className="modal-actions">
                        <button type="button" className="button button-outline button-flex" onClick={onClose}>Cancelar</button>
                        <button type="button" className="button button-exit button-flex" onClick={onConfirm}>Excluir</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
