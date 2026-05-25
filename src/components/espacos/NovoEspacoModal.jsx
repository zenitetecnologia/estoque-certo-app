export default function NovoEspacoModal({
    fieldErrors,
    formData,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <div className="modal-overlay">
            <div className="card modal-card-wide">
                <div className="modal-card-body">
                    <h2 className="form-modal-title">Novo Espaço</h2>
                    <form onSubmit={onSubmit} noValidate>
                        <div className="mb-1">
                            <label className={`label-sm ${fieldErrors.Nome ? 'error' : ''}`}>Nome do Espaço (Obrigatório)</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={e => onChange({ ...formData, nome: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Nome ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Nome && <small className="invalid-feedback d-block">{fieldErrors.Nome}</small>}
                        </div>
                        <div className="mb-2">
                            <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição (Opcional)</label>
                            <input
                                type="text"
                                value={formData.descricao}
                                onChange={e => onChange({ ...formData, descricao: e.target.value })}
                                className={`w-full no-field-margin ${fieldErrors.Descricao ? 'is-invalid' : ''}`}
                            />
                            {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="button button-outline button-flex" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="button button-flex">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}