const fs=require('node:fs');let h=fs.readFileSync('index.html','utf8');
h=h.replace('grid-template-columns:repeat(3,1fr);gap:4px','grid-template-columns:repeat(4,minmax(0,1fr));gap:4px');
h=h.replace('  min-height:50px;border-radius:14px;', '  min-width:0;white-space:nowrap;min-height:50px;border-radius:14px;');
h=h.replace("      : '<span class=\"lc-side\"><span class=\"dots lc-dots-v\">'", "      : '<span class=\"tag-done lc-tag tag-learning\">待复习</span><span class=\"lc-side\"><span class=\"dots lc-dots-v\">'");
h=h.replace('</style>', '\n.tag-learning{background:var(--primary-l);color:var(--primary);}\n.gq-pinyin{font-size:24px;color:var(--primary);font-weight:700;text-align:center;padding:10px;}\n.game-score{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--ink-2);}\n</style>');
const pick=h.indexOf('                <div class="game-pick">',h.indexOf('id="gameBody"'));const pickEnd=h.indexOf('                <div class="game-quest"',pick);
h=h.slice(0,pick)+h.slice(pickEnd);
const ca=h.indexOf('function renderGameChips(){'),cb=h.indexOf('/* 有 Key',ca);
h=h.slice(0,ca)+`function renderGameChips(){} // No character picker: the app selects practice material.
function gameStartRound(force){
  if(!gameShowGuide() || GAME.busy)return;
  const chars=gameChars();
  const candidates=chars.filter(ch=>ch!==GAME.char);
  const pool=candidates.length?candidates:chars;
  const ch=pool[Math.floor(Math.random()*pool.length)];
  if(ch)startGame(ch,!!force);
}
`+h.slice(cb);
h=h.replaceAll('3 个词语、3 个成语和 3 个','3 个成语和 3 个').replaceAll('3 个词语 + 3 个成语 + 3 个','3 个成语 + 3 个');
h=h.replace('把生字挖空，让你手写填字','根据拼音补全空格，挑战成语和佳句').replaceAll('先选一个生字','看拼音，补全成语和佳句');
h=h.replace("    '0. 3 个包含「' + ch + '」字的常用词语（2～4 字）；\\n' +\n",'');
h=h.replace('JSON：{"words":["","",""],"idioms"','JSON：{"idioms"');
h=h.replace('!Array.isArray(j.words) || ','');
h=h.replace("  const words=Array.from(new Set(j.words.filter(t=>typeof t==='string').map(t=>t.trim()))).filter(t=>t.includes(ch) && t.length>=2 && t.length<=4).slice(0,3);\n",'');
h=h.replace('return { words, idioms: idioms.slice(0, 3), sentences: sentences.slice(0, 3) };','return { idioms: idioms.slice(0, 3), sentences: sentences.slice(0, 3) };');
h=h.replaceAll('r.words.length !== 3 || ','');
h=h.replace('  data.words.forEach(function(t){ GAME.items.push({type:\'word\',text:t}); });\n','');
h=h.replace("  const words=(c.w||[]).filter(t=>typeof t==='string' && t.includes(ch) && t.length>=2 && t.length<=4);\n  if(words.length!==3) return null;\n  return { words, idioms: i, sentences: s };",'  return { idioms: i, sentences: s };');
h=h.replace('  GAME.idx = 0;\n  GAME.states', '  GAME.items.sort(()=>Math.random()-.5);\n  GAME.idx = 0;\n  GAME.states');
h=h.replace("'<span>正在请 AI 为「' + escHtml(ch) + '」出题：3 个成语 + 3 个句子…<br>第一次约需十几秒，之后这个字会缓存起来</span>'", "'<span>正在准备拼音挑战：3 个成语 + 3 个句子…<br>读拼音，想一想，再填入空缺的字</span>'");
const idle=h.indexOf('function renderGameIdle(){'),idleEnd=h.indexOf('/* 把目标字挖空',idle);
h=h.slice(0,idle)+`function renderGameIdle(){
  GAME.items=[];GAME.idx=0;GAME.states=[];GAME.hintOn=false;
  gameStartRound(false);
}

`+h.slice(idleEnd);
h=h.replace("    '<div class=\"gq-type\">' + (item.type === 'word' ? '词语填空' : item.type === 'idiom' ? '成语填空' : '佳句填空') + '</div>' +", "    '<div class=\"game-score\"><span>⭐ 已点亮 ' + GAME.states.filter(s=>s==='ok').length + ' / 6 颗星</span><span>读拼音 · 补空格</span></div>' +\n    '<div class=\"gq-type\">' + (item.type === 'idiom' ? '成语挑战' : '佳句挑战') + '</div>' +\n    '<div class=\"gq-pinyin\">' + escHtml(py || '试试根据上下文填写') + '</div>' +");
h=h.replace("(py ? ' · 这个字读「' + escHtml(py) + '」' : '')", "''");
h=h.replace("toast('再读一遍，想想空格里该填哪个字')","toast('💡 再看一眼拼音，你一定能想起来！')");
h=h.replace("<span>写对了！</span>","<span>⭐ 答对了！点亮一颗星，把完整内容读一遍吧！</span>");
h=h.replace("startGame(GAME.char, true);",'gameStartRound(true);');
h=h.replace('换个生字</button>','再挑战一轮</button>');
h=h.replace("  if(!GAME.char || GAME.idx >= GAME.items.length) return;", "  if(!GAME.char || GAME.idx >= GAME.items.length || GAME.states[GAME.idx]) return;");
h=h.replace("function gameAnswerOk(){\n", "function gameAnswerOk(){\n  if(GAME.states[GAME.idx])return;\n");
h=h.replace("  toast('已保存，可以玩填词游戏了');","  if(S.tab==='game' && !GAME.items.length)gameStartRound(false);\n  toast('已保存，可以开始拼音挑战和 AI 造句');");
// Entry generation uses DeepSeek even when the bundled dictionary contains examples.
const sa=h.indexOf('function fetchSentenceFor(ch, words){'),sb=h.indexOf('function mergeWords',sa);
h=h.slice(0,sa)+`async function fetchSentenceFor(ch, words){
  if(!AI.key)throw new Error('请先配置 DeepSeek Key，再生成例句');
  const text=await deepseekChat('你是一位小学语文老师，擅长写适合孩子阅读与硬笔书法练习的优美例句。只返回严格 JSON。',
    '为生字「'+ch+'」生成 3 个不同的句子，可参考组词：'+(words||[]).join('、')+'。每句必须完整包含「'+ch+'」，句意优美、积极向上，带有画面感，兼具科普或文学色彩，避免干巴巴的口号。每句 15～30 个汉字，适合硬笔书法练习。只返回 JSON：{"sentences":["句子一","句子二","句子三"]}');
  const j=parseAiJson(text);
  const sentences=j && Array.isArray(j.sentences)?Array.from(new Set(j.sentences.filter(t=>typeof t==='string').map(t=>t.trim()))).filter(t=>t.includes(ch) && t.replace(/[^\\u3400-\\u9fff]/g,'').length>=15 && t.replace(/[^\\u3400-\\u9fff]/g,'').length<=30):[];
  if(sentences.length!==3)throw new Error('AI 例句未达要求，请点击 AI 造句重试');
  return sentences;
}

`+h.slice(sb);
h=h.replace("  let sentence = (d && d.sentence) || (lex && lex.sentence) || (cache && cache.sentence) || '';", "  let sentence = ''; // New entry examples come from DeepSeek.");
h=h.replace("  const more = (d && d.sentences) || (lex && lex.sentences) || (cache && cache.sentences) || [];",'  const more = [];');
h=h.replace("  const sentTask = needSentence ? fetchSentenceFor(ch, autoWords) : Promise.resolve([]);", "  let sentenceError='';\n  const sentTask = needSentence ? fetchSentenceFor(ch, autoWords).catch(e=>{sentenceError=e.message;return [];}) : Promise.resolve([]);");
h=h.replace("    if(changed){\n      setEntryNet('已联网补全，可自行修改', true);", "    if(sentenceError){setEntryNet(sentenceError,false);}\n    else if(changed){\n      setEntryNet('已通过 DeepSeek 生成例句，可自行修改', true);");
h=h.replace('正在联网获取例句…','DeepSeek 正在生成优美例句…');
h=h.replace('<button class="sent-add hidden" id="btnAddSentence"', '<button class="sent-add" id="btnEntryAi" type="button">AI 造句</button><button class="sent-add" id="btnEntryAiConfig" type="button">AI 设置</button>\n                  <button class="sent-add hidden" id="btnAddSentence"');
h=h.replace("function bindGame(){", `function bindGame(){
  $('btnEntryAiConfig').onclick=openAiModal;
  $('btnEntryAi').onclick=async function(){
    const ch=S.entryChar;if(!ch){toast('请先录入一个生字');return;}
    if(!AI.key){openAiModal();return;}
    const seq=entryFetchSeq;
    const boxes=[$('entrySentence'),$('entrySentence2'),$('entrySentence3')];
    const before=boxes.map(b=>b.value);
    this.disabled=true;setEntryNet('DeepSeek 正在生成例句…',false);
    try{const sentences=await fetchSentenceFor(ch,($('entryWords').value||'').split(/[，、,\\s]+/));
      if(seq!==entryFetchSeq || S.entryChar!==ch)return;
      boxes.forEach((b,i)=>{if(b.value===before[i])b.value=sentences[i];});syncSentInputs();setEntryNet('AI 例句已生成，可自行修改',true);
    }catch(e){if(seq===entryFetchSeq)setEntryNet(e.message||'生成失败，请重试',false);}
    finally{this.disabled=false;}
  };
`);
h=h.replace("const sentence = sentences[0] || ('认真记住「' + ch + '」字的写法。');\n  if(!sentences.length) sentences.push(sentence);", "const sentence = sentences[0] || '';" );
fs.writeFileSync('index.html',h);fs.writeFileSync('world-correct.html',h);
fs.writeFileSync('sw.js',fs.readFileSync('sw.js','utf8').replace('czb-v11','czb-v12'));
