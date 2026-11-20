const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const replace=(a,b)=>{if(!s.includes(a))throw Error(a.slice(0,100));s=s.replace(a,b);};
replace("  const ch = String(w.char || '').match(/[\\u4e00-\\u9fa5]/);\n  if(!ch) return null;\n  const c = ch[0];", "  const c = String(w.char || '').trim();\n  if(!/^[\\u4e00-\\u9fa5]{1,12}$/.test(c)) return null;");
const a=s.indexOf('function saveWholeWord(){'),b=s.indexOf('function saveEntry(){',a);
s=s.slice(0,a)+`function saveWholeWord(){
  const word = $('entryWholeWord').value.trim();
  if(!/^[\\u4e00-\\u9fa5]{2,12}$/.test(word)){ toast('请输入 2～12 个汉字，一次录入一个词语'); return; }
  if(S.words.some(function(w){ return w.char === word; })){ toast('这个词已经在字库中，复习进度已保留'); return; }
  S.words.unshift({char:word,pinyin:wordPinyin(word),words:[],sentence:'',sentences:[],count:0,mastered:false,createdAt:Date.now()});
  save(); renderLib();
  $('entryWholeWord').value = '';
  toast('已保存整词「' + word + '」，可到字库选择练习');
}

`+s.slice(b);
replace('输入 2～12 个汉字的词语，按字加入错字本，原词保留为组词。已有字保留复习进度。','输入 2～12 个汉字，保存为独立词卡，复习时逐格默写整个词语。已有单字进度不变。');
replace('<input id="entryWholeWord"', '<input id="entryWordPinyin" class="input" placeholder="词语拼音（可选，可校正多音字）" aria-label="词语拼音" />\n                <input id="entryWholeWord"');
replace('pinyin:wordPinyin(word),words:[]', "pinyin:($('entryWordPinyin').value.trim() || wordPinyin(word)),words:[]");
replace("  $('entryWholeWord').value = '';\n  toast('已保存整词", "  $('entryWholeWord').value = '';\n  $('entryWordPinyin').value = '';\n  toast('已保存整词");
// Full-word pinyin must not use the contextual single-character lookup.
replace('function pyOf(ch, ctxWords){',`function wordPinyin(word){
  if(window.pinyinPro){ try{ return window.pinyinPro.pinyin(word, {toneType:'symbol'}); }catch(e){} }
  return Array.from(word).map(function(ch){ return pyOf(ch) || '□'; }).join(' ');
}
function pyOf(ch, ctxWords){
  if(ch && ch.length > 1) return wordPinyin(ch);`);
replace('  const chars = S.queue.slice();','  const chars = Array.from(new Set(S.queue.join(\'\').split(\'\')));');
replace('  const arr = S.words.slice();',"  const arr = S.words.slice();");
replace('  return arr.map(function(w){ return w.char; });',"  return Array.from(new Set(arr.flatMap(function(w){ return Array.from(w.char); })));");
replace('  prepareWriting(item.char);',"  setupWordReview(item);\n  if(item.char.length === 1) prepareWriting(item.char);");
replace("  const item = currentItem();\n  if(ENG.cur === 'strict' && item){", "  const item = currentItem();\n  if(item && item.char.length > 1){ setupWordReview(item); return; }\n  if(ENG.cur === 'strict' && item){");
replace('function evaluate(good){\n  const item = currentItem();',"function evaluate(good){\n  if(WORD_REVIEW.credited) return;\n  const item = currentItem();");
replace('  // 已经动笔就只对下一个字生效', "  if(item && item.char.length > 1){ refreshEngineUI(); return; }\n  // 已经动笔就只对下一个字生效");
replace('function mountStroke(box, char, opts){',`function mountStroke(box, char, opts){
  if(char && char.length > 1){
    box.innerHTML = '';
    const select = document.createElement('select');
    select.setAttribute('aria-label','选择词语中的字查看笔顺');
    Array.from(char).forEach(function(ch,i){ const op=document.createElement('option');op.value=ch;op.textContent=(i+1)+' · '+ch;select.appendChild(op); });
    const inner = document.createElement('div');inner.style.cssText='width:100%;height:calc(100% - 34px);min-height:70px';
    box.append(select,inner);select.onchange=function(){mountStroke(inner,select.value,opts);};
    mountStroke(inner,char[0],opts);return;
  }`);
replace('                <div class="tian-wrap">', `                <div id="wordReview" hidden>
                  <div class="word-modes"><button type="button" class="chip" id="wordHand">逐格手写</button><button type="button" class="chip" id="wordKeyboard">键盘输入</button></div>
                  <p id="wordHelp" class="desc">按顺序在每格写一个字，写完对照整词，自评是否全部写对。</p>
                  <div id="wordCells" class="word-cells"></div>
                  <div id="wordType" hidden><input id="wordAnswer" class="input" autocomplete="off" aria-label="输入完整词语" placeholder="输入完整词语" maxlength="12" /><button type="button" class="btn btn-primary btn-sm" id="wordCheck">检查整词</button><p id="wordResult" role="status"></p></div>
                </div>
                <div class="tian-wrap">`);
replace('</style>', `
#wordReview{width:100%;min-width:0;overflow:auto;padding:8px 4px;}
#wordReview[hidden],#wordType[hidden]{display:none;}
.word-modes{display:flex;gap:8px;margin-bottom:10px;}
.word-cells{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 14px;scroll-snap-type:x proximity;}
.word-cell{flex:0 0 150px;scroll-snap-align:start;text-align:center;}
.word-cell canvas{width:150px;height:150px;display:block;touch-action:none;background:linear-gradient(90deg,transparent 49.7%,#d9d0bd 50%,transparent 50.3%),linear-gradient(transparent 49.7%,#d9d0bd 50%,transparent 50.3%),var(--paper);border:1px solid var(--line);border-radius:8px;}
.word-cell .mini{margin:6px 3px;}
.word-mode .pane-write>.tian-wrap,.word-mode .pane-write>.pad-hint,.word-mode .pane-write>.pad-tools{display:none!important;}
.word-mode .answer-char{font-size:clamp(20px,4vw,34px);overflow-wrap:anywhere;}
.lib-card.is-word .lc-char{font-size:24px;line-height:1.3;overflow-wrap:anywhere;}
.lib-card.is-word .lc-py{font-size:11px;}
#wordType{display:flex;flex-wrap:wrap;gap:10px;}#wordAnswer{min-width:0;flex:1;}
</style>`);
replace("'<button class=\"lib-card' + (on", "'<button class=\"lib-card' + (w.char.length > 1 ? ' is-word' : '') + (on");
replace("'第 ' + (S.idx + 1) + ' / ' + S.queue.length + ' 字'", "'第 ' + (S.idx + 1) + ' / ' + S.queue.length + ' 题'");
const component=`
const WORD_REVIEW = {pads:[], mode:'hand', credited:false};
function setupWordReview(item){
  WORD_REVIEW.credited=false;
  const isWord=item.char.length>1;
  $('stage').classList.toggle('word-mode',isWord);
  $('wordReview').hidden=!isWord;
  if(!isWord) return;
  stopQuiz();ENG.cur='local';
  $('wordAnswer').value='';$('wordResult').textContent='';
  for(let i=0;i<item.char.length;i++){
    if(!WORD_REVIEW.pads[i]){
      const cell=document.createElement('div');cell.className='word-cell';
      const label=document.createElement('div');label.textContent='第 '+(i+1)+' 字';
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','第 '+(i+1)+' 字书写格');
      const undo=document.createElement('button');undo.type='button';undo.className='mini';undo.textContent='撤销';
      const clear=document.createElement('button');clear.type='button';clear.className='mini';clear.textContent='清空';
      cell.append(label,canvas,undo,clear);$('wordCells').appendChild(cell);
      const p=new Pad(cell,canvas);WORD_REVIEW.pads.push(p);
      undo.onclick=function(){p.undo();};clear.onclick=function(){p.clear();};
    }
  }
  WORD_REVIEW.pads.forEach(function(p,i){p.canvas.parentElement.hidden=i>=item.char.length;p.clear();});
  setWordInputMode('hand');
}
function setWordInputMode(mode){
  WORD_REVIEW.mode=mode;
  $('wordCells').hidden=mode!=='hand';$('wordCells').style.display=mode==='hand'?'flex':'none';
  $('wordType').hidden=mode!=='keyboard';
  $('wordHand').classList.toggle('on',mode==='hand');$('wordKeyboard').classList.toggle('on',mode==='keyboard');
  $('wordHelp').textContent=mode==='hand'?'每格写一个字，可左右滑动。写完对照整词，全部写对才点「写对了」。':'输入完整词语，检查通过后记录一次正确。';
  WORD_REVIEW.pads.forEach(function(p){p.resize();});
}
function checkWholeWord(){
  const item=currentItem();if(!item || item.char.length<2 || WORD_REVIEW.credited || S.revealed) return;
  if($('wordAnswer').value.trim()!==item.char){$('wordResult').textContent='还没有完全写对，请检查每个字再试。';return;}
  reveal();creditCorrect(item);WORD_REVIEW.credited=true;
  $('btnGotIt').disabled=true;$('btnGotIt').textContent='整词正确 · 已记录';
}
`;
replace('function renderCard(){', component+'\nfunction renderCard(){');
replace('function bind(){',`function bind(){
  $('wordHand').onclick=function(){setWordInputMode('hand');};
  $('wordKeyboard').onclick=function(){setWordInputMode('keyboard');};
  $('wordCheck').onclick=checkWholeWord;
  $('wordAnswer').onkeydown=function(e){if(e.key==='Enter' && !e.isComposing){e.preventDefault();checkWholeWord();}};`);
// A focused mastered word should also be reviewable on its own.
replace("return selectedChars ? selectedChars.includes(w.char) : !w.mastered;", "return selectedChars ? selectedChars.includes(w.char) : (!w.mastered || w.char === focusChar);");
fs.writeFileSync('index.html',s);fs.writeFileSync('world-correct.html',s);
fs.writeFileSync('sw.js',fs.readFileSync('sw.js','utf8').replace('czb-v14','czb-v15'));
