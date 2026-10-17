'use strict';
// Exact reviewed P0 function pins; never ignore an arbitrary function or validator change.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const BASE='89e8cae016386a1c5f27a4f5d7e7bc2eecc6db18';
const original=execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8'});
const ends={"nextTransition": "function remainingSeconds(", "skipCurrentSet": "function skipRemainingExercise(", "completeSet": "function renderTransition(", "renderTransition": "function fmtTime("},pins={"nextTransition": "27316eb37249567e1d7a37d7b0e44ed72c8892a3d3945b4087033612de0dfb06", "skipCurrentSet": "0a67690400dcd947ee708ef172ab59cd06ed5c4fa4b96fe201ecddc80c3ebac3", "completeSet": "d21e09df3b06f8c7036e72bffd9404cb08e4b8cd4f6d5e5f87c99da88735dc20", "renderTransition": "a6c322d3220c02afba886db59a19072f4d3ef81c255e5cdd01ac019ed0f5602f"};
function range(s,name){const a=s.indexOf('function '+name+'('),b=s.indexOf(ends[name],a);assert(a>=0&&b>a,name);return {a,b,body:s.slice(a,b)}}
function restore(html){let s=html;for(const name of Object.keys(ends)){const r=range(s,name);assert.equal(createHash('sha256').update(r.body).digest('hex'),pins[name],name+' differs from approved P0 correction');s=s.slice(0,r.a)+range(original,name).body+s.slice(r.b)}return s}
function assertScope(html){assert.equal((html.match(/4\.0\.0-rc6\.3\.1/g)||[]).length,5);assert.equal(restore(html).replaceAll('4.0.0-rc6.3.1','4.0.0-rc6.3'),original,'unexpected production change outside four pinned P0 functions and five release sites')}
module.exports={BASE,restore,assertScope};
