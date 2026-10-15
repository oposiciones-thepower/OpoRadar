// Exporta el catálogo público desde la BD de OpoRadar (schema oporadar) a src/public-site/data/catalogue.db.json.
// Solo lectura. Requiere OPORADAR_DATABASE_URI en el entorno (p. ej. node --env-file=<ruta>/.env ...).
// Las fichas de la muestra revisada (catalogue.json) prevalecen sobre la BD: conservan sus correcciones de QA.
import {readFile, writeFile} from 'node:fs/promises';
import pg from 'pg';

const uri = process.env.OPORADAR_DATABASE_URI;
if (!uri) throw new Error('Falta OPORADAR_DATABASE_URI en el entorno');

pg.types.setTypeParser(1082, value => value); // DATE como 'YYYY-MM-DD', sin conversión de zona horaria

const SHEET = 'https://docs.google.com/spreadsheets/d/1axaqvwsFcWar8fG8Yi3-786VtmZeBm7ickTGJSpcEAY/edit';
const PENDING = 'Pendiente de localizar';
const DOCUMENTS = [
  ['Temario oficial', 'temario'],
  ['Bases', 'bases'],
  ['Ficha municipal', 'ficha_municipal'],
  ['Convocatoria', 'convocatoria_enlace'],
  ['Oferta', 'oferta_enlace'],
  ['Listas provisionales', 'listas_provisionales'],
  ['Listas definitivas', 'listas_definitivas'],
  ['Publicaciones y actualizaciones', 'publicaciones_actualizaciones'],
  ['Fecha de examen', 'fecha_examen'],
  ['Plantillas', 'plantillas_provisionales'],
  ['Aprobados', 'relacion_aprobados'],
  ['Resoluciones', 'resoluciones'],
];
const COLUMNS = ['organismo', 'sector', 'municipio', 'provincia', 'ccaa', 'convocante', 'cuerpo_categoria', 'tipo_registro', 'estado',
  'portal_fuente_principal', 'acceso', 'plazas_num', 'grupo_por_plazas', 'fecha_publicacion_convocatoria', 'plazo_solicitud', 'observaciones',
  ...DOCUMENTS.map(([, column]) => column)];

const text = value => (value ?? '').toString().trim();
const urls = value => [...new Set(text(value).match(/https?:\/\/[^\s"'<>]+/g) ?? [])];
const isUrl = value => /^https?:\/\//.test(text(value));
const esDate = iso => iso ? iso.split('-').reverse().join('/') : '';

function processKind(row) {
  if (text(row.tipo_registro) === 'oferta') return 'oferta';
  return /\bbolsa\b/i.test(`${row.cuerpo_categoria} ${row.acceso}`) ? 'bolsa' : 'plaza';
}

function toRecord(row, index, sheet, gid) {
  const documents = DOCUMENTS.map(([label, column]) => ({label, links: urls(row[column]), text: text(row[column]) || PENDING}));
  const portal = isUrl(row.portal_fuente_principal) ? text(row.portal_fuente_principal) : documents.flatMap(doc => doc.links)[0] ?? '';
  return {
    id: row.ide,
    organism: text(row.organismo),
    sector: text(row.sector),
    // Ámbito supramunicipal (comunidad, diputación, Estado): se agrupa bajo el organismo convocante.
    municipality: text(row.municipio) || text(row.organismo),
    province: text(row.provincia),
    region: text(row.ccaa),
    issuer: text(row.convocante) || text(row.organismo),
    category: text(row.cuerpo_categoria),
    type: text(row.tipo_registro) || 'convocatoria',
    state: text(row.estado) || 'por verificar',
    portal,
    access: text(row.acceso) || PENDING,
    seats: row.plazas_num ?? null,
    group: text(row.grupo_por_plazas) || 'Sin dato verificado',
    published: esDate(row.fecha_publicacion_convocatoria),
    applicationWindow: text(row.plazo_solicitud) || PENDING,
    exam: text(row.fecha_examen) || PENDING,
    sourceRow: index + 2,
    documents,
    sourceSheet: sheet,
    sourceUrl: `${SHEET}?gid=${gid}`,
    publicNote: '',
    processKind: processKind(row),
    sourceState: text(row.estado) || 'por verificar',
  };
}

const client = new pg.Client({connectionString: uri});
await client.connect();
let registro, hallazgos;
try {
  await client.query('BEGIN READ ONLY');
  registro = (await client.query(`select ide, ${COLUMNS.join(', ')} from oporadar.registro_unico order by id`)).rows;
  hallazgos = (await client.query(`select id_hallazgo as ide, ${COLUMNS.join(', ')} from oporadar.hallazgos_boletines
    where coalesce(resultado_revision, '') not in ('excluida', 'duplicado') order by id`)).rows;
  await client.query('COMMIT');
} finally {
  await client.end();
}

const fromDb = [
  ...registro.map((row, i) => toRecord(row, i, 'Registro único', 100030)),
  ...hallazgos.map((row, i) => toRecord(row, i, 'Hallazgos boletines', 100024)),
].filter(record => record.id && record.category && record.region);

const sample = JSON.parse(await readFile('src/public-site/data/catalogue.json', 'utf8'));
const curated = new Map(sample.records.map(record => [record.id, record]));
const merged = [...curated.values(), ...fromDb.filter(record => !curated.has(record.id))];
const ids = new Set();
const records = merged.filter(record => !ids.has(record.id) && ids.add(record.id));

const output = {
  snapshot: new Date().toISOString().slice(0, 10),
  source: 'oporadar.registro_unico + oporadar.hallazgos_boletines',
  sampleOnly: false,
  records,
};
await writeFile('src/public-site/data/catalogue.db.json', JSON.stringify(output, null, 1) + '\n');

const withLinks = records.filter(record => record.documents.some(doc => doc.links.length)).length;
console.log(`Catálogo BD: ${records.length} fichas (${registro.length} registro único, ${hallazgos.length} hallazgos, ${curated.size} de la muestra revisada). ` +
  `Con algún enlace a documento: ${withLinks}. Sin portal: ${records.filter(record => !record.portal).length}.`);
