// Export only the built public sample; never upload the original application's repository.
import {readdir,readFile,writeFile,mkdir,rename,copyFile,stat} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
const [destinationArg,originArg]=process.argv.slice(2);
if(!destinationArg||!originArg)throw Error('Usage: node scripts/export-review-preview.mjs <isolated-site-directory> <site-origin>');
const destination=resolve(destinationArg),root=resolve('dist'),origin=new URL(originArg).origin;
if(!origin.startsWith('https://')||destination===root)throw Error('Use an HTTPS preview origin and separate export directory');
const manifestFile=join(destination,'.openai/hosting.json');const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
if(!manifest.project_id)throw Error('Register the isolated Site before export');
const target=join(destination,'dist');const allowed=new Set(['.html','.js','.css','.png','.svg','.ico','.xml','.txt','.json']);let files=0,sanitized=0,canonicalScripts=0;
async function copy(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const source=join(directory,entry.name),rel=relative(root,source),out=join(target,rel);
 if(entry.isSymbolicLink())throw Error('Symlinks are not allowed');
 if(entry.isDirectory()){await copy(source);continue;}
 if(!allowed.has(extname(entry.name))||entry.name.startsWith('.'))throw Error('Unexpected public build file: '+rel);
 await mkdir(resolve(out,'..'),{recursive:true});
 if(['.png','.ico'].includes(extname(entry.name)))await copyFile(source,out);else{
 let content=await readFile(source,'utf8');
 content=content.replace(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+\/edit\?gid=\d+/g,()=>{sanitized++;return '';});
 content=content.replaceAll('Preview local','Preview de revisión').replaceAll('preview local','preview de revisión').replaceAll('Sin despliegue · sin captación real','Demo de revisión · sin captación real');
 if(extname(entry.name)==='.html')content=content.replace(/(<link rel="canonical" href=")https:\/\/www\.oporadar\.es/g,'$1'+origin);
 if(extname(entry.name)==='.js')content=content.replace(/setAttribute\("href","https:\/\/www\.oporadar\.es"\+/g,()=>{canonicalScripts++;return 'setAttribute("href",'+JSON.stringify(origin)+'+';});
 if(entry.name==='sitemap.xml')content=content.replaceAll('https://www.oporadar.es',origin);
 if(/docs\.google\.com|thepower\.education|access_token|Bearer\s|private_key|BEGIN PRIVATE KEY|\/Users\//.test(content))throw Error('Private metadata detected in '+rel);
 await writeFile(out,content);
 }
 files++;
}}
await copy(root);
if(sanitized!==30||canonicalScripts!==1)throw Error('Unexpected build shape; review export before publishing');
await writeFile(join(target,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
manifest.static={directory:'dist'};const tmp=manifestFile+'.tmp';await writeFile(tmp,JSON.stringify(manifest,null,2)+'\n');await rename(tmp,manifestFile);
await writeFile(join(destination,'README.md'),'# OpoRadar — revisión del equipo\n\nExportación estática de 30 fichas públicas de muestra. Sin backend, datos de alumnos, CRM ni captación real. No indexable. Los formularios solo simulan envíos y no guardan emails.\n\nDatos del snapshot 13/10/2026; no son una revisión de plazos actual. Los enlaces documentales se conservan; los enlaces al registro corporativo no se publican.\n');
await writeFile(join(destination,'.gitignore'),'.DS_Store\nnode_modules/\n.env\n.env.*\n*.tar.gz\n');
console.log(JSON.stringify({files,internalLinksRemoved:sanitized,canonicalScripts,origin,staticDirectory:target}));
