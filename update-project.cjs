const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');
function replace(a,b){if(!s.includes(a)) throw Error('Missing: '+a.slice(0,90)); s=s.replace(a,b);}
replace('</style>', `
/* Reserve a separate header row for card badges at every screen size. */
.lib-card{padding-top:36px;}
@media (pointer:coarse), (min-width:600px){
  #entryInkBtns .mini,#entryCharBtns .mini{min-height:48px;min-width:76px;padding:0 18px;font-size:16px;}
  .cand-row{flex-wrap:wrap;gap:12px;}
  #entryInkBtns{gap:12px;}
}
.word-entry{border:1px solid var(--line);border-radius:14px;padding:14px;}
.word-entry summary{cursor:pointer;font-weight:600;min-height:36px;}
.word-entry .desc{display:block;margin:8px 0;line-height:1.6;}
.word-entry .input{width:100%;margin-bottom:10px;}
</style>`);
replace('            <div class="entry-form">', `            <div class="entry-form">
              <details class="word-entry">
                <summary>整词录入</summary>
                <label class="desc" for="entryWholeWord">输入 2～12 个汉字的词语，按字加入错字本，原词保留为组词。已有字保留复习进度。</label>
                <input id="entryWholeWord" class="input" placeholder="例如：介绍、荷花（一次一个词）" maxlength="12" />
                <button id="btnSaveWholeWord" class="btn btn-soft" type="button">将整词加入错字本</button>
              </details>`);
replace('function saveEntry(){', `function saveWholeWord(){
  const word = $('entryWholeWord').value.trim();
  if(!/^[\\u4e00-\\u9fa5]{2,12}$/.test(word)){ toast('请输入 2～12 个汉字，一次录入一个词语'); return; }
  const chars = Array.from(new Set(word));
  let added = 0;
  chars.slice().reverse().forEach(function(ch){
    const existing = S.words.find(function(w){ return w.char === ch; });
    if(existing){
      if(existing.words.indexOf(word) === -1) existing.words.unshift(word);
      existing.pinyin = pyOf(ch, existing.words) || existing.pinyin;
      return;
    }
    const d = DICT[ch] || LEX[ch] || {};
    const sentence = d.sentence || ('用「' + word + '」记住「' + ch + '」的写法。');
    S.words.unshift({char:ch,pinyin:pyOf(ch,[word]) || '',words:[word],sentence:sentence,
      sentences:[sentence],count:0,mastered:false,createdAt:Date.now()});
    added++;
  });
  save(); renderLib();
  $('entryWholeWord').value = '';
  toast('已录入「' + word + '」：新增 ' + added + ' 个字，已有字保留进度');
}

function saveEntry(){`);
replace("  $('entryChar').addEventListener('input', onCharInput);", "  $('btnSaveWholeWord').addEventListener('click', saveWholeWord);\n  $('entryChar').addEventListener('input', function(e){ if(!e.isComposing) onCharInput(); });\n  $('entryChar').addEventListener('compositionend', onCharInput);");
replace('return 0.5 + p * 1.05;', 'return 0.65 + p * 0.55;');
replace('return Math.max(9, this.w * 0.062);','return Math.max(2.5, Math.min(5, this.w * 0.012));');
replace('    const last = pts[pts.length - 1];\n\n    const feed', '    let last = pts[pts.length - 1];\n\n    const feed');
replace('      drawSeg(pts[pts.length-2], p, prevMid);','      drawSeg(pts[pts.length-2], p, prevMid);\n      last = p;');
// Finish each smoothed curve at its final point, including after redraw.
replace('  this.redraw = function(){', `  function drawTail(pts){
    if(pts.length < 2) return;
    const a = pts[pts.length-2], b = pts[pts.length-1];
    const ctx = self.ctx;
    ctx.beginPath(); ctx.lineCap = 'round'; ctx.strokeStyle = self.penColor();
    ctx.lineWidth = self.baseW() * b.p;
    ctx.moveTo((a.x+b.x)/2, (a.y+b.y)/2); ctx.lineTo(b.x,b.y); ctx.stroke();
  }
  this.redraw = function(){`);
replace('        lastMid = drawSeg(st.pts[i-1], st.pts[i], lastMid);\n      }','        lastMid = drawSeg(st.pts[i-1], st.pts[i], lastMid);\n      }\n      drawTail(st.pts);');
replace('    if(self.cur){\n      if(self.cur.pts.length === 1)', '    if(self.cur){\n      if(e.type === \'pointerup\'){\n        const p = pos(e); p.p = self.cur.pts[self.cur.pts.length-1].p;\n        self.cur.pts.push(p);\n      }\n      drawTail(self.cur.pts);\n      if(self.cur.pts.length === 1)');
// Do not schedule recognition while a pointer is down; defer until an idle pause.
replace("  const n = entryPad.strokes.length;", "  if(entryPad.pid !== null) return;\n  const n = entryPad.strokes.length;");
replace('setTimeout(runEntryRecognize, 900)', 'setTimeout(runEntryRecognize, 1400)');
replace('    lastInkSig = sig;', "    if(entryMode !== 'ink' || inkSignature(entryPad) !== sig) return;\n    lastInkSig = sig;");
// Use the spoken word as evidence when the final character is a homophone.
replace("  if(uniq.length === 1) return { ch:uniq[0], strong:true, cands:uniq };", `  const context = parts.length > 1 ? parts.slice(0,-1).join('') : '';
  if(context && uniq.length === 1){
    const heard = uniq[0];
    const sound = function(c){ return (pyOf(c, [context]) || '').normalize('NFD').replace(/[\\u0300-\\u036f0-9\\s]/g, '').toLowerCase(); };
    const target = sound(heard);
    const matches = Array.from(new Set(Array.from(context))).filter(function(c){ return c === heard || (target && sound(c) === target); });
    if(matches.length){
      const cands = Array.from(new Set(matches.concat(heard)));
      return {ch:matches[0], strong:cands.length === 1, cands:cands};
    }
  }
  if(uniq.length === 1) return { ch:uniq[0], strong:true, cands:uniq };`);
replace("  if(!cloudOn() || !CLOUD.auto || CLOUD.busy) return;", "  if(!cloudOn() || !CLOUD.auto) return;\n  if(CLOUD.busy){ CLOUD.dirty = true; return; }");
replace("  let wait = (delay == null ? 6000 : delay);\n  const since = Date.now() - (CLOUD.lastSync || 0);\n  if(since < 60000) wait = Math.max(wait, 60000 - since); // 冷却中：顺延到满 1 分钟", "  const wait = delay == null ? 1500 : delay;");
replace('  CLOUD.timer = setTimeout(function(){\n    if(!cloudOn()', '  CLOUD.queued = true;\n  refreshCloudUI();\n  CLOUD.timer = setTimeout(function(){\n    CLOUD.timer = null;\n    if(!cloudOn()');
replace('    CLOUD.busy = true;\n    cloudPush()', '    CLOUD.busy = true;\n    CLOUD.queued = false; CLOUD.dirty = false;\n    refreshCloudUI();\n    cloudPush()');
replace('      CLOUD.retry = 0;\n      refreshCloudUI();', '      CLOUD.retry = 0;\n      if(CLOUD.dirty) cloudSyncSoon();\n      refreshCloudUI();');
replace("      /* 网络抖动不打扰用户；只有令牌/权限问题才在界面上标红 */", "      CLOUD.queued = true;\n      CLOUD.lastErr = '备份未完成，数据已保存在本机';\n      /* 网络失败保留本机数据并重试 */");
replace('    updatedAt: Date.now(),\n    device:', '    updatedAt: localAt() || Date.now(),\n    device:');
replace("  try{ localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: payload.updatedAt })); }catch(e){}\n  return payload;", '  return payload;');
replace("  const on = cloudOn();\n  const title", "  const on = cloudOn();\n  const status = CLOUD.busy ? '正在备份…' : CLOUD.queued ? '本机已保存 · 等待云端备份' : CLOUD.auto ? '自动备份已开启' : '自动备份已关闭';\n  const title");
replace("'已连接 · 上次备份 ' + agoText(CLOUD.lastSync)", "status + ' · 上次备份 ' + agoText(CLOUD.lastSync)");
replace("(CLOUD.lastErr ? '同步异常' : '已连接')", "(CLOUD.lastErr ? '同步异常' : status)");
replace("    saveCloud();\n    toast(CLOUD.auto ?", "    saveCloud();\n    if(CLOUD.auto) cloudSyncSoon(0);\n    else { clearTimeout(CLOUD.timer); CLOUD.timer = null; CLOUD.queued = false; }\n    refreshCloudUI();\n    toast(CLOUD.auto ?");
replace("      : '连上 GitHub 后，每次改动都会自动备份到你的私有 Gist';", "      : '云端备份可选，数据先存本机；连接后可随时关闭自动上传';");
replace("    if(document.hidden) return;", "    if(document.hidden){ if(CLOUD.queued) cloudSyncSoon(0); return; }\n    if(cloudOn() && CLOUD.auto && localAt() > (CLOUD.remoteAt || CLOUD.lastSync)) cloudSyncSoon(0);");
replace("/* 改动后延迟上传：攒 6 秒，且两次自动上传至少间隔 1 分钟（避免 Gist 历史里全是碎记录）；\n   手动点「立即备份」不受冷却限制 */", "/* 改动先存本机，停止操作 1.5 秒后上传；上传期间的新改动排队补传。 */");
fs.writeFileSync('index.html',s); fs.writeFileSync('world-correct.html',s);
const sw=fs.readFileSync('sw.js','utf8').replace("czb-v8","czb-v9"); fs.writeFileSync('sw.js',sw);
