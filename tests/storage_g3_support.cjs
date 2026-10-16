'use strict';
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{webcrypto}=require('node:crypto');
const REVIEWED='84d381915f601dd189dc6fb3f96117352eb8bef3';
const H='fv4.history',A='fv4.active',U='fv4.unit',M='fv4.migrated',E='fv4.backupExtras.v1',J='fv4.recovery.v1',B='fv4.recovery.backup.v1',O='fv4.recovery.outcome.v1';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/storage/mixed-backup.json','utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
function source(reviewed=false){return reviewed?execFileSync('git',['show',REVIEWED+':index.html'],{encoding:'utf8'}):fs.readFileSync('index.html','utf8')}
class Storage{
 constructor(values={}){this.values=new Map(Object.entries(values));this.events=[];this.inject=()=>{}}
 getItem(k){this.events.push(['get',k]);const v=this.values.get(k)??null,r=this.inject('get',k,v);return r===undefined?v:r}
 setItem(k,v){this.events.push(['set',k]);this.inject('set',k,v);this.values.set(k,v)}
 removeItem(k){this.events.push(['remove',k]);this.inject('remove',k,null);this.values.delete(k)}
 mutations(){return this.events.filter(e=>e[0]!=='get')}
}
class Locks{constructor(){this.tail=Promise.resolve()}request(n,o,fn){const r=this.tail.then(fn);this.tail=r.catch(()=>{});return r}}
const seed=()=>({[H]:JSON.stringify(fixture.history),[A]:JSON.stringify(fixture.active),[U]:'"lb"',[M]:'true'});
function production(html=source(),storage=new Storage(seed()),locks=new Locks(),options={}){
 const elements=new Map();const element=()=>({textContent:'',hidden:false,replaceChildren(){},append(){},classList:{contains:()=>false},dataset:{}});
 const document={querySelector(k){if(!elements.has(k))elements.set(k,element());return elements.get(k)},querySelectorAll:()=>[],createElement:element};
 const c={crypto:webcrypto,TextEncoder,AbortController,setTimeout,clearTimeout,localStorage:storage,navigator:{locks},document,window:{addEventListener(){}},renderHome(){},renderProgress(){},exportBackup(){},renderUnits(){},startTicker(){}};
 vm.createContext(c);vm.runInContext(html.slice(html.indexOf('const WORKOUTS ='),html.indexOf("const RELEASE='"))+"const RELEASE='4.0.0-rc6.2.1';\n"+html.slice(html.indexOf('// DATA DURABILITY CORE START'),html.indexOf('// DATA DURABILITY CORE END'))+';globalThis.api={createDurability,WORKOUTS};',c);
 const d=c.api.createDurability(storage,locks,c.api.WORKOUTS,options);
 function ui(){vm.runInContext("const $=(s)=>document.querySelector(s),$$=()=>[];"+html.slice(html.indexOf('const durability='),html.indexOf('const escapeStoredText='))+html.slice(html.indexOf('async function setUnit('),html.indexOf("$$('[data-unit]')",html.indexOf('async function setUnit(')))+";globalThis.ui={saveActive,setUnit,retryPersistence,bootPersistence,get state(){return persistence},get store(){return store},get durability(){return durability}};",c);c.ui.state.ready=true;c.ui.state.memory=copy(fixture.active);return c.ui}
 return {c,d,storage,locks,ui};
}
function historical(){
 const out=[];
 for(const sha of ['c871672','0494bc8']){
  const src=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8'}),c={};vm.createContext(c);vm.runInContext(src.slice(src.indexOf('const WORKOUTS ='),src.indexOf('const ORDER'))+';globalThis.w=WORKOUTS;',c);
  for(const ei of [1,2,4,5]){const e=c.w.back.exercises[ei],r={...copy(fixture.history[0]),schema:4,id:sha+'-'+ei,workoutKey:'back',workoutName:c.w.back.name,sets:[{exerciseIndex:ei,exerciseName:e.name,setIndex:e.sets-1,weightKg:20,reps:8,rir:2,done:true,unknownHistorical:{sha}}]};delete r.plan;out.push({sha,ei,sets:e.sets,record:r})}
 }
 return out;
}
function realV3(){
 const old=execFileSync('git',['show','d9309cb:index.html'],{encoding:'utf8'}),{c}=production();let active,history=[];
 const v={WORKOUTS:c.api.WORKOUTS,SCHEMA:3,Date,nowISO:()=> '2026-01-01T00:00:00.000Z',getReadiness:()=>({}),prevSet:()=>null,displayUnit:'kg',saveInputsFromDOM(){},getActive:()=>active,confirm:()=>true,totalSets:()=>20,sessionVolume:()=>0,getHistory:()=>history,setHistory:h=>history=h,setActive(){},skipTimer(){},$:()=>({classList:{remove(){}}}),renderNext(){},renderProgress(){},showPage(){}};vm.createContext(v);
 const start=old.indexOf('function newSession('),finish=old.indexOf('function finishWorkout(');vm.runInContext(old.slice(start,old.indexOf('function startOrOpen(',start))+old.slice(finish,old.indexOf('function readinessAdvice(',finish))+';globalThis.make=newSession;globalThis.finish=finishWorkout;',v);
 active=v.make('chest');Object.assign(active.sets['0_0'],{done:true,reps:8,weightKg:20});v.finish();return copy(history);
}
module.exports={REVIEWED,H,A,U,M,E,J,B,O,fixture,copy,source,Storage,Locks,seed,production,historical,realV3};
