import {renderToString} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom/server';
import PublicSite from './PublicSite';
export {metadata,staticRoutes,records,processPath,cityPath,group,matches} from './catalogue';
export function render(path: string) { return renderToString(<StaticRouter location={path}><PublicSite/></StaticRouter>); }

export {filterRecords,deadline,isoDate,documentTitle,distanceKm,detailFor,validIds,accessKind,enrichments} from './journey';

export {latestPublications,relatedProcesses,relatedReason} from './review';
export {formatDatesInText,toISO} from './dates';
export {computeDeadline,referenceCalendars,explicitRule} from './calendars';

export {bodyGuides,bodyGuidePath} from './body-guides';
export {territoryNames,territorialRecords} from './TerritoryMap';
export {pointFor,validZone,encodeZone,decodeZone,insideZone,decodeBounds,geographicResults,processHeading,simplifyTrace,municipalPoints,spainBounds,spainRings} from './geo';

export {institutionKind,governmentScope,discoveryResults,publicCategory,categoryNeedsReview} from './discovery';

export {comparisonTrayVisible} from './discovery';
