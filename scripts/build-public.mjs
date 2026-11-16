import {spawnSync} from 'node:child_process';
const result=spawnSync('npm',['run','build:marketing'],{env:{...process.env,VITE_CATALOGUE:'approved',VITE_PUBLIC_RELEASE:'production'},stdio:'inherit'});
process.exit(result.status??1);

