import { Navigate, Route, Routes } from 'react-router-dom';
import AprovarUnidadeOrganizacionalView from '../components/AprovarEmpresasView';
import EspacoView from '../components/EspacoView';
import ItemEstoqueView from '../components/ItemEstoqueView';
import ValidarUsuariosView from '../components/ValidarUsuariosView';
import EspacoDetailPage from '../pages/espacos/EspacoDetailPage';
import NovoEspacoPage from '../pages/espacos/NovoEspacoPage';
import DashboardPage from '../pages/home/DashboardPage';
import InstallIosPage from '../pages/home/InstallIosPage';
import ProfilePage from '../pages/home/ProfilePage';
import ItemEstoqueDetailPage from '../pages/itemEstoque/ItemEstoqueDetailPage';
import NovoItemEstoquePage from '../pages/itemEstoque/NovoItemEstoquePage';

export default function AuthenticatedRoutes({
    fieldErrors,
    formData,
    hasProfileChanges,
    isAdmin,
    onCancelProfile,
    onChangeProfile,
    onSubmitProfile,
    token,
    unidadeOrganizacionalId,
    usuarioId
}) {
    return (
        <Routes>
            <Route
                index
                element={
                    <DashboardPage
                        token={token}
                        unidadeOrganizacionalId={unidadeOrganizacionalId}
                    />
                }
            />
            <Route
                path="espacos/novo"
                element={<NovoEspacoPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="espacos/:espacoId/itens"
                element={<EspacoDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} mode="itens" />}
            />
            <Route
                path="espacos/:espacoId/itens/novo"
                element={<NovoItemEstoquePage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="espacos/:espacoId/itens/:itemEstoqueId/editar"
                element={<ItemEstoqueDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="espacos/:espacoId/itens/:itemEstoqueId/historico"
                element={<ItemEstoqueDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="espacos/:espacoId/editar"
                element={<EspacoDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} mode="editar" />}
            />
            <Route
                path="espacos"
                element={<EspacoView token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} />}
            />
            <Route
                path="itens-estoque/:itemEstoqueId"
                element={<ItemEstoqueDetailPage token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="itens-estoque"
                element={<ItemEstoqueView token={token} unidadeOrganizacionalId={unidadeOrganizacionalId} usuarioId={usuarioId} />}
            />
            <Route
                path="aprovar-usuarios"
                element={isAdmin ? <ValidarUsuariosView token={token} /> : <Navigate to="/" replace />}
            />
            <Route
                path="aprovar-empresas"
                element={isAdmin ? <AprovarUnidadeOrganizacionalView token={token} /> : <Navigate to="/" replace />}
            />
            <Route path="instalar-ios" element={<InstallIosPage />} />
            <Route
                path="meus-dados"
                element={
                    <ProfilePage
                        fieldErrors={fieldErrors}
                        formData={formData}
                        hasChanges={hasProfileChanges}
                        onCancel={onCancelProfile}
                        onChange={onChangeProfile}
                        onSubmit={onSubmitProfile}
                    />
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}