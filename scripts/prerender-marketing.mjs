import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {render,metadata,staticRoutes} from '../.prerender/prerender.js';
const template=await readFile('dist/index.html','utf8');
if(!template.includes('<!--public-content-->')) throw new Error('SSR outlet missing');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const routes=[...new Set(staticRoutes)];
function page(route){
 const meta=metadata(route);
 return template.replace('<!--public-content-->',render(route))
 .replace(/<title>.*?<\/title>/,'<title>'+escape(meta.title)+'</title>')
 .replace(/<meta name="description" content="[^"]*"\s*\/?>/,'<meta name="description" content="'+escape(meta.description)+'"/>')
 .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/,'<meta property="og:title" content="'+escape(meta.title)+'"/>')
 .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/,'<meta property="og:description" content="'+escape(meta.description)+'"/>')
 .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/,'<link rel="canonical" href="https://www.oporadar.es'+escape(route)+'"/>');
}
for(const route of routes){const folder=join('dist',route.slice(1));await mkdir(folder,{recursive:true});await writeFile(join(folder,'index.html'),page(route));}
await writeFile('dist/404.html',page('/404'));
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /\n# LOCAL PREVIEW: not approved for publication\n');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.filter(path=>!['/guardadas','/area-alumno','/comparar','/preview-metricas'].includes(path)).map(path=>'<url><loc>https://www.oporadar.es'+path+'</loc></url>').join('')+'</urlset>');
await writeFile('dist/routes.json',JSON.stringify(routes));
console.log('HTML prerendered for '+routes.length+' routes; noindex remains active.');
