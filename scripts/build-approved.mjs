import {spawnSync} from 'node:child_process';
const env={...process.env,VITE_CATALOGUE:'approved'};
const result=spawnSync('npm',['run','build:marketing'],{env,stdio:'inherit'});
process.exit(result.status??1);
