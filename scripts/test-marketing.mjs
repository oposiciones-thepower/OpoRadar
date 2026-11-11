import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {render,staticRoutes,records,processPath,cityPath,group,matches,metadata} from '../.prerender/prerender.js';
test('seat boundaries and unknown data',()=>{assert.deepEqual([null,0,1,5,6,19,20].map(group),['sin-dato','sin-dato','1','1','2','2','3']);});
test('IDs, source provenance and unknown states preserved',()=>{assert.equal(records.length,30);assert.equal(new Set(records.map(p=>p.id)).size,30);const boadilla=records.find(p=>p.id==='L-013');assert.equal(boadilla.seats,null);assert.equal(boadilla.state,'por verificar');assert.equal(boadilla.sourceRow,51);assert.ok(records.every(p=>p.portal.startsWith('https://')));});
test('accent-insensitive search and distinct access categories',()=>{assert.ok(matches(records.find(p=>p.id==='L-005'),'auxiliar alcorcon'));assert.equal(matches(records.find(p=>p.id==='L-005'),'administrativo algete'),false);assert.equal(cityPath('Alcorcón'),'/oposiciones/madrid/alcorcon');});
test('prerendered pages contain headings, sources and their own metadata',async()=>{for(const path of new Set(staticRoutes)){const file='dist'+(path==='/'?'':path)+'/index.html';const html=await readFile(file,'utf8');assert.equal((html.match(/<h1\b/g)||[]).length,1,path);assert.ok(html.includes('noindex,nofollow'));assert.ok(html.includes(metadata(path).title.replaceAll('&','&amp;')),path);assert.ok(html.includes('href="https://www.oporadar.es'+path+'"'),path);assert.ok(!html.includes('OpoReview'),path);}});
test('each process has real official source links, no login barrier',()=>{for(const p of records){const html=render(processPath(p));assert.ok(html.includes(p.portal.replaceAll('&','&amp;')),p.id);assert.ok(html.includes('Bases y documentos oficiales'));assert.ok(html.includes('No localizada')||html.includes('Fecha de examen'));assert.ok(!html.includes('pago_tazas_pdf'));}});
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
 assert.equal(deadline(added[2]),null);assert.equal(deadline(added[3]),'2026-07-28');assert.equal(staticRoutes.length,119);
 assert.equal((render('/').match(/class="process-card"/g)||[]).length,0);assert.ok(render('/').replaceAll('<!-- -->','').includes('Muestra de 30 fichas'));
});
test('municipalities now use primary-source coordinates, while absent locations keep no distance',()=>{
 const selected=filterRecords(new URLSearchParams('municipio=Rivas-Vaciamadrid&radio=10'));assert.ok(selected.some(p=>p.municipality==='Rivas-Vaciamadrid'));assert.ok(Number.isFinite(distanceKm('Rivas-Vaciamadrid','Algete')));assert.equal(distanceKm('No geocodificado','Algete'),null);
 const html=render('/convocatorias?municipio=Rivas-Vaciamadrid&radio=10');assert.ok(!html.includes('Cercanía no disponible'));assert.ok(html.includes('explorer-view-list'));
 for(const city of ['Rivas-Vaciamadrid','Torrelodones','Paracuellos de Jarama']){const page=render(cityPath(city));assert.ok(page.includes('Qué debes saber antes de elegir'));}
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

const {formatDatesInText,toISO,latestPublications,relatedProcesses,relatedReason,computeDeadline,referenceCalendars,explicitRule}=await import('../.prerender/prerender.js');
test('Estela: dates are displayed DD/MM/YYYY without changing invalid or relative information',()=>{
 assert.equal(formatDatesInText('Desde 2026-03-30 hasta 2026-04-14; 15 días naturales'),'Desde 30/03/2026 hasta 14/04/2026; 15 días naturales');
 assert.equal(formatDatesInText('2026-02-30 · pendiente'),'2026-02-30 · pendiente');assert.equal(toISO('29/02/2026'),null);assert.equal(toISO('29/02/2024'),'2024-02-29');
 for(const p of records){const html=render(processPath(p));assert.ok(html.indexOf('id="documentos"')<html.indexOf('id="plazos"')&&html.indexOf('¿Encaja esta ')<html.indexOf('Resumen de la '),p.id);assert.ok(!/<strong>[^<]*\b\d{4}-\d{2}-\d{2}\b/.test(html),p.id);}
});
test('Home uses direct map selection while keeping publication criteria explicit',()=>{
 const html=render('/');assert.ok(html.includes('Pulsa una comunidad o ciudad autónoma'));assert.ok(html.includes('aria-label="Comunidad del mapa"'));assert.ok(!html.includes('Últimas publicaciones de la muestra'));assert.ok(html.includes('Administrativo (C1)'));assert.ok(html.indexOf('body-guide-cards')>html.indexOf('<h1'));assert.ok(html.includes('map-hero-large'));assert.ok(html.includes('no es una revisión de plazos actualizada hoy'));
 const latest=latestPublications();assert.equal(latest.length,6);for(let i=1;i<latest.length;i++)assert.ok(toISO(latest[i-1].published)>=toISO(latest[i].published));
});
test('Estela: directory filters are URL-based with useful empty states',()=>{
 const html=render('/localidades?ccaa=Catalu%C3%B1a&provincia=Girona');assert.ok(html.includes('Celrà'));assert.ok(!html.includes('class="location-card" href="/oposiciones/cataluna/barcelona"'));assert.ok(html.includes('Provincia del directorio'));assert.ok(html.includes('Buscar municipio en el directorio'));
 assert.ok(render('/localidades?q=municipio-inexistente').includes('No hay localidades para estos filtros.'));
});
test('Estela: related options keep body and exclude the same municipality',()=>{
 for(const p of records)for(const other of relatedProcesses(p)){assert.notEqual(p.municipality,other.municipality);assert.equal(p.category.toLowerCase().includes('auxiliar'),other.category.toLowerCase().includes('auxiliar'));assert.ok(relatedReason(p,other));}
 const p=records.find(p=>p.id==='BOL-0024');assert.equal(relatedProcesses(p,3,[p,{...p,id:'X',municipality:'Otra',province:'Jaén'},{...p,id:'Y',municipality:'Otra lejana',province:'Barcelona',region:'Cataluña'}])[0].id,'X');
});
const calendar=referenceCalendars.find(c=>c.id==='martos-2026');
test('calendar: natural days and explicit next-day trigger, including the Martos example',()=>{
 const rule=explicitRule(records.find(p=>p.id==='BOL-0024').applicationWindow);assert.deepEqual(rule,{trigger:'2026-03-30',days:15,unit:'naturales'});
 assert.equal(computeDeadline({...rule,calendar}).end,'2026-04-14');
 assert.equal(explicitRule('20 días hábiles desde el día siguiente al BOE de 08/08/2026').trigger,'2026-08-08');assert.equal(explicitRule('20 días desde publicación'),null);
});
test('calendar: working days skip weekends, national, regional and local holidays',()=>{
 assert.equal(computeDeadline({trigger:'2026-04-01',days:1,unit:'hábiles',calendar}).end,'2026-04-06');
 const local=computeDeadline({trigger:'2026-05-04',days:1,unit:'hábiles',calendar});assert.equal(local.end,'2026-05-06');assert.ok(local.excluded.some(d=>d.date==='2026-05-05'&&d.reason.includes('local')));
 assert.equal(computeDeadline({trigger:'2026-01-05',days:1,unit:'hábiles',calendar}).end,'2026-01-07');
});
test('calendar: last natural day rolls forward, inclusive trigger is explicit',()=>{
 assert.equal(computeDeadline({trigger:'2026-04-03',days:1,unit:'naturales',calendar}).end,'2026-04-06');
 assert.equal(computeDeadline({trigger:'2026-03-30',days:1,unit:'naturales',includeTrigger:true,calendar}).end,'2026-03-30');
});
test('calendar: incomplete years and invalid inputs never return a plausible deadline',()=>{
 for(const args of [{trigger:'2026-12-31',days:2,unit:'naturales',calendar},{trigger:'2026-02-30',days:2,unit:'hábiles',calendar},{trigger:'2026-01-01',days:0,unit:'hábiles',calendar},{trigger:'2026-01-01',days:10,unit:'hábiles',calendar:{...calendar,complete:false}}]){const r=computeDeadline(args);assert.equal(r.end,null);assert.ok(r.error);}
});


const {bodyGuides,bodyGuidePath,territoryNames,territorialRecords}=await import('../.prerender/prerender.js');
test('Superadmin: 19 territories distinguish sample coverage from absence of calls',()=>{
 assert.equal(territoryNames.length,19);assert.equal(territoryNames.reduce((n,r)=>n+territorialRecords(r).length,0),30);assert.equal(territoryNames.filter(r=>territorialRecords(r).length).length,16);
 for(const name of ['La Rioja','Ceuta','Melilla'])assert.equal(territorialRecords(name).length,0);
 const html=render('/localidades?ccaa=La+Rioja');assert.ok(html.includes('no ausencia de convocatorias'));assert.ok(html.includes('Sin registros en esta muestra'));assert.ok(html.includes('No hay localidades para estos filtros.'));
});
test('Superadmin: actual body guides preserve sections, tables and useful actions',()=>{
 assert.equal(bodyGuides.length,2);
 for(const guide of bodyGuides){const path=bodyGuidePath(guide),html=render(path);assert.ok(staticRoutes.includes(path));assert.ok(metadata(path).title.includes(guide.title));assert.ok(html.includes('Preguntas frecuentes'));assert.ok(html.includes('<table>'));assert.ok(html.includes('<details>'));assert.ok(html.includes('Cuánto cobra'));assert.ok(html.includes('Qué temario'));assert.ok(html.includes('cuerpo='+guide.family));assert.ok(!html.includes('[CTA:'));assert.ok(!html.includes('docs.google.com'));assert.ok(html.includes('BOE-A-2015-11719'));assert.ok(html.includes('Técnico')||guide.group==='C2');}
});
test('Superadmin: body guide anchors are unique and actually exist',()=>{
 for(const guide of bodyGuides){const html=render(bodyGuidePath(guide));const ids=[...html.matchAll(/id="(guia-[^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const [,id] of html.matchAll(/href="#(guia-[^"]+)"/g))assert.ok(ids.includes(id),id);}
});
test('Superadmin: clear body pages are reachable and repetitive AGE pitch is removed',()=>{
 const home=render('/');assert.ok(home.includes('Preparar'));assert.ok(home.includes('auxiliar-administrativo-local'));assert.ok(home.includes('administrativo-local'));assert.ok(home.includes('Pulsa una comunidad o ciudad autónoma'));assert.ok(!home.includes('ser tu única opción'));assert.ok(!render('/superadmin').includes('No cierres la puerta'));
 const index=render('/oposiciones-locales');assert.ok(index.includes('C1'));assert.ok(index.includes('C2'));assert.ok(index.includes('no es una convocatoria'));
});


test('Map placement: hero replaces decorative radar, no duplicate map on home',()=>{
 const html=render('/');assert.equal((html.match(/class="territorial-map /g)||[]).length,1);assert.ok(html.indexOf('map-hero')>html.indexOf('class="hero"'));assert.ok(!html.includes('MÁS OPCIONES. UN MISMO OBJETIVO.'));assert.ok(!html.includes('class="radar"'));assert.ok(!html.includes('class="territory-section"'));assert.ok(render('/localidades').includes('Mapa de fichas por comunidad autónoma'));
});


test('Map UX: hero CTA is absent until a community is selected',()=>{
 const html=render('/');const heroMap=html.slice(html.indexOf('class="territorial-map map-hero'),html.indexOf('class="alert-band"'));assert.ok(!heroMap.includes('class="map-hero-selection"'));assert.ok(!heroMap.includes('Ver fichas de este territorio'));assert.ok(!heroMap.includes('Mapa y directorio de localidades'));assert.ok(heroMap.includes('Verde: comunidad seleccionada'));assert.ok(!heroMap.includes('class="canary-inset"'));
});


test('Large map hero: accessible selector, no search form or territory CTA before selection',()=>{
 const html=render('/');const hero=html.slice(html.indexOf('class="hero"'),html.indexOf('class="alert-band"'));assert.ok(hero.includes('map-hero-large'));assert.ok(hero.includes('<select'));assert.ok(!hero.includes('<form'));assert.ok(!hero.includes('class="button'));assert.ok(!hero.includes('MÁS OPCIONES'));assert.ok(!hero.includes('map-source'));assert.equal((hero.match(/class="territory-path /g)||[]).length,19);assert.ok(html.includes('Cartografía del mapa · atribución'));
});

const geo=await import('../.prerender/prerender.js');
const square=[[40,-4],[41,-4],[41,-3],[40,-3]];
test('Geo: URL zones are bounded, finite, non-crossing and deterministic',()=>{
 assert.deepEqual(geo.decodeZone(geo.encodeZone(square)),square);
 for(const raw of ['', 'null', '40,-4;41,-3', '40,NaN;41,-3;42,-4', '40,-4;41,-3;40,-3;41,-4', '40,-4;40,-4;41,-3', '40,-4;40,-3;40,-2', 'a'.repeat(3000),'40,-4,7;41,-3;42,-4'])assert.equal(geo.decodeZone(raw),null,raw.slice(0,50));
 assert.equal(geo.validZone(Array.from({length:81},(_,i)=>[40+Math.sin(i)*.01,-4+Math.cos(i)*.01])),false);
});
test('Geo: point-in-polygon includes borders; outside, missing and mismatched locations are not guessed',()=>{
 assert.equal(geo.insideZone([40.5,-3.5],square),true);assert.equal(geo.insideZone([40,-3.5],square),true);assert.equal(geo.insideZone([39,-3.5],square),false);
 const p=records[0];assert.equal(geo.pointFor({...p,municipality:'No documentado'}),null);assert.equal(geo.pointFor({...p,province:'Otra provincia'}),null);
 assert.equal(geo.geographicResults([{...p,municipality:'No documentado'}],square,null).length,0);
 assert.equal(geo.geographicResults([{...p,municipality:'No documentado'}],null,null).length,1);
 assert.ok(geo.geographicResults(records,square,null).every(p=>geo.insideZone(geo.pointFor(p),square)));
});
test('Geo: 27 primary-source municipal references cover the static 30, not exam venues',()=>{
 assert.equal(Object.keys(geo.municipalPoints).length,27);assert.equal(records.filter(p=>geo.pointFor(p)).length,30);
 for(const p of Object.values(geo.municipalPoints)){assert.ok(p.source.startsWith('https://www.cartociudad.es/geocoder/api/geocoder/find?'));assert.ok(p.municipalityCode.match(/^\d{5}$/));assert.ok(p.lat>=27&&p.lat<=44.5&&p.lon>=-19&&p.lon<=5);}
});
test('Geo: viewport filtering rejects corrupt bounds',()=>{
 assert.deepEqual(geo.decodeBounds('40,-4,41,-3'),[40,-4,41,-3]);for(const s of ['41,-4,40,-3','40,-3,41,-4','a,-4,41,-3','0,0,1,2,3'])assert.equal(geo.decodeBounds(s),null);
});
test('Catalogue: titles distinguish offers, calls, unknown quotas and exam pools without fabricated seats',()=>{
 const p=records[0];assert.equal(geo.processHeading({...p,type:'oferta',seats:2300,category:'Administrativo del Estado',organism:'Administración General del Estado'}),'Oferta de 2300 plazas de Administrativo en Administración General del Estado');
 assert.ok(geo.processHeading({...p,seats:1}).includes('1 plaza de'));assert.ok(!geo.processHeading({...p,seats:null}).includes('0 plazas'));assert.ok(geo.processHeading({...p,processKind:'bolsa',seats:null}).startsWith('Bolsa de empleo de '));
});
test('Catalogue: text-only uniform rows, complete title links, pagination and SSR without Leaflet window access',()=>{
 const html=render('/convocatorias');assert.equal((html.match(/data-process-id=/g)||[]).length,15);assert.ok(html.includes('Tu próxima oposición,'));assert.ok(html.includes('Buscar por municipio, organismo o convocatoria'));assert.ok(html.includes('explorer-view-list'));assert.ok(html.includes('Página siguiente'));assert.ok(!html.includes('class="process-card"'));
 assert.equal((render('/convocatorias?pagina=2').match(/data-process-id=/g)||[]).length,15);assert.equal((render('/convocatorias?ccaa=Catalu%C3%B1a').match(/data-process-id=/g)||[]).length,2);
 assert.ok(render('/convocatorias?zona=corrupta').includes('La zona del enlace no es válida'));
});
test('Sonia and Blanca: body guides remain prominent after H1; removed blocks stay removed',()=>{
 const html=render('/');assert.ok(html.includes('Administrativo (C1)'));assert.ok(html.includes('Auxiliar Administrativo (C2)'));assert.ok(html.indexOf('body-guide-cards')>html.indexOf('<h1'));for(const s of ['Últimas publicaciones de la muestra','Qué comprobar antes de presentar la solicitud.','superadmin-band'])assert.ok(!html.includes(s));
});

test('Spain-only map includes all Spanish territories and masks foreign countries',async()=>{
 assert.deepEqual(geo.spainBounds,[[27.5,-18.35],[43.9,4.5]]);
 for(const p of [[40.4,-3.7],[28.3,-16.5],[39.7,2.9],[35.889,-5.3167],[35.292,-2.938]])assert.ok(geo.spainRings.some(r=>geo.insideZone(p,r)),p.join(','));
 for(const p of [[38.722,-9.139],[48.8566,2.3522],[51.5,-.12]])assert.ok(!geo.spainRings.some(r=>geo.insideZone(p,r)));
 const source=await readFile('src/public-site/GeoSearchMap.tsx','utf8');assert.ok(source.includes('maxBounds:SPAIN_BOUNDS,maxBoundsViscosity:1'));assert.ok(source.includes('minZoom:5'));assert.ok(source.includes('fillOpacity:1,fillRule:'));assert.ok(source.includes('bounds:SPAIN_BOUNDS'));assert.ok(!source.includes('navigator.geolocation'));
});

test('Blanca: detail contains deadline, honest source CTA, anchors and responsive disclosures',()=>{
 const html=render(processPath(records[0]));for(const id of ['plazos','resumen','requisitos','recorrido','temario','documentos'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('detail-mobile-action'));assert.ok(html.includes('Consultar plazo e inscripción'));assert.ok(html.includes('detail-disclosure'));assert.ok(!html.includes('1 enlaces'));assert.ok(!html.includes('Ir a inscribirme'));
});
test('Blanca: map legend and list alternative do not fabricate records or persistent CTA',()=>{
 const html=render('/');assert.ok(html.includes('hero-legend'));assert.ok(html.includes('Comunidad del mapa'));assert.ok(html.includes('count-zero'));assert.ok(!html.includes('1 fichas'));assert.ok(!html.includes('Ver fichas de este territorio'));
});
test('Blanca: catalogue list SSR, tooltips, accessible actions and font floor',async()=>{
 const html=render('/convocatorias');assert.ok(html.includes('explorer-view-list'));assert.ok(html.includes('class="button row-open"'));assert.ok(html.includes('title="Lista y mapa"'));assert.ok(html.includes('Abrir bases BOL-0221'));assert.ok(!html.includes('Comparar</span><span>+'));
 for(const file of ['public-site.css','explorer.css','ux-improvements.css'])assert.ok(!/font-size:(?:[7-9]|1[01])px/.test(await readFile('src/public-site/'+file,'utf8')),file);
});
test('Blanca: comparison criterion cards and no repeated compare header action',async()=>{
 const code=await readFile('src/public-site/features.tsx','utf8');assert.ok(code.includes('comparison-mobile'));assert.ok(code.includes('comparison-different'));assert.ok(code.includes('Hay diferencias'));const compare=code.slice(code.indexOf('export function ComparePage'),code.indexOf('export function LocalInsights'));assert.ok(!compare.includes('<CompareButton'));assert.ok(code.includes("comparisonTrayVisible(pathname,compared.length)"));
});

test('Blanca: singular labels are correct in directory and anchor links reopen mobile sections',async()=>{
 const html=render('/localidades');assert.ok(!html.includes('1 fichas'));assert.ok(!html.includes('1 municipios'));const ux=await readFile('src/public-site/UX.tsx','utf8');assert.ok(ux.includes("window.addEventListener('hashchange',reveal)"));assert.ok(ux.includes("target.closest('details.detail-disclosure')"));
});

test('Meeting: institution and jurisdiction are separate; no scope inferred from university address',()=>{
 const p=records[0],sample=(sector,organism,issuer='')=>({...p,sector,organism,issuer});
 const cases=[sample('Universidades','Universidad Complutense'),sample('Sanidad','Hospital Ramón y Cajal'),sample('Cortes Generales','Senado'),sample('Comunidad','Comunidad de Madrid'),sample('Ayuntamientos','Ayuntamiento de Algete'),sample('Otros','Ministerio de Sanidad')];
 assert.deepEqual(cases.map(geo.institutionKind),['universidades','sanidad','cortes','administracion','administracion','sanidad']);assert.deepEqual(cases.map(geo.governmentScope),[null,null,'estatal','autonomico','local','estatal']);
 assert.equal(geo.discoveryResults(cases,new URLSearchParams('organismo=cortes&ambito=estatal')).length,1);assert.equal(geo.discoveryResults(cases,new URLSearchParams()).length,cases.length);
});
test('Meeting: new facets do not expose internal groups, tests or unknown options',async()=>{
 const html=render('/convocatorias');const code=await readFile('src/public-site/CatalogueExplorer.tsx','utf8');for(const label of ['Tipo de organismo','Ámbito de la administración'])assert.ok(code.includes('label="'+label+'"'));for(const label of ['Grupo por plazas','Tipo de prueba'])assert.ok(!html.includes('aria-label="'+label+'"'));
 assert.ok(!html.includes('<option value="pendiente">'));assert.ok(!html.includes('<option value="por verificar">'));assert.ok(html.includes('Por verificar'));assert.ok(code.includes('«Todos» también incluye fichas'));
});
test('Meeting: original categories preserved and ambiguous families visibly qualified',()=>{
 for(const p of records){const before=JSON.stringify(p);const title=geo.processHeading(p);assert.ok(title.includes(geo.publicCategory(p)));assert.equal(JSON.stringify(p),before);const html=render(processPath(p));assert.ok(html.includes('Denominación oficial:'));assert.ok(html.includes(p.category.replaceAll('&','&amp;')));if(geo.categoryNeedsReview(p))assert.ok(title.includes('por contrastar'));}
});
test('Meeting: details start with original document links, before deadline and summary',()=>{
 for(const p of records){const html=render(processPath(p));assert.ok(html.indexOf('id="documentos"')<html.indexOf('id="plazos"'));assert.ok(html.indexOf('id="plazos"')<html.indexOf('id="requisitos"'));assert.ok(html.indexOf('id="requisitos"')<html.indexOf('id="resumen"'));for(const d of p.documents)for(const href of d.links)assert.ok(html.includes(href.replaceAll('&','&amp;')),p.id);assert.ok(html.includes('Seguir convocatoria'));assert.ok(html.includes('todavía no envía avisos'));}
});
test('Meeting: four main destinations and comparator counter, legacy guides still reachable',()=>{
 const html=render('/'),nav=html.slice(html.indexOf('aria-label="Navegación principal"'),html.indexOf('</nav>'));for(const title of ['Convocatorias','Por localidad','Preparar','Comparador'])assert.ok(nav.includes(title));for(const title of ['>Guías<','>Desde AGE<','>Superadmin '])assert.ok(!nav.includes(title));assert.ok(render('/guias').includes('Menos dudas'));assert.ok(!html.includes('container guides-section'));
});
test('Meeting: footer FAQs and official brand links do not promise active alerts',()=>{
 const html=render('/');assert.ok(html.includes('id="preguntas-frecuentes"'));assert.ok(html.includes('¿Qué es una oferta'));assert.ok(html.includes('¿Qué es una convocatoria'));assert.ok(html.includes('¿Qué son las bases'));assert.ok(html.includes('https://www.superaoposiciones.es/'));assert.ok(html.includes('https://patrio.es/'));assert.ok(html.includes('no guarda emails ni envía avisos'));
});
test('Meeting: preparation searches process references, not a fake inventory of generated courses',()=>{
 const html=render('/oposiciones-locales');assert.ok(html.includes('Buscar convocatoria para preparar'));assert.ok(html.includes('Cuerpo para preparar'));assert.ok(html.includes('No es un catálogo de temarios ya disponibles'));assert.ok(html.includes('bajo demanda'));
});
test('Meeting: explicit add label, direct selected removals and map result regression contract',async()=>{
 const features=await readFile('src/public-site/features.tsx','utf8'),css=await readFile('src/public-site/meeting.css','utf8');assert.ok(features.includes('Añadir al comparador'));assert.ok(!features.includes('comparison-manage-button'));assert.ok(features.includes('Quitar del comparador'));assert.ok(features.includes('comparison-selection is-open'));assert.ok(css.includes('.explorer-view-map .explorer-list{display:block}'));assert.ok(render('/convocatorias').includes('id="resultados-mapa"'));
});

test('Meeting: comparator tray works on catalogue with and without trailing slash',()=>{
 for(const path of ['/convocatorias','/convocatorias/','/localidades','/localidades/'])assert.equal(geo.comparisonTrayVisible(path,2),true,path);
 for(const path of ['/','/comparar','/comparar/','/convocatorias/algete-administrativo-l-006','/convocatorias/algete-administrativo-l-006/'])assert.equal(geo.comparisonTrayVisible(path,2),false,path);
 assert.equal(geo.comparisonTrayVisible('/convocatorias/',0),false);
});
