'use strict';
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{webcrypto}=require('node:crypto');
const BASE='8dd621d05ef66baa9773518c4a45ac3bdd7ed5d1';
const source=(file,baseline=false)=>baseline?execFileSync('git',['show',BASE+':'+file],{encoding:'utf8'}):fs.readFileSync(file,'utf8');
const origin='https://synthetic.invalid',scope=origin+'/training-os/';
function worker({baseline=false,store=new Map(),fault='',alter,script,registrationScope=scope}={}){
 const listeners={},calls=[],net=[];let puts=0;
 const key=q=>new URL(typeof q==='string'?q:q.url,scope).href;
 const caches={async keys(){return [...store.keys()]},async delete(n){calls.push(['delete',n]);return store.delete(n)},async has(n){return store.has(n)},async open(n){if(fault==='cache-open')throw Error('synthetic Cache API unavailable');if(!store.has(n))store.set(n,new Map());const m=store.get(n);return {async keys(){return [...m.keys()].map(k=>new Request(k))},async match(q){if(fault==='cache-read')throw Error('synthetic cache readback failure');return m.get(key(q))?.clone()},async put(q,r){if(fault==='quota'&&++puts===3)throw new DOMException('synthetic quota','QuotaExceededError');m.set(key(q),r.clone())},async addAll(){throw Error('legacy addAll not a verified installation')}}},async match(q){for(const m of store.values())if(m.has(key(q)))return m.get(key(q)).clone()}};
 const fetch=async q=>{const url=key(q);net.push(url);if(fault==='network')throw Error('offline');const file=new URL(url).pathname.split('/').at(-1)||'index.html';let bytes=fs.readFileSync(file);const headers={'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':file.endsWith('.webmanifest')?'application/manifest+json':'image/png','Cache-Control':'no-store'};let status=200;if(file==='index.html'){if(fault==='hash')bytes=Buffer.concat([bytes,Buffer.from('x')]);if(fault==='portal')headers['Content-Type']='text/plain';if(fault==='http')status=503;if(fault==='size')bytes=bytes.subarray(0,30)}if(alter)({bytes,status}=alter(file,bytes,status));const response=new Response(bytes,{status,headers});if(fault==='redirect'&&file==='index.html')Object.defineProperty(response,'redirected',{value:true});return response};
 const c={URL,Request,Response,Headers,TextEncoder,crypto:webcrypto,Uint8Array,ArrayBuffer,Map,Set,Promise,fetch,caches,console,self:{location:new URL(scope+'sw.js'),registration:{scope:registrationScope},clients:{claim(){calls.push(['claim'])}},skipWaiting(){calls.push(['skipWaiting'])},addEventListener(n,f){listeners[n]=f}}};
 vm.createContext(c);vm.runInContext(script||source('sw.js',baseline),c);
 async function event(n,extra={}){const waits=[];let response;listeners[n]?.({...extra,waitUntil(p){waits.push(p)},respondWith(p){response=p}});await Promise.all(waits);return response?await response:undefined}
 return {c,store,caches,calls,net,event,meta:()=>vm.runInContext('({BUILD,CACHE})',c)};
}
module.exports={BASE,source,scope,origin,worker};
