import sample from './data/catalogue.json';
import fromDb from './data/catalogue.db.json';

// VITE_CATALOGUE=db usa el export de la BD de OpoRadar (scripts/export-db-catalogue.mjs); por defecto, la muestra revisada de 30 fichas.
const snapshot = (import.meta.env.VITE_CATALOGUE === 'db' ? fromDb : sample) as typeof sample;

export const records = snapshot.records;
export const snapshotLabel = snapshot.snapshot.split('-').reverse().join('/');
export type Process = typeof records[number];
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const slug = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const family = (process: Process) => normalize(process.category).includes('auxiliar') ? 'auxiliar-administrativo' : 'administrativo';
export const familyLabel = (value: string) => !value ? 'Administrativo y Auxiliar' : value === 'auxiliar-administrativo' ? 'Auxiliar administrativo' : 'Administrativo';
export const processPath = (process: Process) => `/convocatorias/${slug(process.municipality)}-${family(process)}-${process.id.toLowerCase()}`;
export const regionSlug = (region: string) => region === 'Comunidad de Madrid' ? 'madrid' : region === 'Principado de Asturias' ? 'asturias' : slug(region);
export const regionPath = (region: string) => `/oposiciones/${regionSlug(region)}`;
export const regions = [...new Set(records.map(p => p.region))].sort((a,b) => a.localeCompare(b,'es'));
export const provinces = [...new Set(records.map(p => p.province))].sort((a,b) => a.localeCompare(b,'es'));
export const cityRegion = (city: string) => records.find(p => p.municipality === city)?.region ?? '';
export const cityPath = (city: string, body?: string) => `${regionPath(cityRegion(city))}/${slug(city)}${body ? '/' + body : ''}`;
export const municipalities = [...new Set(records.map(process => process.municipality))].sort((a, b) => a.localeCompare(b, 'es'));
export const group = (seats: number | null) => seats == null || seats < 1 ? 'sin-dato' : seats <= 5 ? '1' : seats < 20 ? '2' : '3';
export const stateLabel = (state: string) => ({ 'por verificar': 'Por verificar', 'en curso': 'En curso', 'cerrada': 'Cerrada', 'abierta': 'Abierta', 'pendiente de convocatoria': 'Pendiente de convocatoria' }[state] ?? state);
export function matches(process: Process, query: string) {
  const haystack = normalize([process.category, process.municipality, process.province, process.region, process.organism, process.id].join(' '));
  return normalize(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

export const guides = [
  { slug: 'oferta-o-convocatoria', label: 'EMPIEZA POR AQUÍ', title: 'Oferta y convocatoria no son lo mismo', excerpt: 'Qué mirar para saber si puedes presentar tu solicitud o todavía debes esperar.', minutes: '4 min', icon: 'layers', sections: [
    { title: 'Primero, identifica qué se ha publicado', text: 'Una oferta de empleo y una convocatoria son pasos diferentes. Que aparezcan plazas en un boletín no significa que ya se haya abierto la inscripción. Busca el tipo de publicación, el organismo, la categoría y el turno antes de tomar una decisión.' },
    { title: 'Después, ve a la fuente del organismo', text: 'Abre la ficha de empleo público o la sede del ayuntamiento. Ahí debes localizar las bases, el programa oficial y las instrucciones de solicitud del proceso concreto. Un anuncio del boletín puede ayudarte a encontrarlo, pero no sustituye el seguimiento de esa ficha.' },
    { title: 'Separa plazo y fase del proceso', text: 'El cierre del plazo de solicitudes no implica que la oposición haya terminado. Después pueden llegar listas, subsanaciones, ejercicios y resultados. Si una fecha o documento no está localizado, trátalo como pendiente de verificar, no como inexistente.' },
  ] },
  { slug: 'leer-bases-oposicion-local', label: 'GUÍA PRÁCTICA', title: 'Cómo leer las bases sin perderte', excerpt: 'Una checklist para entender requisitos, pruebas y programa antes de empezar.', minutes: '5 min', icon: 'file', sections: [
    { title: 'Confirma que es tu proceso', text: 'Comprueba organismo, cuerpo, turno e identificador de la convocatoria. Un mismo municipio puede tener varios procesos, y una actualización no siempre es una convocatoria nueva. Revisa también si hay rectificaciones que afecten al documento inicial.' },
    { title: 'Haz una checklist con las bases delante', text: 'Anota requisitos, forma de inscripción, plazo, tasas, fases, tipo de ejercicios y programa oficial. No des por hecho que los requisitos o el examen son iguales a los de otro ayuntamiento. Si algo no está claro, utiliza la información de contacto del organismo convocante.' },
    { title: 'Guarda la fuente, no solo un resumen', text: 'Conserva el enlace de la ficha oficial y los documentos de tu proceso. Un resumen puede orientar, pero las bases y sus rectificaciones son las referencias para comprobar los detalles. Antes de preparar material específico, coteja el programa oficial.' },
  ] },
  { slug: 'age-y-oposiciones-locales', label: 'TU ESTRATEGIA', title: 'La AGE no tiene por qué ser tu única opción', excerpt: 'Cómo explorar alternativas locales sin confundir programas ni requisitos.', minutes: '4 min', icon: 'map', sections: [
    { title: 'Amplía el mapa de opciones', text: 'Si estás preparando la AGE, también puedes explorar procesos de Administrativo y Auxiliar en otras administraciones. Filtrar por localidad te permite conocer alternativas que quizá no estabas siguiendo. Encontrar una opción no significa que cumplas automáticamente sus requisitos.' },
    { title: 'Compara antes de reutilizar', text: 'Confronta el programa oficial y el tipo de prueba con lo que ya estudias. Puede haber materias comunes, pero no se debe asumir que todo el contenido sirve para cualquier convocatoria. Distingue lo reutilizable de los temas específicos y comprueba su vigencia.' },
    { title: 'Elige tu siguiente paso con Superadmin', text: 'Superadmin plantea combinar la preparación estatal con opciones locales. Al elegir una convocatoria concreta puedes solicitar una revisión de cobertura para identificar qué necesitas preparar. Consulta disponibilidad, condiciones y plazos antes de contratar; explorar una ficha no activa por sí solo la creación de material.' },
  ] },
];

export function metadata(pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  const process = records.find(record => processPath(record) === path);
  if (process) return { title: `${process.category} · ${process.municipality} | OpoRadar`, description: `Ficha ${process.id}: plazas, bases, programa oficial y seguimiento de ${process.organism}. Muestra local del registro; consulta la fuente oficial.` };
  const guide = guides.find(article => `/guias/${article.slug}` === path);
  if (guide) return { title: `${guide.title} | OpoRadar`, description: guide.excerpt };
  if (path.startsWith('/oposiciones/')) {
    const parts = path.split('/');
    const region = regions.find(r => regionSlug(r) === parts[2]);
    if (region && parts.length === 3) return {title:`Oposiciones administrativas en ${region} | OpoRadar`,description:`Muestra de procesos de ${region}: plazas, bases y seguimiento con fuentes oficiales.`};
    const city = municipalities.find(name => slug(name) === parts[3] && cityRegion(name) === region);
    if (city && (!parts[4] || ['administrativo','auxiliar-administrativo'].includes(parts[4])) && parts.length <= 5) return { title: `${parts[4] ? familyLabel(parts[4]) : 'Oposiciones administrativas'} en ${city} | OpoRadar`, description: `Consulta la muestra de procesos de ${city}: bases, programa oficial, estado y documentos. Datos pendientes señalados, sin inventar plazos.` };
  }
  const pages: Record<string, [string, string]> = {
    '/': ['Oposiciones administrativas cerca de ti | OpoRadar', 'Explora convocatorias locales, entiende las bases y encuentra alternativas para preparar tu oposición. Vista local de OpoRadar.'],
    '/convocatorias': ['Buscador de convocatorias administrativas | OpoRadar', 'Busca procesos por municipio, categoría, estado y grupo de plazas. Muestra del registro con fuentes oficiales.'],
    '/localidades': ['Oposiciones por localidad | OpoRadar', 'Explora fichas por comunidad autónoma, provincia, municipio y cuerpo, con fuentes oficiales.'],
    '/oposiciones/madrid': ['Oposiciones administrativas en Madrid | OpoRadar', 'Consulta la muestra de Administrativo y Auxiliar en municipios de Madrid.'],
    '/guias': ['Guías para opositar en local | OpoRadar', 'Entiende las convocatorias, lee las bases y explora alternativas locales a la AGE.'],
    '/superadmin': ['Una preparación, más opciones: Superadmin | OpoRadar', 'Explora la propuesta de Superadmin: AGE y alternativas locales, con material específico bajo demanda.'],
    '/comparar': ['Comparar convocatorias locales | OpoRadar', 'Compara acceso, plazas, requisitos, pruebas y fuentes de hasta tres convocatorias.'],
    '/alternativas-age': ['De AGE a opciones locales | OpoRadar', 'Explora programas locales y comprueba qué necesitas contrastar con tu preparación AGE.'],
    '/preview-metricas': ['Métricas de demostración local | OpoRadar', 'Contadores de interacción, sin leads reales ni datos personales.'],
    '/guardadas': ['Mis fichas guardadas | OpoRadar', 'Fichas guardadas solo en este navegador.'],
    '/area-alumno': ['Área de alumno | OpoRadar', 'El área privada se conserva separada de esta preview pública local.'],
  };
  const value = pages[path];
  return value ? {title:value[0],description:value[1]} : {title:'Página no encontrada | OpoRadar',description:'Esta página no forma parte de la preview local.'};
}

export const staticRoutes = ['/', '/convocatorias', '/localidades', ...regions.map(regionPath), '/guias', '/superadmin', '/guardadas', '/area-alumno', '/comparar', '/alternativas-age', '/preview-metricas', ...guides.map(guide => `/guias/${guide.slug}`), ...records.map(processPath), ...municipalities.flatMap(city => [cityPath(city), ...new Set(records.filter(record => record.municipality === city).map(family))].map((value, index) => index ? cityPath(city, value) : value))];
