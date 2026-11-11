const fs=require('node:fs');
let h=fs.readFileSync('index.html','utf8');
h=h.replace('  touchMeta();\n  updateCounts();','  touchMeta();\n  rtChanged();\n  updateCounts();');
const start=h.indexOf('/* ---- pub/sub 订阅：');
const end=h.indexOf('function showCloudConflict',start);
h=h.slice(0,start)+'/* 实时订阅由 WebSocket 推送；Gist 仅用于持久备份。 */\nfunction startCloudSub(){}\nfunction stopCloudSub(){}\nasync function cloudSubTick(){}\n\n'+h.slice(end);
h=h.replace('function boot(){',fs.readFileSync('realtime-client.js','utf8')+'\nfunction boot(){');
h=h.replace('  loadAi();','  loadAi();\n  rtInit();');
h=h.replace('其他设备的改动约 20 秒内自动同步过来','实时同步请配置上方 Pub/Sub 连接');
h=h.replace('  // pub/sub 订阅：App 打开期间每 20 秒探测云端，其他设备的改动自动同步过来','  // WebSocket 订阅在 rtInit 中启动');
h=h.replace('   —— 发布：数据改动后自动上传；订阅：App 打开期间每 20 秒探测云端，\n      其他设备的改动自动同步过来（cloudSubTick）','   —— GitHub Gist 仅作备份；实时同步使用 WebSocket Pub/Sub。');
h=h.replace("  if(!i.length && !s.length) return null;","  if(i.length !== 3 || s.length !== 3 || new Set(i).size !== 3 || new Set(s).size !== 3) return null;");
h=h.replace("j.idioms.map(function(s){ return String(s).trim(); })","Array.from(new Set(j.idioms.filter(s=>typeof s==='string').map(s=>s.trim())))");
h=h.replace("j.sentences.map(function(s){ return String(s).trim(); })","Array.from(new Set(j.sentences.filter(s=>typeof s==='string').map(s=>s.trim())))");
h=h.replace('s.length >= 3 && s.length <= 10','s.length === 4');
h=h.replace('s.length >= 8 && s.length <= 60',"s.replace(/[^\\u3400-\\u9fff]/g,'').length >= 15 && s.replace(/[^\\u3400-\\u9fff]/g,'').length <= 30");
h=h.replace('if(!r.idioms.length || !r.sentences.length){','if(r.idioms.length !== 3 || r.sentences.length !== 3){');
h=h.replace("if(!r.idioms.length && !r.sentences.length) throw new Error('AI 没有生成包含「' + ch + '」的内容');","if(r.idioms.length !== 3 || r.sentences.length !== 3) throw new Error('未能生成 3 个规范成语和 3 个合格句子。该字可能没有足够的常见成语，请换字或重试；不会用生造成语凑数。');");
h=h.replace('const res = await fetch(\'https://api.deepseek.com/chat/completions\', {',"const res = await fetch('https://api.deepseek.com/chat/completions', {\n    signal: AbortSignal.timeout(60000),");
h=h.replace('max_tokens: 700','max_tokens: 1200');
h=h.replace('/* ---------- DeepSeek 调用（浏览器直连，已验证支持 CORS） ---------- */','/* ---------- DeepSeek 调用（用户自己的 Key，仅保存在本机） ---------- */');
h=h.replace('</style>',`\n/* iPhone landscape / iPad split view: allow content scrolling rather than clipping. */
#view-game .game-chips{overflow:auto;max-height:140px;}
#view-game .gq-text{overflow-wrap:anywhere;}
@media(max-width:767px),(max-height:650px){
  #view-game .game-card{max-height:none;overflow:visible;}
  #view-game .game-body{overflow:visible;}
  #view-game .game-grid{display:flex;flex-direction:column;overflow:visible;}
  #view-game .game-write-col .tian-wrap{flex:none;}
  #view-game .game-tian{width:min(64vw,280px);}
  #view-game .game-tools button{min-height:44px;}
}
</style>`);
fs.writeFileSync('index.html',h);fs.writeFileSync('world-correct.html',h);
fs.writeFileSync('sw.js',fs.readFileSync('sw.js','utf8').replace('czb-v10','czb-v11'));
