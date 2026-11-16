import test from 'node:test';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {productionMode,render,staticRoutes,parseApprovedCatalogue,applyApprovedCatalogue,bodyGuides,bodyGuidePath,metadata} from '../.prerender/prerender.js';
const row={id:'OPO-900001',publicationStatus:'legacy_catalogue',approvedAt:null,approvalVersion:null,verifiedAt:null,organism:'Ayuntamiento de Guadarrama',sector:'Administración local',municipality:'Guadarrama',province:'Madrid',region:'Comunidad de Madrid',issuer:'Ayuntamiento de Guadarrama',category:'Auxiliar Administrativo',type:'convocatoria',state:'por verificar',portal:'https://example.org/bases.pdf',access:'Por verificar',seats:2,published:'2026-11-16',applicationWindow:'Por verificar',exam:null,documents:[{label:'Bases',text:'Bases publicadas',links:['https://example.org/bases.pdf']}],processKind:'plaza',applicationStatus:'unverified'};
applyApprovedCatalogue(parseApprovedCatalogue({schemaVersion:2,revision:'public-release-test',generatedAt:'2026-11-16T09:00:00Z',records:[row],coverage:{totalRecords:1,adminApprovedRecords:0,legacyRecords:1}}));
const paths=['/','/convocatorias','/convocatorias/opo-900001','/localidades','/oposiciones-locales','/superadmin','/alternativas-age','/comparar','/guardadas','/guias','/guias/oferta-o-convocatoria',...bodyGuides.map(bodyGuidePath)];
test('production build has the explicit public release flag',()=>assert.equal(productionMode,true));
for(const path of paths)test('public route has no sandbox copy or simulated collection: '+path,()=>{
 const html=render(path);
 assert.doesNotMatch(html,/\b(?:sandbox|preview|demostraci[oó]n|demo|simulad[oa]s?|BORRADOR)\b/i);
 assert.doesNotMatch(html,/type="email"|Crear alerta|Seguir convocatoria|Configurar mi alerta|Simular solicitud|preview-metricas|href="\/area-alumno"/i);
});
test('review metrics and fake student routes are not deployed as public pages',()=>{assert.ok(!staticRoutes.includes('/preview-metricas'));assert.ok(!staticRoutes.includes('/area-alumno'));assert.match(render('/preview-metricas'),/Página no disponible/);});
test('commercial CTA is a real outbound academy link, not a simulated submission',()=>{const html=render('/superadmin');assert.match(html,/href="https:\/\/www\.superaoposiciones\.es\/"/);assert.doesNotMatch(html,/<form|type="email"/i);});
test('public metadata does not advertise a sample, preview or false 404 for the test record',()=>{const m=metadata('/convocatorias/opo-900001');assert.doesNotMatch(m.title,/no encontrada|preview|demo/i);assert.doesNotMatch(m.description,/muestra|preview|demo/i);assert.doesNotMatch(metadata('/convocatorias').description,/muestra|preview/i);});


for(const endpoint of ['', 'https://unexpected.example/catalogue'])test('public build refuses missing or undeclared endpoint: '+(endpoint||'missing'),()=>{const r=spawnSync(process.execPath,['scripts/build-public.mjs'],{env:{...process.env,VITE_APPROVED_CATALOGUE_URL:endpoint},encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/required|Unexpected public catalogue endpoint/);});
