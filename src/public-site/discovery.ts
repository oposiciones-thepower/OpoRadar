import {normalize,family,familyLabel,type Process} from './catalogue';
export const institutionOptions=[['administracion','Administración'],['universidades','Universidades'],['sanidad','Sanidad'],['cortes','Cortes Generales'],['otros','Otros organismos']] as const;
export const scopeOptions=[['estatal','Estatal'],['autonomico','Autonómico'],['local','Local']] as const;
export function institutionKind(p:Process):string{
 const text=normalize([p.sector,p.organism].join(' '));
 if(/cortes generales|congreso de los diputados|senado/.test(text))return 'cortes';
 if(/universidad|universidades/.test(text))return 'universidades';
 if(/sanidad|hospital|servicio.*salud|sermas/.test(text))return 'sanidad';
 if(/administracion|ayuntamiento|ajuntament|concello|udal|comunidad|diputacion|cabildo|consell|ministerio|generalitat|junta de|parlamento|instituciones autonomicas|^local\b/.test(text))return 'administracion';
 return 'otros';
}
export function governmentScope(p:Process):string|null{
 const text=normalize([p.sector,p.organism,p.issuer].join(' '));
 if(institutionKind(p)==='cortes'||/administracion general del estado|\bage\b|ministerio|instituto nacional de administracion publica/.test(text))return 'estatal';
 if(/administracion local|ayuntamiento|ajuntament|concello|diputacion|cabildo|consell insular|\blocal\b/.test(text))return 'local';
 if(/administracion autonomica|comunidad|instituciones autonomicas|generalitat|junta de|parlamento/.test(text))return 'autonomico';
 return null; // University/health category or a postal address do not establish jurisdiction.
}
export function categoryNeedsReview(p:Process){return /af[ií]n|gestor/i.test(p.category);}
export function publicCategory(p:Process){return familyLabel(family(p));}
export function publicGroup(p:Process){return /\bC[12]\b/i.exec(p.category)?.[0].toUpperCase()??'';}
export function discoveryResults(source:Process[],params:URLSearchParams){return source.filter(p=>(!params.get('organismo')||institutionKind(p)===params.get('organismo'))&&(!params.get('ambito')||governmentScope(p)===params.get('ambito')));}

export function comparisonTrayVisible(pathname:string,count:number){const path=pathname.replace(/\/+$/,'')||'/';return count>0&&path!=='/'&&path!=='/comparar'&&!path.startsWith('/convocatorias/');}
