/* Gist stores private data; MQTT transports lightweight notifications only. */
const SIGNAL={client:null,identity:'',topic:'',loading:null,connecting:false,status:'等待连接',pulling:false,timer:null,target:0};
function signalStatus(s){SIGNAL.status=s;const el=$('mqttStatus');if(el)el.textContent='实时通知：'+s;}
function mqttLibrary(){
  if(window.mqtt)return Promise.resolve(window.mqtt);
  if(SIGNAL.loading)return SIGNAL.loading;
  SIGNAL.loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/mqtt@5.10.4/dist/mqtt.min.js';s.onload=()=>window.mqtt?resolve(window.mqtt):reject(Error('MQTT unavailable'));s.onerror=()=>{s.remove();reject(Error('MQTT unavailable'));};document.head.appendChild(s);}).catch(e=>{SIGNAL.loading=null;throw e;});return SIGNAL.loading;
}
function stopCloudSub(){if(SIGNAL.client)SIGNAL.client.end(true);SIGNAL.client=null;SIGNAL.identity='';clearTimeout(SIGNAL.timer);signalStatus('已关闭');}
async function startCloudSub(){
  if(!cloudOn() || !CLOUD.auto){stopCloudSub();return;}
  const id=CLOUD.gistId+'|'+CLOUD.token;
  if((SIGNAL.identity===id && SIGNAL.client) || SIGNAL.connecting)return;
  stopCloudSub();SIGNAL.connecting=true;signalStatus('正在连接 MQTT…');
  try{
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('world-correct-v1|'+id));
    const topic='world-correct/v1/'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    const mqtt=await mqttLibrary();
    if(!cloudOn() || !CLOUD.auto || id!==CLOUD.gistId+'|'+CLOUD.token)return;
    SIGNAL.identity=id;SIGNAL.topic=topic;
    const client=mqtt.connect('wss://broker.emqx.io:8084/mqtt',{clean:true,reconnectPeriod:3000,connectTimeout:10000,keepalive:30});SIGNAL.client=client;
    client.on('connect',()=>client.subscribe(topic,{qos:1},err=>{signalStatus(err?'订阅失败':'已连接 · 通知后立即拉取');if(!err)cloudSubTick();}));
    client.on('message',(t,p)=>{if(t!==SIGNAL.topic || p.length>256)return;try{const m=JSON.parse(p.toString());if(m.type==='updated' && Number.isFinite(m.at) && m.at>0){SIGNAL.target=Math.max(SIGNAL.target,m.at);cloudSubTick();}}catch(e){}});
    client.on('reconnect',()=>signalStatus('正在重连…'));
    client.on('offline',()=>signalStatus('离线，本机数据已保存'));
    client.on('error',()=>signalStatus('连接异常，回到前台仍会对齐'));
  }catch(e){signalStatus('通知不可用，回到前台仍会对齐');}finally{SIGNAL.connecting=false;}
}
function signalPublish(at){startCloudSub();if(SIGNAL.client?.connected)SIGNAL.client.publish(SIGNAL.topic,JSON.stringify({type:'updated',at}),{qos:1,retain:false});}
async function cloudSubTick(attempt=0){
  if(!cloudOn() || !CLOUD.auto || document.hidden || CLOUD.pending)return;
  if(SIGNAL.pulling || CLOUD.busy || CLOUD.queued){clearTimeout(SIGNAL.timer);SIGNAL.timer=setTimeout(()=>cloudSubTick(),1800);return;}
  SIGNAL.pulling=true;
  try{
    const remote=await cloudFetch();if(!remote || !Array.isArray(remote.words))return;
    if(remote.updatedAt>(CLOUD.remoteAt||0)){
      if(localAt()>(CLOUD.remoteAt||0) && !isPristineLocal())showCloudConflict(remote);
      else{CLOUD.remoteAt=remote.updatedAt;cloudApplyRemote(remote,true);toast('已同步其他设备的改动');}
    }
    if(remote.updatedAt<SIGNAL.target && attempt<3){clearTimeout(SIGNAL.timer);SIGNAL.timer=setTimeout(()=>cloudSubTick(attempt+1),1000*2**attempt);}
  }catch(e){signalStatus('拉取失败，回到前台可重试');if(attempt<3){clearTimeout(SIGNAL.timer);SIGNAL.timer=setTimeout(()=>cloudSubTick(attempt+1),2000*2**attempt);}}
  finally{SIGNAL.pulling=false;}
}
function refreshSignalStatus(){signalStatus(SIGNAL.status);}
function signalInit(){
  const p=document.createElement('p');p.id='mqttStatus';p.setAttribute('role','status');p.style.cssText='padding:0 20px;font-size:13px';$('modalCloud').querySelector('.panel-head').after(p);refreshSignalStatus();
  window.addEventListener('online',()=>{startCloudSub();cloudSubTick();});
}
