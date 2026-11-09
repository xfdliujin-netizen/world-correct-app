const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
assert.equal(html,fs.readFileSync('world-correct.html','utf8'));
function section(start,end){ return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start))); }
const elements = {entryWholeWord:{value:'介绍'}};
let saves=0;
const ctx = vm.createContext({console,Set,Date,Array,
  $:id=>elements[id],toast:()=>{},save:()=>saves++,renderLib:()=>{},
  S:{words:[{char:'介',words:[],count:3,mastered:true,createdAt:7,pinyin:'jiè'}]},
  DICT:{},LEX:{},pyOf:c=>({'介':'jiè','绍':'shào','借':'jiè','荷':'hé','花':'huā'}[c] || '')});
vm.runInContext(section('function saveWholeWord(){','function saveEntry(){'),ctx);
vm.runInContext('saveWholeWord()',ctx);
assert.equal(ctx.S.words.length,2);
assert.equal(ctx.S.words.find(w=>w.char==='介').count,3);
assert.equal(ctx.S.words.find(w=>w.char==='介').mastered,true);
assert.ok(ctx.S.words.every(w=>w.words.includes('介绍')));
elements.entryWholeWord.value='介绍'; vm.runInContext('saveWholeWord()',ctx);
assert.equal(ctx.S.words.length,2);
elements.entryWholeWord.value='介绍123'; vm.runInContext('saveWholeWord()',ctx);
assert.equal(saves,2);
vm.runInContext(section('const VOICE_HEAD =','function voiceShowResult('),ctx);
const spoken = text=>vm.runInContext('parseSpokenChar('+JSON.stringify(text)+')',ctx);
assert.equal(spoken('介绍的借').ch,'介');
assert.equal(spoken('介绍的借').strong,false);
assert.ok(spoken('介绍的借').cands.includes('借'));
assert.equal(spoken('荷花的荷').ch,'荷');
assert.equal(spoken('荷花的荷').strong,true);
assert.equal(spoken(''),null);
let timer,uploaded=0;
Object.assign(ctx,{CLOUD:{auto:true,busy:false,lastSync:Date.now()},cloudOn:()=>true,
  refreshCloudUI:()=>{},clearTimeout:()=>{},setTimeout:(fn,delay)=>{timer={fn,delay};return 1;},
  cloudPush:()=>{uploaded++; return Promise.resolve();}});
vm.runInContext(section('function cloudSyncSoon(delay){','/* 打开 App 时比对一次'),ctx);
(async()=>{
  vm.runInContext('cloudSyncSoon()',ctx);
  assert.equal(timer.delay,1500); // No minute-long cooldown after a recent upload.
  timer.fn();
  vm.runInContext('cloudSyncSoon()',ctx); // Edit while upload is in flight.
  assert.equal(ctx.CLOUD.dirty,true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ctx.CLOUD.busy,false);
  assert.equal(ctx.CLOUD.queued,true);
  timer.fn();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(uploaded,2);
  console.log('PASS: script syntax, matching entry pages, whole-word validation/deduplication/progress, contextual speech, backup debounce and in-flight edits');
})().catch(e=>{console.error(e);process.exitCode=1;});
