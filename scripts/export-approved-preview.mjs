import {readdir,readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
const [destinationArg,originArg,apiArg]=process.argv.slice(2);
if(!destinationArg||!originArg)throw Error('Usage: export-approved-preview.mjs <site-checkout> <https-site-origin> [approved-public-api-url]');
const destination=resolve(destinationArg),root=resolve('dist'),origin=new URL(originArg).origin;
if(!origin.startsWith('https://')||destination===root)throw Error('Separate Site checkout and HTTPS origin required');
let publicApi='';
if(apiArg){const u=new URL(apiArg);if(u.origin!=='https://n8n.thepower.education'||!u.pathname.startsWith('/webhook/')||u.search||u.username||u.password||u.hash)throw Error('Only the approved isolated public API is allowed');publicApi=u.href;}
const manifestFile=join(destination,'.openai/hosting.json'),manifest=JSON.parse(await readFile(manifestFile,'utf8'));
if(!manifest.project_id)throw Error('Use the existing Site identity');
const target=join(destination,'dist');let files=0;
await rm(target,{recursive:true,force:true});
async function copy(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const source=join(directory,entry.name),rel=relative(root,source),out=join(target,rel);
 if(entry.isSymbolicLink())throw Error('No symlinks in published output');
 if(entry.isDirectory()){await copy(source);continue;}
 if(!['.html','.js','.css','.png','.svg','.ico','.xml','.txt','.json'].includes(extname(entry.name))||entry.name.startsWith('.'))throw Error('Unexpected output file '+rel);
 await mkdir(resolve(out,'..'),{recursive:true});
 if(['.png','.ico'].includes(extname(entry.name)))await copyFile(source,out);else{
  let content=await readFile(source,'utf8');
  content=content.replaceAll('https://www.oporadar.es',origin).replaceAll('Preview local','Demo de revisión');
  const audit=publicApi?content.replaceAll(publicApi,'APPROVED_PUBLIC_READ_API'):content;
  if(/docs\.google\.com\/spreadsheets|thepower\.education|postgres(?:ql)?:\/\/|access_token|Bearer\s|private_key|BEGIN PRIVATE KEY|\/Users\//.test(audit))throw Error('Private data or undeclared backend in '+rel);
  if(/L-005|L-006|P-038|catalogue\.db\.json|2026-10-13/.test(content))throw Error('Old sample material in approved output '+rel);
  await writeFile(out,content);
 }files++;
}}
await copy(root);
await writeFile(join(target,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
manifest.static={directory:'dist',not_found_handling:'single-page-application'};
await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
await writeFile(join(destination,'README.md'),'# OpoRadar — approved catalogue demo\n\nPublic review demo. Runtime reads only the isolated approved-catalogue API. No database credentials, student data, backend mutations or live lead capture. Noindex remains active. SPA fallback permits new public IDs without rebuilding each detail route. Catalogue approval does not certify all documents or application deadlines.\n');
await writeFile(join(destination,'.gitignore'),'.DS_Store\nnode_modules/\n.env\n.env.*\n*.tar.gz\n');
console.log(JSON.stringify({files,staticDirectory:target,sampleRecords:0,spaFallback:true}));
