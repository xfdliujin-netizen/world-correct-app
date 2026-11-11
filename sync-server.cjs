// Deploy behind HTTPS with WebSocket forwarding. Never expose an unencrypted public endpoint.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');
const secret = process.env.SYNC_SECRET;
if (!secret || secret.length < 24) throw Error('SYNC_SECRET must contain at least 24 characters');
const dir = process.env.SYNC_DATA_DIR || path.join(__dirname, 'sync-data');
fs.mkdirSync(dir, {recursive:true});
const file = path.join(dir, 'snapshot.json');
let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {revision:0, words:null};
const server = http.createServer((req,res)=>{res.writeHead(200, {'Content-Type':'text/plain'});res.end('WorldCorrect sync ready');});
const wss = new WebSocketServer({server, maxPayload:2*1024*1024});
const send = (ws,msg)=>{if(ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(msg));};
wss.on('connection', ws=>{
  ws.alive=true;
  ws.on('pong',()=>ws.alive=true);
  const authTimer=setTimeout(()=>{if(!ws.authed) ws.close(1008,'Authentication required');},5000);
  ws.on('close',()=>clearTimeout(authTimer));
  ws.on('message', raw=>{
    try {
      const m=JSON.parse(raw);
      if(!ws.authed){
        if(m.type!=='subscribe' || m.secret!==secret) return ws.close(1008,'Invalid secret');
        ws.authed=true; clearTimeout(authTimer); return send(ws,{type:'snapshot',...state});
      }
      if(m.type==='subscribe') return send(ws,{type:'snapshot',...state});
      if(m.type!=='publish') return;
      if(m.base!==state.revision) return send(ws,{type:'conflict',...state});
      if(!Array.isArray(m.words) || m.words.length>10000 || m.words.some(w=>!w || typeof w.char!=='string' || !/^[\u3400-\u9fff]$/u.test(w.char))) return ws.close(1008,'Invalid words');
      const next={revision:state.revision+1,words:m.words,updatedAt:Date.now()};
      fs.writeFileSync(file+'.tmp',JSON.stringify(next)); fs.renameSync(file+'.tmp',file); state=next;
      send(ws,{type:'ack',revision:state.revision,seq:m.seq});
      for(const peer of wss.clients) if(peer!==ws && peer.authed) send(peer,{type:'snapshot',...state});
    } catch(e) { send(ws,{type:'error',message:'同步数据未保存，请重试'}); }
  });
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},25000);
server.on('close',()=>clearInterval(heartbeat));
server.listen(Number(process.env.PORT)||8787);
