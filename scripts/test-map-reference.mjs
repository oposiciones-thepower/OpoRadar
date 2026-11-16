import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {municipalityReference,municipalityReferenceMetadata,pointFor,geographicResults,encodeZone,decodeZone} from '../.prerender/prerender.js';
const row=(municipality,province,extra={})=>({id:'OPO-999001',municipality,province,coordinates:null,...extra});
test('official IGN reference is attributed and covers all downloaded municipalities',()=>{assert.equal(municipalityReferenceMetadata.count,8132);assert.equal(municipalityReferenceMetadata.licenseId,'CC-BY-4.0');assert.match(municipalityReferenceMetadata.source,/www\.ign\.es/);});
test('longitude/latitude from the official source is returned in Leaflet latitude/longitude order',()=>{const p=municipalityReference('Agurain','Álava');assert.equal(p?.municipalityCode,'01051');assert.equal(p?.lat,42.850452);assert.equal(p?.lon,-2.389753);});
test('same municipality name resolves only within the supplied province',()=>{const m=municipalityReference('Arroyomolinos','Madrid'),c=municipalityReference('Arroyomolinos','Cáceres');assert.ok(m&&c);assert.notEqual(m.municipalityCode,c.municipalityCode);assert.equal(municipalityReference('Arroyomolinos',''),null);});
test('accents and explicit province-language variants resolve without fuzzy town matching',()=>{assert.ok(municipalityReference('Galdar','Las Palmas'));assert.ok(municipalityReference('Bilbao','Vizcaya'));assert.equal(municipalityReference('Guadarrama','Barcelona'),null);assert.equal(municipalityReference('Milares','Valencia'),null);});
test('unlocated, regional and ambiguous bodies are not placed at a guessed capital',()=>{for(const r of [row('Gobierno Vasco',''),row('Comunidad de Madrid','Madrid'),row('Arroyomolinos','Provincia desconocida')])assert.equal(pointFor(r),null);});
test('an explicit valid catalogue coordinate remains authoritative',()=>{assert.deepEqual(pointFor(row('Guadarrama','Madrid',{coordinates:{lat:40.67,lon:-4.09}})),[40.67,-4.09]);});
test('drawn zone includes a real municipal point and excludes other municipalities/unknowns',()=>{const a=row('Guadarrama','Madrid'),b=row('Galdar','Las Palmas'),u=row('Sin municipio','Madrid');const p=pointFor(a);assert.ok(p);const zone=[[p[0]-.03,p[1]-.03],[p[0]-.03,p[1]+.03],[p[0]+.03,p[1]+.03],[p[0]+.03,p[1]-.03]];assert.deepEqual(geographicResults([a,b,u],decodeZone(encodeZone(zone)),null),[a]);assert.equal(geographicResults([a,b,u],null,null).length,3);});
test('islands and autonomous cities have real reference points',()=>{for(const [city,province]of[['Santa Cruz de Tenerife','Santa Cruz de Tenerife'],['Palma','Illes Balears'],['Ceuta','Ceuta'],['Melilla','Melilla']])assert.ok(municipalityReference(city,province),city);});


test('map cluster summaries are bounded instead of listing hundreds of municipalities',()=>{const text=readFileSync('src/public-site/GeoSearchMap.tsx','utf8');assert.match(text,/names\.slice\(0,3\)/);assert.doesNotMatch(text,/names\.join\(/);});
