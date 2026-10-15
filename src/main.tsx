import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import PublicSite from './public-site/PublicSite';

const root = document.getElementById('root')!;
const app = <BrowserRouter><PublicSite/></BrowserRouter>;
// Static HTML is generated without query parameters; filtered deep links render afresh.
if (root.children.length && !window.location.search) hydrateRoot(root, app);
else createRoot(root).render(app);
