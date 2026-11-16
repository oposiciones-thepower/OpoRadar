import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const input=process.argv[2];if(!input)throw Error('Provide the downloaded public IGN/ANE JSON');
const raw=await readFile(input);const rows=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
if(!Array.isArray(rows)||rows.length<8000)throw Error('Unexpected IGN municipality catalogue');
const codes=new Set();
const entries=rows.map(row=>{
 const code=String(row.Identificador),name=row.Nombre,province=row.Provincia;
 const source=new URL(row['Ver en mapa']);const center=source.searchParams.get('center')?.split(',').map(Number);
 if(!/^\d{5}$/.test(code)||codes.has(code)||typeof name!=='string'||typeof province!=='string'||!center||center.length!==2||!center.every(Number.isFinite))throw Error('Invalid official municipality row');
 codes.add(code);const[lon,lat]=center;if(lat<27||lat>44.5||lon< -19||lon>5)throw Error('Coordinate outside Spanish reference envelope');
 return[code,name,province,lat,lon];
}).sort((a,b)=>a[0].localeCompare(b[0]));
const metadata={source:'https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS.json',description:'https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS.html',license:'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf',licenseId:'CC-BY-4.0',sourceLastModified:'2025-12-12',retrievedAt:'2026-11-16',sourceSha256:createHash('sha256').update(raw).digest('hex'),precision:'Ubicación aproximada municipal; no sede de examen ni destino de trabajo',crs:'EPSG:4326',entries};
await writeFile('src/public-site/data/municipality-reference.json',JSON.stringify(metadata)+'\n');
await mkdir('public/licenses',{recursive:true});
await writeFile('public/licenses/municipality-reference.txt','Obra derivada de NGMEP · IGN/ANE · CC BY 4.0.\nExtracción y emparejamiento por OpoRadar. Coordenadas municipales aproximadas; no sedes de examen.\nFuente: '+metadata.source+'\nDescripción: '+metadata.description+'\nCondiciones IGN: '+metadata.license+'\nCC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nÚltima modificación HTTP de fuente: '+metadata.sourceLastModified+' (no fecha del padrón).\nRecuperada: '+metadata.retrievedAt+'\nSHA256 original: '+metadata.sourceSha256+'\nCampos transformados: INE5, nombre, provincia, latitud/longitud extraídas de center=longitud,latitud.\nEmparejamiento: nombre normalizado + provincia, única coincidencia; homónimos/ambiguos permanecen sin ubicar.\n');
console.log(JSON.stringify({municipalities:entries.length,sourceSha256:metadata.sourceSha256}));

