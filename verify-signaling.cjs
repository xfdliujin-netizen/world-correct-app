const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},sent=[];let fetched=0,applied=0,conflicts=0;
const client={connected:true,on:(n,fn)=>handlers[n]=fn,subscribe:(t,o,cb)=>cb(null),publish:(...args)=>sent.push(args),end:()=>{}};
const ctx=vm.createContext({crypto:require('node:crypto').webcrypto,TextEncoder,Uint8Array,Array,JSON,Number,Promise,Math,
 window:{mqtt:{connect:()=>client}},document:{hidden:false},$:()=>null,clearTimeout:()=>{},setTimeout:()=>1,
 CLOUD:{gistId:'test-gist',token:'test-token',auto:true,remoteAt:10},cloudOn:()=>true,localAt:()=>10,isPristineLocal:()=>false,
 cloudFetch:async()=>{fetched++;return {updatedAt:20,words:[]};},cloudApplyRemote:r=>{assert.equal(r.words.length,0);applied++;},toast:()=>{},showCloudConflict:()=>conflicts++});
vm.runInContext(fs.readFileSync('realtime-client.js','utf8'),ctx);
(async()=>{
 await vm.runInContext('startCloudSub()',ctx);handlers.connect();await new Promise(r=>setImmediate(r));
 assert.equal(fetched,1);assert.equal(applied,1);
 vm.runInContext('signalPublish(25)',ctx);assert.deepEqual(JSON.parse(sent[0][1]),{type:'updated',at:25});
 assert.ok(!sent[0][0].includes('test-token'));assert.equal(sent[0][2].retain,false);
 ctx.CLOUD.remoteAt=10;ctx.localAt=()=>15;
 await vm.runInContext('cloudSubTick()',ctx);assert.equal(conflicts,1);
 console.log('PASS: MQTT subscription catch-up, timestamp-only publication, hashed topic, empty library synchronization, local-edit conflict');
})().catch(e=>{console.error(e);process.exitCode=1;});
