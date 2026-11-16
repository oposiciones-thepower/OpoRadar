import test from 'node:test';
import assert from 'node:assert/strict';
import {parseApprovedCatalogue,publicUrl,ApprovedCatalogueClient,storedIds,group,applyApprovedCatalogue,records,isApplicationOpen,processPath,filterRecords,deadline,detailFor,pointFor} from '../.prerender/prerender.js';
const record=()=>({id:'OPO-900001',organism:'Ayuntamiento de prueba',sector:'Administración Local',municipality:'Municipio de prueba',province:'Madrid',region:'Comunidad de Madrid',issuer:'Ayuntamiento de prueba',category:'Auxiliar administrativo',type:'convocatoria',state:'por verificar',portal:'https://example.org/proceso',access:'Por verificar',seats:null,published:null,applicationWindow:'Por verificar',exam:null,documents:[{label:'Bases',text:'No publicadas',links:[]}],processKind:'plaza',applicationStatus:'unverified',coordinates:null,verifiedAt:null});
const catalogue=(items=[record()])=>({schemaVersion:1,revision:'test-v1',generatedAt:'2026-11-14T12:00:00Z',records:items,coverage:{scope:'Fixture aislada, no datos públicos reales'}});
test('approved mode starts empty, never loads sample records',()=>{assert.equal(records.length,0);});
test('strict envelope and public IDs; unknown internal fields are not projected',()=>{
 const raw=catalogue();raw.records[0].sourceUrl='private';raw.records[0].review_note='private';const p=parseApprovedCatalogue(raw);
 assert.equal(p.records[0].sourceUrl,undefined);assert.equal(p.records[0].review_note,undefined);
 for(const data of [{},catalogue([record(),record()]),{...catalogue(),schemaVersion:2},catalogue([{...record(),id:'L-005'}])])assert.throws(()=>parseApprovedCatalogue(data));
});
test('null seats and exact seat boundaries survive',()=>{
 for(const seats of [null,0,1,5,6,19,20])assert.equal(parseApprovedCatalogue(catalogue([{...record(),seats}])).records[0].seats,seats);
 assert.deepEqual([null,0,1,5,6,19,20].map(group),['sin-dato','sin-dato','1','1','2','2','3']);
 assert.throws(()=>parseApprovedCatalogue(catalogue([{...record(),seats:-1}])));
});
test('all approved document URLs preserved; private and executable links rejected',()=>{
 const r=record();r.documents[0].links=['https://example.org/bases.pdf#page=2','https://example.org/rectificacion.pdf'];assert.equal(parseApprovedCatalogue(catalogue([r])).records[0].documents[0].links.length,2);
 for(const url of ['javascript:alert(1)','http://127.0.0.1/a','http://10.0.0.2/a','http://172.16.0.2/a','https://u:p@example.org/a','https://docs.google.com/a','https://example.org/a?access_token=x']){assert.equal(publicUrl(url,false),false,url);assert.throws(()=>parseApprovedCatalogue(catalogue([{...record(),portal:url}])));}
});
test('offer or unknown dates cannot be an open application window',()=>{
 assert.throws(()=>parseApprovedCatalogue(catalogue([{...record(),type:'oferta',applicationStatus:'open'}])));
 assert.throws(()=>parseApprovedCatalogue(catalogue([{...record(),applicationStatus:'open'}])));
 const p={...record(),state:'abierta'};applyApprovedCatalogue(parseApprovedCatalogue(catalogue([p])));assert.equal(filterRecords(new URLSearchParams('fase=abierto')).length,0);assert.equal(deadline(records[0]),null);
});
test('live data updates facets; stable canonical path survives title/municipality changes',()=>{
 applyApprovedCatalogue(parseApprovedCatalogue(catalogue()));const first=processPath(records[0]);assert.equal(first,'/convocatorias/opo-900001');assert.equal(records.length,1);assert.deepEqual(detailFor(records[0]),{});assert.equal(pointFor(records[0]),null);
 applyApprovedCatalogue(parseApprovedCatalogue(catalogue([{...record(),municipality:'Otro municipio'}])));assert.equal(processPath(records[0]),first);
 applyApprovedCatalogue(parseApprovedCatalogue(catalogue([])));assert.equal(records.length,0);
});
test('fresh 0→1→0 data; network failure never resurrects sample or consumes draft records',async()=>{
 const versions=[catalogue([]),catalogue(),catalogue([])];let applied=[];let calls=0;
 const c=new ApprovedCatalogueClient('/test',d=>applied.push(d.records.length),async()=>new Response(JSON.stringify(versions[calls++]),{status:200}));
 await c.refresh();await c.refresh();await c.refresh();assert.deepEqual(applied,[0,1,0]);assert.equal(c.snapshot().generation,3);assert.equal(c.snapshot().hasData,true);assert.equal(c.snapshot().status,'ready');c.stop();
 const failed=new ApprovedCatalogueClient('/test',()=>assert.fail('must not apply'),async()=>new Response('unavailable',{status:503}));await failed.refresh();assert.equal(failed.snapshot().status,'error');assert.equal(failed.snapshot().hasData,false);failed.stop();
});
test('a failed refresh retains only last approved answer with explicit error',async()=>{
 let n=0,count=0;const c=new ApprovedCatalogueClient('/test',()=>count++,async()=>++n===1?new Response(JSON.stringify(catalogue())):new Response('{}',{status:200}));
 await c.refresh();await c.refresh();assert.equal(count,1);assert.equal(c.snapshot().hasData,true);assert.equal(c.snapshot().status,'error');c.stop();
});
test('concurrent refresh is coalesced; stored IDs do not disappear on startup',async()=>{
 let release;let calls=0;const wait=new Promise(r=>release=r);const c=new ApprovedCatalogueClient('/test',()=>{},async()=>{calls++;await wait;return new Response(JSON.stringify(catalogue()));});
 const a=c.refresh(),b=c.refresh();assert.equal(a,b);release();await a;assert.equal(calls,1);c.stop();assert.deepEqual(storedIds(['OPO-812','OPO-812',null,'L-005']),['OPO-812','L-005']);
});

test('synchronous transport throws do not freeze future refreshes',async()=>{
 let n=0;const c=new ApprovedCatalogueClient('/test',()=>{},()=>{n++;throw Error('offline');});
 await c.refresh();await c.refresh();assert.equal(n,2);assert.equal(c.snapshot().status,'error');c.stop();
});
test('calendar-invalid ISO dates rejected',()=>{assert.throws(()=>parseApprovedCatalogue(catalogue([{...record(),published:'2026-02-31'}])));});
