import React, { useState, useEffect } from 'react';

export default function UnidadeComboBox({ value, onChange }) {
    const [unidades, setUnidades] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('http://localhost:5120/v1/unidades-organizacionais')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUnidades(data);
                } else {
                    setUnidades([]);
                }
            })
            .catch(() => setUnidades([]));
    }, []);

    const unidadesSeguras = Array.isArray(unidades) ? unidades : [];

    const selected = unidadesSeguras.find(u => u.unidadeOrganizacionalId === value);
    const displayValue = isOpen ? search : (selected ? selected.nomeFantasia : '');

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'normal' }}>
                Unidade Organizacional
            </label>
            <div className={`zf-combobox ${isOpen ? 'active' : ''}`}>
                <input
                    type="text"
                    className="zf-combobox-input"
                    placeholder="Pesquisar..."
                    value={displayValue}
                    onClick={() => setIsOpen(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    style={{ width: '100%', marginBottom: 0 }}
                />
                <ul className="zf-combobox-list">
                    {unidadesSeguras.filter(u => u.nomeFantasia?.toLowerCase().includes(search.toLowerCase())).map(u => (
                        <li
                            key={u.unidadeOrganizacionalId}
                            className="zf-combobox-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange(u.unidadeOrganizacionalId);
                                setSearch('');
                                setIsOpen(false);
                            }}
                        >
                            <div className="zf-cb-left">
                                <span className="zf-cb-name">{u.nomeFantasia}</span>
                                <span className="zf-cb-cpf">{u.cnpj}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}