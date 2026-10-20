'use strict';
// Preserve the existing whole-shell regression guard, accepting only this exact PR-A delta.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const baseline=execFileSync('git',['show','8dd621d05ef66baa9773518c4a45ac3bdd7ed5d1:index.html'],{encoding:'utf8'});
const start='})();\n\n// PR-A OFFLINE BOOTSTRAP START',end='const WORKOUTS =';
const pin='b17ba6c8799ca18e405253bae28a2da66cb5c27e58cf7ead125bef3c559602ca';
const card='<div class="card" id="offlineCard"><h2>Sin conexión</h2><p class="small" id="offlineStatus" role="status">Conecta para preparar el inicio sin conexión.</p></div>';
function restore(html){
 if(!html.includes('// PR-A OFFLINE BOOTSTRAP START'))return html;
 const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a);
 assert.equal(createHash('sha256').update(html.slice(a,b)).digest('hex'),pin,'unreviewed offline bootstrap mutation');
 assert.equal(html.split(card).length-1,1,'offline status card changed');
 return (html.slice(0,a)+baseline.slice(baseline.indexOf(' // RC6.2.1 migration:'),baseline.indexOf(end))+html.slice(b)).replace(card,'');
}
module.exports={restore};
