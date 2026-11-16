export type PublicationStatus='admin_approved'|'legacy_catalogue';
export type ApplicationStatus='open'|'closed'|'not_open'|'unverified';
export type ApprovedDocument={label:string;text:string;links:string[]};
export type ApprovedRecord={
 id:string;publicationStatus?:PublicationStatus;publicId?:string;title?:string;publicNote?:string;examDate?:string|null;organism:string;sector:string;municipality:string;province:string;region:string;issuer:string;category:string;
 type:string;state:string;portal:string;access:string;seats:number|null;group?:string;published:string|null;applicationWindow:string;exam:string|null;
 documents:ApprovedDocument[];processKind:string;sourceState?:string;applicationStatus:ApplicationStatus;
 applicationStart?:string|null;applicationEnd?:string|null;verifiedAt?:string|null;approvedAt?:string|null;approvalVersion?:string|null;
 coordinates?:{lat:number;lon:number;source?:string}|null;
};
export type ApprovedCatalogue={schemaVersion:1|2;revision:string;generatedAt:string;records:ApprovedRecord[];coverage:Record<string,unknown>};
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const str=(v:unknown,max=6000):v is string=>typeof v==='string'&&v.length<=max;
const iso=(v:unknown)=>{if(v==null)return true;if(!str(v,40)||!/^\d{4}-\d{2}-\d{2}(?:T[^ ]+)?$/.test(v)||!Number.isFinite(Date.parse(v)))return false;return new Date(v.slice(0,10)+'T12:00:00Z').toISOString().slice(0,10)===v.slice(0,10);};
export function publicUrl(value:unknown,empty=true):value is string{
 if(value===''&&empty)return true;if(!str(value,4096))return false;
 try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&!/^(?:localhost|127\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|\[?::1)/i.test(u.hostname)&&!/(?:^|[?&])(?:token|key|access_token|auth|signature)=/i.test(u.search)&&!/(?:docs|drive)\.google\.com$/i.test(u.hostname);}catch{return false;}
}
const fields=['publicationStatus','id','publicId','title','publicNote','examDate','organism','sector','municipality','province','region','issuer','category','type','state','portal','access','seats','group','published','applicationWindow','exam','documents','processKind','sourceState','applicationStatus','applicationStart','applicationEnd','verifiedAt','approvedAt','approvalVersion','coordinates'] as const;
export function parseApprovedCatalogue(input:unknown):ApprovedCatalogue{
 if(!object(input)||![1,2].includes(input.schemaVersion as number)||!str(input.revision,200)||!input.revision||!str(input.generatedAt,40)||!iso(input.generatedAt)||!Array.isArray(input.records)||input.records.length>10000||!object(input.coverage))throw Error('Respuesta del catálogo no válida');
 const ids=new Set<string>();
 const records=input.records.map((raw:unknown)=>{
  if(!object(raw)||!str(raw.id,80)||!/^OPO-[1-9]\d*$/.test(raw.id)||ids.has(raw.id))throw Error('Identidad pública no válida');ids.add(raw.id);
  for(const key of ['organism','sector','municipality','province','region','issuer','category','type','state','portal','access','applicationWindow','processKind'])if(!str(raw[key]))throw Error('Campo público no válido');
  for(const k of ['title','publicNote'])if(raw[k]!=null&&!str(raw[k]))throw Error('Texto público no válido');
  if(!raw.organism||!raw.category||!['oferta','convocatoria'].includes(raw.type as string)||!['abierta','en curso','cerrada','pendiente de convocatoria','por verificar'].includes(raw.state as string))throw Error('Clasificación pública no válida');
  if(raw.seats!==null&&(!Number.isInteger(raw.seats)||(raw.seats as number)<0))throw Error('Plazas no válidas');
  if(!['open','closed','not_open','unverified'].includes(raw.applicationStatus as string)||!iso(raw.published)||!iso(raw.applicationStart)||!iso(raw.applicationEnd)||!iso(raw.verifiedAt)||!iso(raw.approvedAt)||!iso(raw.examDate))throw Error('Estado o fecha no válido');
  if(raw.type==='oferta'&&raw.applicationStatus==='open')throw Error('Una oferta no abre solicitudes');
  if(raw.applicationStatus==='open'&&(!raw.applicationStart||!raw.applicationEnd))throw Error('Plazo abierto sin fechas verificadas');
  const explicit=raw.publicationStatus;
  if(explicit!=null&&!['admin_approved','legacy_catalogue'].includes(explicit as string))throw Error('Procedencia de publicación no válida');
  if(input.schemaVersion===2&&explicit==null)throw Error('Procedencia requerida en catálogo v2');
  const publicationStatus:PublicationStatus=(explicit??(raw.approvedAt&&raw.approvalVersion?'admin_approved':'legacy_catalogue')) as PublicationStatus;
  if(raw.approvalVersion!=null&&(!str(raw.approvalVersion,200)||!raw.approvalVersion))throw Error('Versión de aprobación no válida');
  if(input.schemaVersion===2&&publicationStatus==='admin_approved'&&(!raw.approvedAt||!raw.approvalVersion))throw Error('Aprobación sin metadata acreditada');
  if(publicationStatus==='legacy_catalogue'&&(raw.approvedAt!=null||raw.approvalVersion!=null))throw Error('El legado no acredita aprobación individual');
  if(!publicUrl(raw.portal))throw Error('Portal no público');
  if(!Array.isArray(raw.documents)||raw.documents.length>50)throw Error('Documentos no válidos');
  for(const d of raw.documents)if(!object(d)||!str(d.label,200)||!str(d.text)||!Array.isArray(d.links)||d.links.length>150||!d.links.every(v=>publicUrl(v,false)))throw Error('Enlace documental no válido');
  if(raw.coordinates!=null){const c=raw.coordinates;if(!object(c)||typeof c.lat!=='number'||typeof c.lon!=='number'||c.lat<27||c.lat>44.5||c.lon< -19||c.lon>5||!Number.isFinite(c.lat)||!Number.isFinite(c.lon))throw Error('Coordenadas no válidas');}
  // An explicit public allowlist: no source rows, internal URLs, review notes, users or job payloads.
  return {...Object.fromEntries(fields.filter(k=>k in raw).map(k=>[k,raw[k]])),publicationStatus} as ApprovedRecord;
 });
 if(input.schemaVersion===2){
  const actual=records.filter(p=>p.publicationStatus==='admin_approved').length;
  for(const [key,value] of [['totalRecords',records.length],['adminApprovedRecords',actual],['legacyRecords',records.length-actual]] as const){
   if(input.coverage[key]!==value)throw Error('Conteos de publicación no coherentes');
  }
 }
 return {schemaVersion:input.schemaVersion as 1|2,revision:input.revision,generatedAt:input.generatedAt,records,coverage:input.coverage};
}

export function publicationLabel(p:{publicationStatus?:PublicationStatus;approvedAt?:string|null;approvalVersion?:string|null}):string{
 const status=p.publicationStatus??(p.approvedAt&&p.approvalVersion?'admin_approved':'legacy_catalogue');
 return status==='legacy_catalogue'?'Catálogo histórico · sin aprobación individual registrada':'Aprobada en el admin · '+(p.approvedAt?.slice(0,10)||'Fecha no acreditada');
}
