import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom/server';
import PublicSite from './PublicSite';
export {metadata,staticRoutes,records,processPath,cityPath,group,matches} from './catalogue';
export function render(path: string) { return renderToString(<StaticRouter location={path}><PublicSite/></StaticRouter>); }

export {filterRecords,deadline,isoDate,documentTitle,distanceKm,detailFor,validIds,accessKind,enrichments} from './journey';
