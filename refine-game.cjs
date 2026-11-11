const fs=require('node:fs');let h=fs.readFileSync('index.html','utf8');
h=h.replace("const GAME_STORE = 'hanzi.game.v1'","const GAME_STORE = 'hanzi.game.v2'");
h=h.replace('return { idioms: i, sentences: s };',"const words=(c.w||[]).filter(t=>typeof t==='string' && t.includes(ch) && t.length>=2 && t.length<=4);\n  if(words.length!==3) return null;\n  return { words, idioms: i, sentences: s };");
h=h.replace('function gameCacheSet(ch, idioms, sentences){','function gameCacheSet(ch, idioms, sentences, words){');
h=h.replace('all[ch] = { i: idioms, s: sentences, at: Date.now() };','all[ch] = { w:words, i: idioms, s: sentences, at: Date.now() };');
h=h.replace("'1. 3 个包含「' + ch + '」字的成语；\\n' +","'0. 3 个包含「' + ch + '」字的常用词语（2～4 字）；\\n' +\n    '1. 3 个包含「' + ch + '」字的成语；\\n' +");
h=h.replace('JSON：{"idioms"','JSON：{"words":["","",""],"idioms"');
h=h.replace('!Array.isArray(j.idioms) ||','!Array.isArray(j.words) || !Array.isArray(j.idioms) ||');
h=h.replace('return { idioms: idioms.slice(0, 3), sentences: sentences.slice(0, 3) };',"const words=Array.from(new Set(j.words.filter(t=>typeof t==='string').map(t=>t.trim()))).filter(t=>t.includes(ch) && t.length>=2 && t.length<=4).slice(0,3);\n  return { words, idioms: idioms.slice(0, 3), sentences: sentences.slice(0, 3) };");
h=h.replaceAll('r.idioms.length !== 3 || r.sentences.length !== 3','r.words.length !== 3 || r.idioms.length !== 3 || r.sentences.length !== 3');
h=h.replace('gameCacheSet(ch, data.idioms, data.sentences);','gameCacheSet(ch, data.idioms, data.sentences, data.words);');
h=h.replace('  GAME.items = [];\n  data.idioms',"  GAME.items = [];\n  data.words.forEach(function(t){ GAME.items.push({type:'word',text:t}); });\n  data.idioms");
h=h.replaceAll('3 个成语和 3 个','3 个词语、3 个成语和 3 个').replaceAll('3 个成语 + 3 个','3 个词语 + 3 个成语 + 3 个');
const a=h.indexOf('  const t = item.text;',h.indexOf('function questHtml'));const b=h.indexOf('\n}',a);
h=h.slice(0,a)+`  const cls = state === 'ok' ? 'g-blank ok' : (GAME.hintOn ? 'g-blank hint' : 'g-blank');
  const inner = (state === 'ok' || GAME.hintOn) ? ch : '　';
  return item.text.split(ch).map(escHtml).join('<span class="'+cls+'" aria-label="待填写的生字">'+escHtml(inner)+'</span>');`+h.slice(b);
h=h.replace("(item.type === 'idiom' ? '成语填空' : '句子填空')","(item.type === 'word' ? '词语填空' : item.type === 'idiom' ? '成语填空' : '佳句填空')");
h=h.replace("在格子里写出去掉的「' + escHtml(GAME.char) + '」","根据上下文，补全空格里的生字");
h=h.replace("'<div class=\"gq-foot\">' +","'<div class=\"gq-foot\">' +",1);
h=h.replace('  resetGameInput();\n  $(\'gameHint\').innerHTML =\n',`  if(st !== 'ok' && st !== 'skip'){
    const form=document.createElement('form');form.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
    form.innerHTML='<input aria-label="填写空缺的生字" class="input" maxlength="1" placeholder="填入生字" style="width:110px;min-height:44px"><button class="btn btn-primary" type="submit">检查答案</button>';
    form.onsubmit=function(e){e.preventDefault();if(form.querySelector('input').value.trim()===GAME.char)gameAnswerOk();else toast('再读一遍，想想空格里该填哪个字');};q.appendChild(form);
  }else{
    const next=document.createElement('button');next.className='btn btn-primary';next.textContent='读一读，下一题';next.onclick=gameNext;q.appendChild(next);
  }
  resetGameInput();
  $('gameHint').innerHTML =
`);
const c=h.indexOf('  setTimeout(function(){',h.indexOf('function gameAnswerOk'));const d=h.indexOf('\nfunction gameHintShow',c);
h=h.slice(0,c)+`}
function gameNext(){
  if(GAME.idx>=GAME.items.length-1){renderGameDone();return;}
  GAME.idx++;GAME.hintOn=false;renderGameQuest();
}
`+h.slice(d);
const e=h.indexOf('  setTimeout(function(){',h.indexOf('function gameSkip'));const f=h.indexOf('/* ---------- AI 设置弹窗',e);
h=h.slice(0,e)+'}\n\n'+h.slice(f);
h=h.replace("'<h3>「' + escHtml(GAME.char) + '」过关！</h3>'", "'<h3>本轮练习完成</h3>'");
h=h.replace("      '<div class=\"gq-foot\" style=\"justify-content:center;margin-top:4px\">' +", "      '<div style=\"text-align:left;line-height:1.8\"><b>好词好句积累 · 再读一遍</b>' + GAME.items.map(function(item){return '<p>'+escHtml(item.text)+'</p>';}).join('') + '</div>' +\n      '<div class=\"gq-foot\" style=\"justify-content:center;margin-top:4px\">' +");
h=h.replace("(host.querySelector('.modal-body') || $('cloudToken').parentElement.parentElement).prepend(section);","host.querySelector('.panel').insertBefore(section,host.querySelector('.cloud-state'));");
fs.writeFileSync('index.html',h);fs.writeFileSync('world-correct.html',h);
