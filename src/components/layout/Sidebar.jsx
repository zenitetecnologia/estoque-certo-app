import { NavLink } from 'react-router-dom';

const isIOS = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

export default function Sidebar({ isAdmin, onLogoutClick }) {
    const closeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.checked = false;
            menuToggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    return (
        <>
            <div className="sidebar-overlay">
                <label htmlFor="menu-toggle" className="sidebar-backdrop-toggle"></label>
            </div>

            <aside className="sidebar">
                <div className="sidebar-body">
                    <h3 className="sidebar-title">Zênite Tecnologia</h3>
                    <p>Estoque Certo</p>
                    <div className="sidebar-nav">
                        <NavLink to="/" end onClick={closeMenu}>Início</NavLink>
                        <NavLink to="/espacos" onClick={closeMenu}>Espaços</NavLink>
                        <NavLink to="/itens-estoque" onClick={closeMenu}>Itens de Estoque</NavLink>

                        {isAdmin && (
                            <NavLink to="/aprovar-usuarios" onClick={closeMenu}>Aprovar Usuários</NavLink>
                        )}

                        <NavLink
                            to="/instalar-ios"
                            onClick={(event) => {
                                closeMenu();
                                if (!isIOS()) event.preventDefault();
                            }}
                        >
                            Adicionar a tela inicial
                        </NavLink>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <NavLink
                        to="/perfil"
                        onClick={closeMenu}
                        className={({ isActive }) => `link-action text-center d-block mb-1 ${isActive ? 'active' : ''}`}
                    >
                        Alterar Meus Dados
                    </NavLink>

                    <label htmlFor="menu-toggle" className="button button-outline sidebar-close-button">
                        Fechar Menu
                    </label>
                    <button onClick={onLogoutClick} className="button button-danger sidebar-logout-button">
                        Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}