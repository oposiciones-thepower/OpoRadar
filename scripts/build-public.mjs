import {spawnSync} from 'node:child_process';
const endpoint=process.env.VITE_APPROVED_CATALOGUE_URL;
if(!endpoint)throw Error('VITE_APPROVED_CATALOGUE_URL is required for a deployable public release');
const u=new URL(endpoint);
if(u.origin!=='https://n8n.thepower.education'||!u.pathname.startsWith('/webhook/')||u.search||u.hash||u.username||u.password)throw Error('Unexpected public catalogue endpoint');
const result=spawnSync('npm',['run','build:marketing'],{env:{...process.env,VITE_CATALOGUE:'approved',VITE_PUBLIC_RELEASE:'production'},stdio:'inherit'});
process.exit(result.status??1);
