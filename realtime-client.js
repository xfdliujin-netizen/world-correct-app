// Loaded inside the app closure; the browser keeps a durable outbox across reloads.
const RT_KEY='hanzi.pubsub.v1', RT_OUT='hanzi.pubsub.outbox.v1';
const RT={ws:null, revision:0, ready:false, dirty:!!localStorage.getItem(RT_OUT), seq:0, flight:null, pending:null, timer:null, retry:0};
function rtConfig(){try{return JSON.parse(localStorage.getItem(RT_KEY)||'{}');}catch(e){return {};}}
function rtStatus(text){const el=$('rtStatus');if(el) el.textContent=text;}
function rtChanged(){
  RT.dirty=true; RT.seq++;
  localStorage.setItem(RT_OUT,'1');
  clearTimeout(RT.publishTimer); RT.publishTimer=setTimeout(rtPublish,300);
}
function rtPublish(){
  if(!RT.ready || !RT.dirty || RT.pending || RT.flight!==null) return;
  RT.flight=RT.seq;
  RT.ws.send(JSON.stringify({type:'publish',base:RT.revision,seq:RT.seq,words:S.words}));
  rtStatus('正在发布改动…');
}
function rtApply(m){
  if(!Array.isArray(m.words)) return;
  const words=m.words.map(normalizeWord);
  if(words.some(w=>!w)){rtStatus('同步内容格式不正确');return;}
  S.words=words;
  localStorage.setItem(KEY,JSON.stringify(words));
  localStorage.setItem(META_KEY,JSON.stringify({updatedAt:m.updatedAt}));
  updateCounts(); renderLib(); startRound(null);
  if(S.tab==='game'){GAME.items=[];renderGameChips();gameShowGuide();renderGameIdle();}
  rtStatus('已实时同步 · 版本 '+m.revision);
}
function rtConnect(){
  clearTimeout(RT.timer);
  const c=rtConfig(); if(!c.url || !c.secret) return;
  if(RT.ws){RT.ws.onclose=null;RT.ws.close();}
  RT.ready=false;RT.flight=null;
  let ws;
  try{ws=new WebSocket(c.url);}catch(e){rtStatus('同步地址无效');return;}
  RT.ws=ws; rtStatus('正在连接实时同步…');
  ws.onopen=()=>ws.send(JSON.stringify({type:'subscribe',secret:c.secret}));
  ws.onmessage=e=>{
    let m;try{m=JSON.parse(e.data);}catch(e){return;}
    if(m.type==='ack'){
      RT.revision=m.revision;RT.flight=null;
      if(m.seq===RT.seq){RT.dirty=false;localStorage.removeItem(RT_OUT);}
      rtStatus('实时同步已连接 · 版本 '+m.revision);rtPublish();return;
    }
    if(m.type==='error'){RT.flight=null;rtStatus(m.message);return;}
    if(m.type!=='snapshot' && m.type!=='conflict') return;
    const previous=RT.revision; RT.revision=m.revision;RT.ready=true;RT.retry=0;
    if(m.words===null){rtChanged();rtPublish();return;}
    if(RT.dirty && JSON.stringify(S.words)===JSON.stringify(m.words)){
      RT.dirty=false;RT.flight=null;localStorage.removeItem(RT_OUT);
    }else if(RT.dirty){
      if(m.type==='conflict' || m.revision!==previous){
        RT.flight=null;RT.pending=m;$('rtConflict').hidden=false;
        rtStatus('两台设备都有改动，请选择保留哪一份');return;
      }
      rtPublish();return;
    }else rtApply(m);
    rtStatus('实时同步已连接 · 版本 '+m.revision);
  };
  ws.onerror=()=>rtStatus('连接失败，数据已保存在本机');
  ws.onclose=e=>{
    RT.ready=false;RT.flight=null;
    if(e.code===1008){rtStatus('同步口令无效，请检查配置');return;}
    rtStatus('连接断开，正在重连…');
    RT.timer=setTimeout(rtConnect,Math.min(30000,1000*2**Math.min(RT.retry++,5)));
  };
}
function rtInit(){
  const section=document.createElement('section');section.className='card';
  section.style.cssText='padding:16px;margin:12px 0';
  section.innerHTML='<h3>实时同步 · Pub/Sub</h3><p>各设备填写相同地址与家庭口令。Gist 另作备份。</p><label>同步地址<input id="rtUrl" type="url" placeholder="wss://sync.example.com" style="width:100%;min-height:44px"></label><label>家庭口令<input id="rtSecret" type="password" autocomplete="off" style="width:100%;min-height:44px"></label><button class="btn" id="rtSave">连接实时同步</button><button class="btn" id="rtOff">断开</button><p id="rtStatus" role="status">尚未配置实时同步</p><div id="rtConflict" hidden><p>本机和云端都有改动，未自动覆盖。</p><button id="rtRemote" class="btn">使用云端</button><button id="rtLocal" class="btn">保留本机并发布</button></div>';
  const host=$('cloudToken').closest('.modal') || $('cloudToken').parentElement.parentElement;
  (host.querySelector('.modal-body') || $('cloudToken').parentElement.parentElement).prepend(section);
  const c=rtConfig();$('rtUrl').value=c.url||'';$('rtSecret').value=c.secret||'';
  $('rtSave').onclick=()=>{
    const url=$('rtUrl').value.trim(),secret=$('rtSecret').value.trim();
    let u;try{u=new URL(url);}catch(e){toast('请填写有效的 WebSocket 地址');return;}
    if(u.protocol!=='wss:' && !(u.protocol==='ws:' && ['localhost','127.0.0.1'].includes(u.hostname))){toast('请使用 wss:// 安全连接');return;}
    if(secret.length<24){toast('家庭口令至少 24 个字符');return;}
    localStorage.setItem(RT_KEY,JSON.stringify({url,secret}));RT.revision=0;RT.pending=null;$('rtConflict').hidden=true;rtConnect();
  };
  $('rtOff').onclick=()=>{localStorage.removeItem(RT_KEY);clearTimeout(RT.timer);if(RT.ws){RT.ws.onclose=null;RT.ws.close();}RT.ready=false;rtStatus('实时同步已断开');};
  $('rtRemote').onclick=()=>{const m=RT.pending;RT.pending=null;RT.dirty=false;localStorage.removeItem(RT_OUT);$('rtConflict').hidden=true;rtApply(m);};
  $('rtLocal').onclick=()=>{RT.pending=null;$('rtConflict').hidden=true;rtPublish();};
  window.addEventListener('online',rtConnect);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) rtConnect();});
  rtConnect();
}
