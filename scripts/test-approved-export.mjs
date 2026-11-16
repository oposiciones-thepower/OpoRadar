import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const exporter=resolve('scripts/export-approved-preview.mjs');
const api='https://n8n.thepower.education/webhook/oporadar-demo/v1/catalogue';
async function fixture(content,expectPass){
 const root=await mkdtemp(join(tmpdir(),'oporadar-export-'));
 try{
  const target=join(root,'site');
  await mkdir(join(root,'dist'),{recursive:true});await mkdir(join(target,'.openai'),{recursive:true});
  await writeFile(join(root,'dist/index.html'),'<meta name="robots" content="noindex,nofollow"><script src="/app.js"></script>');
  await writeFile(join(root,'dist/app.js'),content);
  await writeFile(join(target,'.openai/hosting.json'),JSON.stringify({project_id:'fixture-only',retained:'preserved',static:{directory:'dist'}}));
  const out=spawnSync(process.execPath,[exporter,target,'https://preview.example',api],{cwd:root,encoding:'utf8'});
  assert.equal(out.status===0,expectPass,out.stderr);
  if(expectPass){
   const manifest=JSON.parse(await readFile(join(target,'.openai/hosting.json'),'utf8'));
   assert.equal(manifest.project_id,'fixture-only');assert.equal(manifest.retained,'preserved');
   assert.equal(manifest.static.not_found_handling,'single-page-application');
   assert.match(await readFile(join(target,'dist/_headers'),'utf8'),/X-Robots-Tag: noindex, nofollow/);
  }
 }finally{await rm(root,{recursive:true,force:true});}
}
test('export accepts security-validator token keyword, not a credential',()=>fixture('const reject=/(token|key|access_token|auth|signature)=/i;',true));
test('export allows only the declared public API and preserves identity/noindex/SPA',()=>fixture('const api="'+api+'";',true));
test('export rejects a real access_token query value',()=>fixture('const url="https://example.com/?access_token=secret-fixture";',false));
test('export rejects a serialized credential value',()=>fixture('const value={"access_token":"secret-fixture"};',false));
test('export rejects undeclared backend and internal sheet URL',async()=>{await fixture('const api="https://n8n.thepower.education/webhook/other";',false);await fixture('const url="https://docs.google.com/spreadsheets/d/fixture";',false);});
test('export rejects legacy sample records',()=>fixture('const record="L-005";',false));

