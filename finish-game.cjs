const fs=require('node:fs');let h=fs.readFileSync('index.html','utf8');
const a=h.indexOf('async function startGame(ch, force){'),b=h.indexOf('function renderGameLoading',a);
h=h.slice(0,a)+`async function startGame(ch, force){
  if(GAME.busy)return;
  GAME.busy=true;GAME.char=ch;GAME.items=[];GAME.states=[];
  renderGameLoading(ch);
  const pool=gameChars().filter(c=>c!==ch).sort(()=>Math.random()-.5);
  const chars=[ch].concat(pool).slice(0,3);
  try{
    const results=await Promise.allSettled(chars.map(async c=>{
      let data=force?null:gameCacheGet(c);
      if(!data){data=await aiGen(c);gameCacheSet(c,data.idioms,data.sentences);}
      return {char:c,data};
    }));
    const ready=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    if(!ready.length)throw results[0].reason;
    // Six prompts: spread across available characters and vary the answer each turn.
    for(let i=0;i<3;i++){
      const source=ready[i%ready.length];
      GAME.items.push({type:'idiom',text:source.data.idioms[i],char:source.char});
      GAME.items.push({type:'sentence',text:source.data.sentences[i],char:source.char});
    }
    GAME.items.sort(()=>Math.random()-.5);GAME.idx=0;
    GAME.states=GAME.items.map(()=> '');GAME.hintOn=false;renderGameQuest();
  }catch(e){renderGameError(ch,e);}
  finally{GAME.busy=false;}
}

`+h.slice(b);
h=h.replace('  const item = GAME.items[GAME.idx];\n  const st', '  const item = GAME.items[GAME.idx];\n  GAME.char=item.char || GAME.char;\n  const st');
// Whole-word entry should also leave examples empty until AI generation or manual editing.
h=h.replace("const sentence = d.sentence || ('用「' + word + '」记住「' + ch + '」的写法。');", "const sentence = '';" );
fs.writeFileSync('index.html',h);fs.writeFileSync('world-correct.html',h);
