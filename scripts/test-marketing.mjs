import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {render,staticRoutes,records,processPath,cityPath,group,matches,metadata} from '../.prerender/prerender.js';
test('seat boundaries and unknown data',()=>{assert.deepEqual([null,0,1,5,6,19,20].map(group),['sin-dato','sin-dato','1','1','2','2','3']);});
test('IDs, source provenance and unknown states preserved',()=>{assert.equal(records.length,30);assert.equal(new Set(records.map(p=>p.id)).size,30);const boadilla=records.find(p=>p.id==='L-013');assert.equal(boadilla.seats,null);assert.equal(boadilla.state,'por verificar');assert.equal(boadilla.sourceRow,51);assert.ok(records.every(p=>p.portal.startsWith('https://')));});
test('accent-insensitive search and distinct access categories',()=>{assert.ok(matches(records.find(p=>p.id==='L-005'),'auxiliar alcorcon'));assert.equal(matches(records.find(p=>p.id==='L-005'),'administrativo algete'),false);assert.equal(cityPath('Alcorcón'),'/oposiciones/madrid/alcorcon');});
test('prerendered pages contain headings, sources and their own metadata',async()=>{for(const path of new Set(staticRoutes)){const file='dist'+(path==='/'?'':path)+'/index.html';const html=await readFile(file,'utf8');assert.equal((html.match(/<h1\b/g)||[]).length,1,path);assert.ok(html.includes('noindex,nofollow'));assert.ok(html.includes(metadata(path).title.replaceAll('&','&amp;')),path);assert.ok(html.includes('href="https://www.oporadar.es'+path+'"'),path);assert.ok(!html.includes('OpoReview'),path);}});
test('each process has real official source links, no login barrier',()=>{for(const p of records){const html=render(processPath(p));assert.ok(html.includes(p.portal.replaceAll('&','&amp;')),p.id);assert.ok(html.includes('Documentos y seguimiento'));assert.ok(html.includes('No localizada')||html.includes('Fecha de examen'));assert.ok(!html.includes('pago_tazas_pdf'));}});
test('unknown route is a useful 404 and preview cannot be indexed',async()=>{assert.ok(render('/no-existe').includes('Esta página no está en la muestra'));assert.ok((await readFile('dist/robots.txt','utf8')).includes('Disallow: /'));});

const {filterRecords,deadline,isoDate,documentTitle,distanceKm,detailFor,validIds,accessKind,enrichments}=await import('../.prerender/prerender.js');
test('dates reject invalid calendars and do not parse publication dates as deadlines',()=>{
 assert.equal(isoDate('31/02/2026'),null);assert.equal(isoDate('29/02/2024'),'2024-02-29');assert.equal(isoDate('2026-10-13'),null);
 assert.equal(deadline(records.find(p=>p.id==='L-005')),'2025-06-19');assert.equal(deadline(records.find(p=>p.id==='L-007')),'2026-08-07');assert.equal(deadline(records.find(p=>p.id==='L-006')),null);
});
test('facets use evidence and retain unknown values, not inferred eligibility',()=>{
 const select=query=>filterRecords(new URLSearchParams(query+'&ccaa=Comunidad+de+Madrid')).map(p=>p.id).sort();
 assert.deepEqual(select('prueba=informatica'),['L-007']);assert.deepEqual(select('titulacion=bachiller'),['L-006']);assert.equal(select('titulacion=pendiente').length,9);
 assert.deepEqual(select('acceso=libre'),['BOL-0178','BOL-0178-D02','BOL-0179','BOL-0183','L-005','P-038']);assert.equal(select('acceso=interna').length,5);assert.deepEqual(select('fase=historico'),['P-038']);assert.deepEqual(select('fase=abierto'),[]);
 assert.equal(accessKind(records.find(p=>p.id==='L-013')),'pendiente');
});
test('nearby filtering uses verified coordinates without location tracking',()=>{
 assert.equal(distanceKm('Algete','Algete'),0);assert.equal(distanceKm('Unknown','Algete'),null);assert.ok(distanceKm('Algete','Daganzo de Arriba')<10);
 const results=filterRecords(new URLSearchParams('municipio=Algete&radio=10'));assert.deepEqual(results.map(p=>p.id).sort(),['L-006','L-007','P-038']);
 assert.equal(filterRecords(new URLSearchParams('municipio=Algete')).length,2);
});
test('deadline sort keeps unknowns last and never treats number of seats as difficulty',()=>{
 const sorted=filterRecords(new URLSearchParams('orden=cierre'));const dated=records.filter(p=>deadline(p)).length;assert.equal(dated,12);assert.ok(sorted.slice(0,dated).every(p=>deadline(p)));assert.ok(sorted.slice(dated).every(p=>!deadline(p)));
 assert.equal(filterRecords(new URLSearchParams('orden=plazas'))[0].seats,67);
});
test('public enrichments have official source, section, read date and limited scope',()=>{
 for(const [id,d] of Object.entries(enrichments)){assert.ok(records.some(p=>p.id===id));for(const key of ['qualification','tests','fees','eligibility','syllabus'])if(d[key]){assert.match(d[key].url,/^https:\/\//);assert.ok(d[key].section);assert.equal(d[key].checkedAt,'2026-10-13');}}
 assert.equal(detailFor(records.find(p=>p.id==='L-013')).qualification,undefined);assert.equal(detailFor(records.find(p=>p.id==='L-007')).fees,undefined);
});
test('descriptive document names and valid local IDs',()=>{
 assert.equal(documentTitle('https://example.org/Lista%20definitiva.pdf','Listas'),'Lista definitiva');assert.ok(!documentTitle('https://example.org/Lista%20definitiva.pdf','Listas').includes('documento 1'));
 assert.deepEqual(validIds(['L-007','invalid',null,'L-007','P-038']),['L-007','P-038']);
});
test('new public journeys do not fabricate AGE overlaps and exclude QA from sitemap',async()=>{
 const html=render('/alternativas-age?proceso=L-007');assert.ok(html.includes('promoción interna'));assert.ok(html.includes('pendiente de contraste'));assert.ok(!html.includes('80%'));
 const sitemap=await readFile('dist/sitemap.xml','utf8');assert.ok(!sitemap.includes('/preview-metricas'));assert.ok(!sitemap.includes('/comparar'));
 const page=render('/preview-metricas');assert.ok(page.includes('Matrículas: no conectadas'));
});
test('timeline fragment IDs are valid and point to real disclosure elements',()=>{
 for(const p of records){const html=render(processPath(p));for(const id of [...html.matchAll(/href="#(doc-[^"]+)"/g)].map(m=>m[1])){assert.ok(!/\s/.test(id));assert.ok(html.includes('id="'+id+'"'));}}
});
test('additional static samples preserve offer categories, total seats and source rows',()=>{
 const ids=['BOL-0178','BOL-0178-D02','BOL-0179','BOL-0183'];const added=ids.map(id=>records.find(p=>p.id===id));
 assert.deepEqual(added.map(p=>p.sourceRow),[221,222,223,234]);assert.ok(added.every(p=>p.sourceSheet==='Hallazgos boletines'&&p.sourceUrl.includes('gid=100024')));
 assert.deepEqual(added.map(p=>p.seats),[5,7,2,6]);assert.ok(added.slice(0,2).every(p=>p.type==='oferta'&&p.state==='pendiente de convocatoria'));
 assert.equal(deadline(added[2]),null);assert.equal(deadline(added[3]),'2026-07-28');assert.equal(staticRoutes.length,116);
 assert.equal((render('/').match(/class="process-card"/g)||[]).length,6);assert.ok(render('/').replaceAll('<!-- -->','').includes('Muestra de 30 fichas'));
});
test('municipalities without coordinates remain usable without fabricated distance',()=>{
 const selected=filterRecords(new URLSearchParams('municipio=Rivas-Vaciamadrid&radio=10'));
 assert.equal(selected.length,2);assert.equal(distanceKm('Rivas-Vaciamadrid','Algete'),null);
 const html=render('/convocatorias?municipio=Rivas-Vaciamadrid&radio=10');assert.ok(html.includes('Cercanía no disponible'));assert.ok(!html.includes('class="distance-label"'));
 for(const city of ['Rivas-Vaciamadrid','Torrelodones','Paracuellos de Jarama']){const page=render(cityPath(city));assert.ok(page.includes('Qué debes saber antes de elegir'));assert.ok(!page.includes('class="nearby-section"'));}
});

test('national sample has 30 unique records, 16 regions and correct territorial routes',()=>{
 assert.equal(new Set(records.map(p=>p.region)).size,16);assert.equal(new Set(records.map(p=>p.municipality)).size,27);
 assert.equal(cityPath('Barcelona'),'/oposiciones/cataluna/barcelona');assert.equal(cityPath('Gozón'),'/oposiciones/asturias/gozon');
 for(const p of records){assert.ok(staticRoutes.includes(cityPath(p.municipality)));assert.ok(!metadata(cityPath(p.municipality)).title.includes('no encontrada'));}
 assert.ok(render('/oposiciones/madrid/barcelona').includes('Esta página no está en la muestra'));
 assert.ok(render('/oposiciones/no-existe').includes('Esta página no está en la muestra'));
 const catalonia=render('/oposiciones/cataluna');assert.ok(catalonia.includes('Barcelona'));assert.ok(catalonia.includes('Celrà'));assert.ok(!catalonia.includes('class="process-card"><div class="card-top"><span class="status status-abierta"'));
});
test('territorial filters combine without leaking municipalities across regions',()=>{
 const select=q=>filterRecords(new URLSearchParams(q)).map(p=>p.id).sort();
 assert.deepEqual(select('ccaa=Catalu%C3%B1a'),['BOL-0114','BOL-0126']);assert.deepEqual(select('provincia=Girona'),['BOL-0126']);assert.deepEqual(select('ccaa=Galicia&municipio=Barcelona'),[]);
 assert.deepEqual(select('ccaa=Galicia&cuerpo=administrativo'),['BOL-0268']);assert.equal(select('ccaa=Comunidad+de+Madrid').length,12);
});
test('stale open state and exam-based pools are explicit, without invented seats',()=>{
 const gozon=records.find(p=>p.id==='BOL-0254');assert.equal(gozon.sourceState,'abierta');assert.equal(gozon.state,'por verificar');assert.equal(deadline(gozon),'2026-10-07');assert.ok(gozon.publicNote);
 assert.deepEqual(filterRecords(new URLSearchParams('fase=abierto')).map(p=>p.id),['BOL-0221']);
 for(const id of ['BOL-0051','BOL-0063']){const p=records.find(p=>p.id===id);assert.equal(p.processKind,'bolsa');assert.equal(p.seats,null);assert.ok(render(processPath(p)).includes('Bolsa · sin cupo fijo'));assert.ok(p.documents.find(d=>d.label==='Temario oficial').links.length);}
});
test('all added national samples retain original IDs and primary document links',()=>{
 const added=records.slice(12);assert.equal(added.length,18);assert.ok(added.every(p=>p.sourceSheet==='Hallazgos boletines'&&p.sourceRow>=2));
 for(const p of added){assert.ok(p.documents.find(d=>d.label==='Temario oficial').links.length,p.id);assert.ok(p.documents.find(d=>d.label==='Bases').links.length,p.id);assert.ok(p.documents.every(d=>d.links.every(url=>url.startsWith('https://'))),p.id);}
});
