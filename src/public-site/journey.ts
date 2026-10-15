import {records, family, group, matches, normalize, type Process} from './catalogue';
export const importedAt='2026-10-13';
export type FactEvidence={value:string;url:string;section:string;checkedAt:string};
export type Enrichment={qualification?:FactEvidence; qualificationKey?:string; tests?:FactEvidence; testKeys?:string[]; fees?:FactEvidence; eligibility?:FactEvidence; blocks?:{title:string;text:string}[]; syllabus?:FactEvidence; caveat?:string};
const algete1='https://aytoalgete.es/images/RRHH/DECRETO_2026-1531_Aprobacin_bases_PI_C2-C1.pdf';
const algete2='https://aytoalgete.es/images/RRHH/DECRETO_2026-1612_aprob_bases.pdf';
const daganzo='https://www.ayto-daganzo.org/media/8173/bases-de-convocatoria_plaza-de-auxiliar-administrativo-laboral-fijo-por-relevo.pdf';
const alcorcon='https://www.ayto-alcorcon.es/sites/default/files/2024-10/04.%20ANEXOS%20CONVOCATORIA%2011%20INFORMADOR%20TRAMITADOR%20TL%2024.pdf';
const evidence=(value:string,url:string,section:string):FactEvidence=>({value,url,section,checkedAt:importedAt});
export const enrichments:Record<string,Enrichment>={
 'L-006':{
 qualification:evidence('Bachiller, Técnico de grado medio o equivalencia oficial.',algete1+'#page=10','Base 3.4'),qualificationKey:'bachiller',
 tests:evidence('Concurso-oposición: test de 60 preguntas (60 min) y supuesto práctico tipo test (60 min). Oposición: 60 puntos; méritos: 40.',algete1+'#page=10','Bases 4.1–4.3'),testKeys:['test','practico','meritos'],
 eligibility:evidence('Promoción interna e interna cruzada. Requiere vinculación y condiciones específicas con el Ayuntamiento de Algete; no es turno libre.',algete1,'Bases 3 y 4'),
 syllabus:evidence('Programa transversal del anexo I.',algete1+'#page=17','Anexo I'),
 blocks:[{title:'Estado y procedimiento',text:'Constitución, organización del Estado, actos, procedimiento y recursos administrativos.'},{title:'Administración municipal',text:'Municipio, órganos, servicios y empleo público.'},{title:'Hacienda local',text:'Ingresos, tributos y gestión tributaria municipal.'}],
 caveat:'El anexo repite el número 24. No usamos la numeración final para calcular el total de temas. Comprueba posibles rectificaciones en la ficha municipal.'
 },
 'L-007':{
 qualification:evidence('Graduado Escolar, FP de primer grado o título equivalente, según estas bases.',algete2+'#page=9','Base 3.3'),qualificationKey:'eso',
 tests:evidence('Concurso-oposición: test de 50 preguntas (60 min) y supuesto práctico en ordenador (60 min). Oposición: 60 puntos; méritos: 40.',algete2+'#page=10','Bases 4.2 y 4.3'),testKeys:['test','practico','informatica','meritos'],
 eligibility:evidence('Personal laboral fijo del Ayuntamiento de Algete en categorías AP o equivalentes, con plaza en propiedad y al menos dos años de servicios efectivos. Consulta todos los requisitos.',algete2+'#page=9','Base 3.2'),
 syllabus:evidence('Programa del anexo II, incluida ofimática y gestión municipal.',algete2+'#page=16','Anexo II'),
 blocks:[{title:'Derecho y tramitación',text:'Constitución, procedimiento, registro, archivo y atención al ciudadano.'},{title:'Entorno municipal',text:'Organización y servicios municipales, empleo público y gestión de personal.'},{title:'Informática',text:'Word, Excel, Outlook y herramientas de colaboración de Microsoft 365.'}],
 caveat:'El anexo salta del tema 21 al 23. No inferimos el número total de temas ni corregimos el documento oficial.'
 },
 'P-038':{
 qualification:evidence('ESO o equivalente.',daganzo+'#page=1','Cabecera y base 3'),qualificationKey:'eso',
 fees:evidence('30 € según las bases de este proceso histórico. No implica que proceda pagar ahora.',daganzo+'#page=1','Cabecera de convocatoria'),
 tests:evidence('Las bases enumeran test, desarrollo escrito y supuesto práctico, además de méritos. Existe una inconsistencia interna sobre el número de ejercicios: consulta las rectificaciones.',daganzo+'#page=6','Base 7'),testKeys:['test','desarrollo','practico','meritos'],
 syllabus:evidence('Programa con parte general y parte especial.',daganzo+'#page=18','Programa'),
 blocks:[{title:'Parte general',text:'Constitución, organización institucional y fundamentos del derecho administrativo.'},{title:'Parte especial',text:'Competencias municipales, procedimiento, contratación, empleo público y hacienda local.'}],
 caveat:'Ficha cerrada en el registro. Contrato de relevo: comprueba los requisitos laborales específicos de la base 3; la titulación no basta para determinar el acceso.'
 },
 'L-005':{syllabus:evidence('20 temas en el programa publicado. No se han contrastado aquí todas las rectificaciones.',alcorcon+'#page=1','Anexo I, páginas 1–2'),blocks:[{title:'Marco administrativo',text:'Constitución, empleo público, procedimiento, igualdad, protección de datos y transparencia.'},{title:'Alcorcón y atención ciudadana',text:'Organización del ayuntamiento, centros municipales, padrón, registro y atención al ciudadano.'},{title:'Ofimática',text:'Navegación, correo electrónico, Word y Excel de Microsoft 365.'}]}
};
export const detailFor=(p:Process)=>enrichments[p.id]??{};
export const accessKind=(p:Process)=>normalize(p.access).includes('promocion interna')?'interna':normalize(p.access).includes('libre')?'libre':'pendiente';
export const sourceFor=(p:Process,label:string)=>p.documents.find(d=>d.label===label)?.links[0]??p.portal;
export const applicationText=(p:Process)=>p.applicationWindow.split('\n')[0];
export function isoDate(raw:string):string|null {const m=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;const iso=`${m[3]}-${m[2]}-${m[1]}`;const date=new Date(iso+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:null;}
export function deadline(p:Process):string|null {const first=applicationText(p);const m=first.match(/(?:—|–|hasta)\s*(\d{2}\/\d{2}\/\d{4})\s*$/i);return m?isoDate(m[1]):null;}
export const formatDate=(iso:string)=>iso.split('-').reverse().join('/');
export function deadlineLabel(p:Process){if(p.type==='oferta')return 'Oferta · todavía sin plazo de solicitud';const end=deadline(p);return end?`Fin registrado: ${formatDate(end)}${end<importedAt?' · pasado':''}`:'Cierre por verificar';}
export const cityCoordinates:Record<string,{lat:number;lon:number;source:string}>={
 'Alcorcón':{lat:40.3493217,lon:-3.8284487,source:'https://es.wikipedia.org/wiki/Alcorc%C3%B3n'},
 'Algete':{lat:40.5977778,lon:-3.5002778,source:'https://es.wikipedia.org/wiki/Algete'},
 'Arganda del Rey':{lat:40.2994444,lon:-3.4408333,source:'https://es.wikipedia.org/wiki/Arganda_del_Rey'},
 'Boadilla del Monte':{lat:40.4069444,lon:-3.875,source:'https://es.wikipedia.org/wiki/Boadilla_del_Monte'},
 'Ciempozuelos':{lat:40.1591667,lon:-3.6180556,source:'https://es.wikipedia.org/wiki/Ciempozuelos'},
 'Daganzo de Arriba':{lat:40.5433333,lon:-3.4572222,source:'https://es.wikipedia.org/wiki/Daganzo_de_Arriba'}
};
export function distanceKm(from:string,to:string){const a=cityCoordinates[from],b=cityCoordinates[to];if(!a||!b)return null;const rad=(n:number)=>n*Math.PI/180;const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function filterRecords(params:URLSearchParams,source:Process[]=records){
 const get=(key:string)=>params.get(key)??''; const city=get('municipio');const radius=Number(get('radio')); const phase=get('fase');
 const results=source.filter(p=>{
  const d=detailFor(p);const dist=city?distanceKm(city,p.municipality):null;
  return matches(p,get('q'))&&(!get('cuerpo')||family(p)===get('cuerpo'))&&(!get('ccaa')||p.region===get('ccaa'))&&(!get('provincia')||p.province===get('provincia'))&&(!city||p.municipality===city||(radius>0&&dist!==null&&dist<=radius))&&(!get('estado')||p.state===get('estado'))&&(!get('grupo')||group(p.seats)===get('grupo'))&&(!get('tipo')||p.type===get('tipo'))&&(!get('acceso')||accessKind(p)===get('acceso'))&&(!get('titulacion')||(get('titulacion')==='pendiente'?!d.qualification:d.qualificationKey===get('titulacion')))&&(!get('prueba')||(get('prueba')==='pendiente'?!d.tests:d.testKeys?.includes(get('prueba'))))&&(!phase||(phase==='historico'?p.state==='cerrada':phase==='pendiente'?p.type==='oferta'||p.state==='pendiente de convocatoria':phase==='abierto'?p.state==='abierta'&&(!deadline(p)||deadline(p)!>=importedAt):phase==='verificar'?p.state==='por verificar':p.state==='en curso'));
 });
 const sort=get('orden');return [...results].sort((a,b)=>{if(sort==='cierre'){const da=deadline(a),db=deadline(b);const bucket=(d:string|null)=>!d?2:d<importedAt?1:0;return bucket(da)-bucket(db)||(da&&db?da.localeCompare(db):0);}if(sort==='plazas')return (b.seats??-1)-(a.seats??-1);if(sort==='cercania'&&city)return (distanceKm(city,a.municipality)??Infinity)-(distanceKm(city,b.municipality)??Infinity);return (isoDate(b.published??'')??'').localeCompare(isoDate(a.published??'')??'');});
}
export function documentTitle(url:string,label:string){try{const u=new URL(url);const filename=decodeURIComponent(u.pathname.split('/').pop()??'');if(/\.pdf$/i.test(filename)){const clean=filename.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();if(/^BOE-|^BOCM-/i.test(filename))return `${label} · ${filename.replace(/\.pdf$/i,'')}`;return clean.charAt(0).toUpperCase()+clean.slice(1);}if(label==='Ficha municipal')return 'Ficha del proceso en el organismo';return `${label} · página del organismo (${u.hostname.replace(/^www\./,'')})`;}catch{return label+' · fuente del registro';}}
export const cityNotes:Record<string,string>={
 'Rivas-Vaciamadrid':'Dos fichas de oferta de empleo público: 5 plazas de Administrativo C1 y 7 de Auxiliar C2. Son 12 plazas en total, separadas por categoría. En esta muestra aún no hay convocatoria identificada ni plazo de solicitud.',
 'Torrelodones':'La muestra recoge 2 plazas de Auxiliar C2 de turno libre, con bases, programa y publicaciones de los ejercicios. El estado figura por verificar: una propuesta de nombramiento no equivale a un nombramiento definitivo.',
 'Paracuellos de Jarama':'La convocatoria de Administrativo C1 se amplió de 2 a 6 plazas: las 2 iniciales ya están incluidas. El plazo registrado terminó el 28/07/2026 y consta una lista provisional de octubre; no se presenta como inscripción abierta.',
 'Alcorcón':'La muestra distingue 20 plazas de Administrativo por promoción interna y 11 de Auxiliar (Informador/a-tramitador/a) por turno libre. Son procesos diferentes: no compartas sus listas, bases ni fechas.',
 'Algete':'Las dos fichas de esta muestra son de promoción interna: 4 plazas de Administrativo y 5 de Auxiliar. No son una alternativa de acceso libre por el mero hecho de preparar AGE.',
 'Arganda del Rey':'La ficha de 16 plazas de Administrativo está marcada como promoción interna. El plazo registrado terminó el 11/03/2026; la noticia municipal de apertura no acredita que siga abierto.',
 'Boadilla del Monte':'La referencia remite a un puesto de Gestor Administrativo. La categoría, el acceso y las plazas necesitan contraste: esta ficha no se presenta como una oposición libre confirmada.',
 'Ciempozuelos':'La muestra recoge 2 plazas de Auxiliar por promoción interna y una referencia municipal de lista definitiva, tribunal y examen. La fecha registrada es 27/10/2026; comprueba posibles cambios.',
 'Daganzo de Arriba':'La ficha corresponde a una plaza de Auxiliar laboral fijo mediante contrato de relevo, cerrada en el registro. Sirve como histórico, no como invitación a inscribirte ahora.'
};
export const validIds=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'&&records.some(p=>p.id===id)))]:[];
