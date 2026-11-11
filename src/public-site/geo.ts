import outline from './data/spain-outline.json';
import points from './data/municipal-points.json';
import {family,normalize,type Process} from './catalogue';

import {publicCategory,categoryNeedsReview} from './discovery';
export type GeoPoint=[number,number]; // latitude, longitude; EPSG:4326
export const spainBounds:[GeoPoint,GeoPoint]=[[27.5,-18.35],[43.9,4.5]];
export const spainRings:GeoPoint[][]=outline.geometry.coordinates.map(p=>p[0].map(([lon,lat])=>[lat,lon] as GeoPoint));
export const municipalPoints:Record<string,{lat:number;lon:number;province:string;source:string;municipalityCode:string}>=points;
export function pointFor(p:Process):GeoPoint|null {
 const v=municipalPoints[p.municipality];
 return v&&normalize(v.province)===normalize(p.province)?[v.lat,v.lon]:null;
}
const cross=(a:GeoPoint,b:GeoPoint,c:GeoPoint)=>(b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1]);
function onSegment(p:GeoPoint,a:GeoPoint,b:GeoPoint){return Math.abs(cross(a,b,p))<1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;}
export function validZone(p:GeoPoint[]):boolean {
 if(p.length<3||p.length>80||p.some(v=>v.length!==2||!Number.isFinite(v[0])||!Number.isFinite(v[1])||v[0]<27||v[0]>44.5||v[1]<-19||v[1]>5))return false;
 if(new Set(p.map(v=>v.join(','))).size!==p.length)return false;
 let area=0;for(let i=0;i<p.length;i++)area+=p[i][1]*p[(i+1)%p.length][0]-p[(i+1)%p.length][1]*p[i][0];
 if(Math.abs(area)<1e-8)return false;
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
  if(j===i+1||(i===0&&j===p.length-1))continue;
  const a=p[i],b=p[(i+1)%p.length],c=p[j],d=p[(j+1)%p.length];
  if((cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||onSegment(a,c,d)||onSegment(b,c,d)||onSegment(c,a,b)||onSegment(d,a,b))return false;
 }
 return true;
}
export function encodeZone(p:GeoPoint[]){return p.map(v=>v.map(n=>Number(n.toFixed(5))).join(',')).join(';');}
export function decodeZone(raw:string|null):GeoPoint[]|null {
 if(!raw||raw.length>2600)return null;
 const p=raw.split(';').map(v=>v.split(',').map(Number) as GeoPoint);
 return validZone(p)?p:null;
}
export function insideZone(point:GeoPoint,zone:GeoPoint[]):boolean {
 let inside=false;for(let i=0,j=zone.length-1;i<zone.length;j=i++){
  const a=zone[j],b=zone[i];if(onSegment(point,a,b))return true;
  if((a[0]>point[0])!==(b[0]>point[0])&&point[1]<(b[1]-a[1])*(point[0]-a[0])/(b[0]-a[0])+a[1])inside=!inside;
 }return inside;
}
export function decodeBounds(raw:string|null):[number,number,number,number]|null {
 if(!raw||raw.length>100)return null;const v=raw.split(',').map(Number);
 return v.length===4&&v.every(Number.isFinite)&&v[0]>=-85&&v[2]<=85&&v[0]<v[2]&&v[1]>=-180&&v[3]<=180&&v[1]<v[3]?v as [number,number,number,number]:null;
}
export function geographicResults(source:Process[],zone:GeoPoint[]|null,bounds:ReturnType<typeof decodeBounds>){return source.filter(p=>{
 if(!zone&&!bounds)return true;const v=pointFor(p);if(!v)return false;
 return zone?insideZone(v,zone):v[0]>=bounds![0]&&v[0]<=bounds![2]&&v[1]>=bounds![1]&&v[1]<=bounds![3];
});}
export function processHeading(p:Process){
 const category=publicCategory(p)+(categoryNeedsReview(p)?' (categoría por contrastar)':'');
 const kind=p.processKind==='bolsa'?'Bolsa de empleo':p.type==='oferta'?'Oferta':'Convocatoria';
 const seats=p.processKind==='bolsa'?'':p.seats==null?'':`${p.seats} ${p.seats===1?'plaza':'plazas'} de `;
 return `${kind} de ${seats}${category} en ${p.organism}`;
}
export function bodyTag(p:Process){return family(p)==='auxiliar-administrativo'?'Auxiliar administrativo':'Administrativo';}
export function simplifyTrace(points:GeoPoint[]):GeoPoint[]{
 // Bound URL size, remove repeated vertices. Shape is validated before committing.
 const p=points.filter((v,i)=>!i||v[0]!==points[i-1][0]||v[1]!==points[i-1][1]);
 if(p.length>1&&p[0][0]===p[p.length-1][0]&&p[0][1]===p[p.length-1][1])p.pop();
 const step=Math.max(1,Math.ceil(p.length/72));return p.filter((_,i)=>i%step===0);
}
