import { getBaseUrl } from '../utils/apiConfig';

export const getNomeExibicaoUnidade = (unidade) => {
    if (!unidade) return '';
    return unidade.nomeFantasia || unidade.razaoSocial || unidade.nome || 'Unidade sem nome';
};

export const listarUnidadesOrganizacionais = () => (
    fetch(`${getBaseUrl()}/v1/unidades-organizacionais`)
);