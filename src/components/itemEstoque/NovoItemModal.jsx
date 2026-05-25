import { TIPO_UNIDADE } from '../../constants/tipoUnidade';
import { maskQuantityInput } from '../../utils/quantity';

const getInputClassName = (isError) => `w-full no-field-margin ${isError ? 'is-invalid' : ''}`;

export default function NovoItemModal({
    espacos,
    fieldErrors,
    formData,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <div className="modal-overlay">
            <div className="card modal-card-scroll">
                <div className="modal-card-body">
                    <h2 className="form-modal-title">Novo Item</h2>
                    <form onSubmit={onSubmit} noValidate>
                        <div className="mb-1">
                            <label className={`label-sm ${fieldErrors.Descricao ? 'error' : ''}`}>Descrição do Produto</label>
                            <input type="text" value={formData.descricao} onChange={e => onChange({ ...formData, descricao: e.target.value })} className={getInputClassName(fieldErrors.Descricao)} />
                            {fieldErrors.Descricao && <small className="invalid-feedback d-block">{fieldErrors.Descricao}</small>}
                        </div>

                        <div className="row">
                            <div className="column-6 mb-1">
                                <label className={`label-sm ${fieldErrors.EspacoId ? 'error' : ''}`}>Local (Espaço)</label>
                                <select value={formData.espacoId} onChange={e => onChange({ ...formData, espacoId: e.target.value })} className={getInputClassName(fieldErrors.EspacoId)}>
                                    <option value="" disabled>Selecione...</option>
                                    {espacos.map(e => <option key={e.espacoId} value={e.espacoId}>{e.nome}</option>)}
                                </select>
                                {fieldErrors.EspacoId && <small className="invalid-feedback d-block">{fieldErrors.EspacoId}</small>}
                            </div>
                            <div className="column-6 mb-1">
                                <label className={`label-sm ${fieldErrors.TipoUnidadeMedida ? 'error' : ''}`}>Unidade de Medida</label>
                                <select value={formData.tipoUnidadeMedida} onChange={e => onChange({ ...formData, tipoUnidadeMedida: e.target.value })} className={getInputClassName(fieldErrors.TipoUnidadeMedida)}>
                                    {Object.entries(TIPO_UNIDADE).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                </select>
                                {fieldErrors.TipoUnidadeMedida && <small className="invalid-feedback d-block">{fieldErrors.TipoUnidadeMedida}</small>}
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className={`label-sm ${fieldErrors.Quantidade ? 'error' : ''}`}>Quantidade Inicial</label>
                            <input type="text" inputMode="decimal" value={formData.quantidade} onChange={e => onChange({ ...formData, quantidade: maskQuantityInput(e.target.value) })} className={getInputClassName(fieldErrors.Quantidade)} />
                            {fieldErrors.Quantidade && <small className="invalid-feedback d-block">{fieldErrors.Quantidade}</small>}
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