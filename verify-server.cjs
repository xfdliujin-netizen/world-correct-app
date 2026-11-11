const {fork}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
// Use the runtime's bundled ws only in this offline test; production uses package.json.
const preload=__dirname+'/.ws-test-preload.cjs';
fs.writeFileSync(preload,`const M=require('module'),load=M._load;M._load=function(id,...args){if(id==='ws'){const b=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/lib/utilsBundle.js');return {WebSocketServer:b.wsServer,WebSocket:b.ws};}return load.call(this,id,...args);};`);
const secret='test-only-family-secret-12345678';let child;
const wait=ws=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('timeout')),3000);ws.addEventListener('message',e=>{clearTimeout(t);resolve(JSON.parse(e.data));},{once:true});});
async function connect(){const ws=new WebSocket('ws://127.0.0.1:18787');await new Promise(r=>ws.addEventListener('open',r,{once:true}));const p=wait(ws);ws.send(JSON.stringify({type:'subscribe',secret}));return [ws,await p];}
(async()=>{
 child=fork('./sync-server.cjs',[],{execArgv:['--require',preload],env:{...process.env,PORT:'18787',SYNC_SECRET:secret,SYNC_DATA_DIR:__dirname+'/.sync-test'}});
 await new Promise(r=>setTimeout(r,700));
 const [a,s]=await connect(),[b]=await connect();const got=wait(b),ack=wait(a);
 a.send(JSON.stringify({type:'publish',base:s.revision,seq:1,words:[{char:'春',words:['春天']}]}));
 assert.equal((await got).words[0].char,'春');assert.equal((await ack).type,'ack');
 const conflict=wait(b);b.send(JSON.stringify({type:'publish',base:s.revision,words:[]}));assert.equal((await conflict).type,'conflict');
 const empty=wait(a),ack2=wait(b);b.send(JSON.stringify({type:'publish',base:s.revision+1,seq:2,words:[]}));assert.deepEqual((await empty).words,[]);await ack2;
 a.close();b.close();console.log('PASS: authenticated subscribe, cross-device publish, ack, stale revision conflict, empty-library deletion');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{child?.kill();fs.unlinkSync(preload);});
