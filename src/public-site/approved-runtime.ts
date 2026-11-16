import {ApprovedCatalogueClient} from './approved-client';
import {applyApprovedCatalogue} from './catalogue';
const endpoint=import.meta.env.VITE_APPROVED_CATALOGUE_URL||'/api/public/v1/catalogue';
export const approvedClient=new ApprovedCatalogueClient(endpoint,applyApprovedCatalogue);
