import {family, normalize, records, type Process} from './catalogue';
import {distanceKm} from './journey';
import {toISO} from './dates';

// Dates describe the publication, never an inferred opening of applications.
export function latestPublications(source: Process[] = records, limit = 6): Process[] {
  return source.filter(p => toISO(p.published ?? '')).sort((a,b) =>
    toISO(b.published!)!.localeCompare(toISO(a.published!)!) || a.id.localeCompare(b.id)).slice(0,limit);
}
const borders: string[][] = [
  ['Madrid','Castilla y León','Castilla-La Mancha'],
  ['Andalucía','Extremadura','Castilla-La Mancha','Murcia'],
  ['Galicia','Asturias','Castilla y León'],
  ['Asturias','Cantabria','Castilla y León'],
  ['Cataluña','Aragón','Comunitat Valenciana'],
  ['Navarra','Aragón','País Vasco','La Rioja'],
];
const sameRegion = (a:string,b:string) => normalize(a).replace('comunidad de ','').replace('principado de ','') === normalize(b).replace('comunidad de ','').replace('principado de ','');
function nearbyRegion(a:string,b:string): boolean {
  // Only explicit adjacency pairs; membership in a whole group does not imply adjacency.
  const pairs = borders.flatMap(g => g.slice(1).map(b => [g[0],b]));
  return pairs.some(([x,y]) => sameRegion(a,x)&&sameRegion(b,y) || sameRegion(a,y)&&sameRegion(b,x));
}
export function relatedReason(p:Process, other:Process):string {
  const km=distanceKm(p.municipality,other.municipality);
  if (km!==null) return `Aprox. ${Math.round(km)} km en línea recta`;
  if (p.province===other.province) return 'En la misma provincia';
  if (sameRegion(p.region,other.region)) return 'En la misma comunidad';
  if (nearbyRegion(p.region,other.region)) return 'En una comunidad limítrofe';
  return 'Otra comunidad · distancia no verificada';
}
export function relatedProcesses(p:Process, limit=3, source:Process[]=records):Process[] {
  const rank=(other:Process)=> {
    const km=distanceKm(p.municipality,other.municipality);
    return km!==null&&km<=50?0:p.province===other.province?1:sameRegion(p.region,other.region)?2:nearbyRegion(p.region,other.region)?3:4;
  };
  return source.filter(o => o.id!==p.id && o.municipality!==p.municipality && family(o)===family(p))
    .sort((a,b)=>rank(a)-rank(b) || Number(a.state==='cerrada')-Number(b.state==='cerrada') ||
      (distanceKm(p.municipality,a.municipality)??Infinity)-(distanceKm(p.municipality,b.municipality)??Infinity) ||
      (toISO(b.published??'')??'').localeCompare(toISO(a.published??'')??'') || a.id.localeCompare(b.id)).slice(0,limit);
}
