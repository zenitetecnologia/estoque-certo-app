import { useNavigate } from 'react-router-dom';

export default function InstallIosPage() {
    const navigate = useNavigate();

    return (
        <div className="install-panel">
            <h3 className="install-title">Instale o Estoque Certo</h3>

            <p> <b>Role a tela e siga o tutorial</b> <br />
                Para instalar o aplicativo, <br /> toque nos <b>...</b> </p>

            <img src="/pg1.jpeg" alt="Tutorial de instalação 1" className="install-step-image" />

            <p>e depois em <b>"Compartilhar"</b>.</p>

            <img src="/pg2.jpeg" alt="Tutorial de instalação 2" className="install-step-image" />

            <p>Role a tela para baixo e clique em <b>"Adicionar a tela de início"</b> </p>

            <img src="/pg3.jpeg" alt="Tutorial de instalação 3" className="install-step-image" />

            <p>Depois clique em <b>"Adicionar"</b> </p>

            <img src="/pg4.jpeg" alt="Tutorial de instalação 4" className="install-step-image" />

            <p> assim o aplicativo será adicionado à sua tela de início.</p>

            <img src="/pg5.jpeg" alt="Tutorial de instalação 5" className="install-step-image" />

            <button onClick={() => navigate('/')} className="button install-button">
                Entendi
            </button>
        </div>
    );
}