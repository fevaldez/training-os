'use strict';
// Focused offline control checks. No network, dispatch, owner profile or deployment.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cp=require('node:child_process'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const RC='51e1a753c6a7539006d28fc3a1b1b49f2e882f23';
const hotfixAssets={"index.html": "1038abc5977ec71e655439374b31f34e49b5734416cbabdba59136501f07b99e", "version.json": "8d37cbc7fd7268fcb9ec2004c1fa12ca97d519011b3a7df4adcef375db838ad9"};
const names=['index.html','version.json','manifest.webmanifest','training-os-loop-v1-180.png','training-os-loop-v1-192.png','training-os-loop-v1-512.png','training-os-loop-v1-1024.png'];
const workflow=fs.readFileSync('.github/workflows/release-pages.yml','utf8');
const validate=workflow.split('  validate:\n')[1].split('\n  deploy:\n')[0];
const deploy=workflow.split('\n  deploy:\n')[1];
const expression=deploy.split('    if: >-\n')[1].split('    runs-on:')[0].trim();
const sha='a'.repeat(40),checks=[];
function test(name,fn){fn();checks.push(name);console.log('PASS | RELEASE_CONTROL '+name)}
function state(over={}){return {github:{event_name:'workflow_dispatch',ref:'refs/heads/main',sha,...over.github},inputs:{publish:true,approved_sha:sha,...over.inputs},needs:{validate:{result:'success',outputs:{source_sha:sha,artifact_sha256:'b'.repeat(64),artifact_id:'123'},...over.validate}}}}
function eligible(s){return vm.runInNewContext(expression,s)}
for(const[name,over]of [
 ['main push cannot publish',{github:{event_name:'push'},inputs:{publish:undefined,approved_sha:undefined}}],
 ['push cannot be upgraded through inputs',{github:{event_name:'push'}}],
 ['non-main dispatch denied',{github:{ref:'refs/heads/codex/other'}}],
 ['tag dispatch denied',{github:{ref:'refs/tags/v4'}}],
 ['validation-only dispatch denied',{inputs:{publish:false}}],
 ['mismatched approved SHA denied',{inputs:{approved_sha:'0'.repeat(40)}}],
 ['missing approved SHA denied',{inputs:{approved_sha:undefined}}],
 ['failed validation denied',{validate:{result:'failure'}}],
 ['skipped validation denied',{validate:{result:'skipped'}}],
 ['cancelled validation denied',{validate:{result:'cancelled'}}],
 ['different validated source denied',{validate:{outputs:{source_sha:'1'.repeat(40),artifact_sha256:'b'.repeat(64),artifact_id:'123'}}}],
])test(name,()=>assert.equal(eligible(state(over)),false));
test('exact main dispatch requires a verified artifact before reaching the hold',()=>{
 assert.equal(eligible(state()),true);
 for(const missing of ['artifact_sha256','artifact_id']){const s=state();s.needs.validate.outputs[missing]='';assert.equal(eligible(s),false)}
});
function approved({reviewer,approval}){return eligible(state())&&reviewer==='fevaldez'&&approval===true}
test('owner approval cannot be inferred from dispatch',()=>assert.equal(approved({reviewer:'fevaldez',approval:false}),false));
test('explicit owner approval may include owner-triggered runs under approved self-review policy',()=>assert.equal(approved({reviewer:'fevaldez',approval:true}),true));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'training-os-controls-'));
try{
 test('main movement after the approval hold rejects publication',()=>{
  const command=deploy.split('        run: |\n')[1].split('\n      - name: Configure Pages')[0].split('\n').map(l=>l.slice(10)).join('\n');
  const bin=path.join(temporary,'bin');fs.mkdirSync(bin);fs.writeFileSync(path.join(bin,'git'),'#!/bin/sh\nprintf "%s\\trefs/heads/main\\n" "$CONTROL_MAIN"\n',{mode:0o700});
  const execute=current=>cp.spawnSync('bash',['-e','-c',command],{env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,CONTROL_MAIN:current,APPROVED_SHA:sha},encoding:'utf8'});
  assert.equal(execute(sha).status,0);assert.notEqual(execute('c'.repeat(40)).status,0);
 });
 test('approval must be attributed to the configured owner',()=>assert.equal(approved({reviewer:'unapproved-user',approval:true}),false));
 test('validation has only contents-read and cannot configure or deploy Pages',()=>{
  assert.equal(workflow.split('\npermissions:\n')[1].split('\nconcurrency:')[0].trim(),'contents: read');
  assert(!validate.includes('    permissions:'));assert(!validate.includes('actions/configure-pages'));assert(!validate.includes('actions/deploy-pages'));
  assert(validate.includes("if: github.ref == 'refs/heads/main'"));assert(validate.includes('persist-credentials: false'));assert(validate.includes('fetch-depth: 0'));
 });
 test('deployment writes are confined to the protected dependent job',()=>{
  assert(deploy.includes('needs: validate'));assert(deploy.includes('      name: github-pages'));
  assert(deploy.includes('      pages: write')&&deploy.includes('      id-token: write'));
  assert(deploy.indexOf('Reject a stale approval')<deploy.indexOf('actions/configure-pages'));
  assert(deploy.indexOf('actions/configure-pages')<deploy.indexOf('actions/deploy-pages'));
 });
 test('all mandatory release, durability and M5 gates precede upload without optional skips',()=>{
  const commands=['python scripts/validate_release.py','node scripts/test_engine.js','node scripts/test_ui_static.js','python3 scripts/test_reliability_rc621.py','node tests/storage_durability.test.js','node tests/m5_load.test.js','node tests/superset_skip.test.js','node tests/release_controls.test.js','node tests/storage_g3_browser.test.js --original-suite','node tests/storage_g3_browser.test.js','node tests/m5_load_browser.test.js','node tests/m5_scroll_browser.test.js','node tests/superset_skip_browser.test.js'];
  const upload=validate.indexOf('actions/upload-pages-artifact@v5');assert(upload>0);
  for(const command of commands){const at=validate.indexOf(command);assert(at>=0&&at<upload,command)}
  const prWorkflow=fs.readFileSync('.github/workflows/validate-pr.yml','utf8');
  assert(prWorkflow.includes('run: node tests/superset_skip.test.js'),'PR must run permanent superset-skip regression');
  assert(!validate.includes('continue-on-error'));assert(!validate.includes('      if:'));assert(!validate.includes('|| true'));
  assert(validate.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));assert(validate.includes('test "$REQUESTED_SHA" = "$GITHUB_SHA"'));
  assert(validate.indexOf('Verify the actual Pages archive')>upload);
 });
 const guard=fs.readFileSync('tests/storage_g3.test.js','utf8');
 const f=guard.slice(guard.indexOf('function workflowGate(){'),guard.indexOf('async function run('));
 function gate({badRelease=false,badPR=false}={}){
  const customRequire=n=>n==='node:fs'?{readFileSync:(file,encoding)=>{const suffix=(file.endsWith('/release-pages.yml')?badRelease:badPR)?Buffer.from('\n'):Buffer.alloc(0);const b=Buffer.concat([fs.readFileSync(file),suffix]);return encoding?b.toString(encoding):b}}:require(n);
  return new Function('require','assert',f+';return workflowGate;')(customRequire,assert)();
 }
 test('F7 exact approved workflow bytes and read-only PR workflow pass',()=>gate());
 test('F7 rejects one-byte release-workflow mutation',()=>assert.throws(()=>gate({badRelease:true})));
 test('F7 rejects one-byte PR-workflow mutation',()=>assert.throws(()=>gate({badPR:true})));
 test('exact hotfix assets and the source-bound archive reject extra or altered bytes',()=>{
  const old=cp.execFileSync('git',['show',RC+':.github/workflows/release-pages.yml'],{encoding:'utf8'});
  const build=s=>s.split('      - name: Build deploy artifact\n')[1].split('\n      - name:')[0];assert.equal(build(workflow),build(old));
  const site=path.join(temporary,'site');fs.mkdirSync(site);
  for(const name of names){const expected=cp.execFileSync('git',['show',RC+':'+name]);if(hotfixAssets[name])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex'),hotfixAssets[name],name);else assert.deepEqual(fs.readFileSync(name),expected,name);fs.writeFileSync(path.join(site,name),cp.execFileSync('git',['show','HEAD:'+name]))}
  const command=validate.split('      - name: Verify the actual Pages archive against the source SHA\n')[1].split('        run: |\n')[1].trimEnd().split('\n').map(l=>l.slice(10)).join('\n');
  const source=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const archive=()=>cp.execFileSync('tar',['-cf',path.join(temporary,'artifact.tar'),'-C',site,'.'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
  const run=()=>cp.spawnSync('bash',['-e','-c',command],{env:{...process.env,RUNNER_TEMP:temporary,GITHUB_OUTPUT:path.join(temporary,'outputs'),GITHUB_SHA:source},encoding:'utf8'});
  archive();let r=run();assert.equal(r.status,0,r.stderr);const receipt=JSON.parse(r.stdout);assert.equal(receipt.sourceSha,source);assert.equal(Object.keys(receipt.files).length,7);assert.equal(receipt.artifactSHA256,crypto.createHash('sha256').update(fs.readFileSync(path.join(temporary,'artifact.tar'))).digest('hex'));
  fs.writeFileSync(path.join(site,'unexpected.txt'),'synthetic');archive();assert.notEqual(run().status,0);fs.unlinkSync(path.join(site,'unexpected.txt'));
  fs.appendFileSync(path.join(site,'index.html'),' ');archive();assert.notEqual(run().status,0);
 });
}finally{fs.rmSync(temporary,{recursive:true,force:true})}
assert.equal(checks.length,23);console.log('RELEASE_CONTROL_TOTAL 23/23 PASS (offline predicates, permissions, pin and archive; live hold verified separately)');
