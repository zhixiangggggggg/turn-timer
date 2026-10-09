const words={
'桌游计时器':'Boardgame Timer','专注每一回合。':'Make time for a great game.','计时设置':'Time settings','双人对局 · 交替计时':'One device · Two players','双人计时区域':'Two-player clocks','玩家 A':'Player A','玩家 B':'Player B','先行玩家':'First player','开始对局':'Start game','暂停':'Pause','继续对局':'Resume','重新开始':'Reset game','点击本方计时区域结束回合。总时间耗尽后，每回合 20 秒，计时结束自动切换。':'Tap your clock to end your turn. Once main time runs out, each turn gets 20 seconds and switches automatically at zero.','基于':'Adapted from','改编 · AGPL-3.0':'· AGPL-3.0','每位玩家的时间':'Time per player','关闭':'Close','滑动设置时长，双方使用相同计时规则。':'Scroll to choose a duration. Both players start with the same time.','小时':'Hours','分钟':'Minutes','秒':'Seconds','保存设置':'Save time','准备就绪':'Ready','已暂停':'Paused','行动中':'Your turn','等待对手':'Waiting','每回合 20 秒':'20 seconds per turn','总时间':'Main time','点击结束回合 · 计时结束自动切换':'Tap to end turn · Auto-switch at zero','点击结束回合':'Tap here to end your turn','下一回合可用 20 秒':'Next turn starts with 20 seconds','对局已暂停':'Game paused','请选择先行玩家，然后开始对局':'Choose who goes first, then start','确认重新开始对局？双方计时和回合数将重置。':'Reset the game? Both clocks will return to their starting time.','请至少选择 1 秒。':'Please select at least 1 second.'
};
Object.assign(words,{
'专注每一回合。':'Your turn. Your time.',
'计时设置':'Timer settings',
'计时设置':'Timer settings',
'基础时间':'Main time',
'回合时限':'Overtime per turn',
'每位玩家可累计使用的初始时间。':'The time each player starts with.',
'基础时间耗尽后，每回合按此时限重新计时，计时结束自动切换至对手。':'After main time runs out, you get this much time on each turn. The clock switches to your opponent when it reaches zero.',
'滑动设置时长，双方使用相同计时规则。':'Scroll to set the duration. These settings apply to both players.',
'基础时间和回合时限都必须至少为 1 秒。':'Main time and overtime must each be at least 1 second.',
'先行玩家':'Goes first',
'行动中':'Your turn',
'等待对手':'Waiting for opponent',
'点击结束回合':'Tap to end your turn',
'点击结束回合 · 计时结束自动切换':'Tap to end your turn · Switches automatically at zero',
'请选择先行玩家，然后开始对局':'Choose who goes first, then tap Start game.',
'保存设置':'Save settings'
});
export function english(text){
 const clean=text.trim();
 if(words[clean])return text.replace(clean,words[clean]);
 if(/^已完成 \d+ 回合$/.test(clean))return clean.replace(/^已完成 (\d+) 回合$/,'Turns completed: $1');
 if(/^\d+ 分钟$/.test(clean))return clean.replace('分钟','min');
 if(/^玩家 [AB] 行动中/.test(clean))return clean.replace(/^玩家 ([AB]) 行动中/,'Player $1’s turn').replace(/每回合 (\d+) 秒/g,'Overtime: $1 sec/turn');
 if(/^每回合 \d+ 秒$/.test(clean))return clean.replace(/^每回合 (\d+) 秒$/,'Overtime: $1 sec/turn');
 if(/^下一回合可用 \d+ 秒$/.test(clean))return clean.replace(/^下一回合可用 (\d+) 秒$/,'Next turn: $1 seconds');
 if(/^\d+ 秒$/.test(clean))return clean.replace('秒','sec');
 if(/^点击本方计时区域结束回合。基础时间耗尽后/.test(clean))return clean.replace(/^点击本方计时区域结束回合。基础时间耗尽后，每回合 (\d+) 秒，计时结束自动切换。$/,'Tap your clock to end your turn. After main time runs out, you get $1 seconds per turn. The clock switches automatically at zero.');
 if(clean.includes(' · '))return clean.split(' · ').map(part=>english(part)).join(' · ');
 return text;
}
export function setupLanguage(){
 let language='zh';try{const saved=localStorage.getItem('boardgame-language');language=['zh','en'].includes(saved)?saved:(navigator.language?.startsWith('zh')?'zh':'en');}catch{}
 const originals=new WeakMap();
 const button=document.createElement('button');button.id='language';button.type='button';
 const settings=document.querySelector('#settings');const actions=document.createElement('div');actions.className='header-actions';settings.replaceWith(actions);actions.append(settings,button);
 function updateNode(node,value){const prior=originals.get(node);const source=prior&&value===prior.translated?prior.source:value;const translated=language==='en'?english(source):source;originals.set(node,{source,translated});return translated;}
 function apply(){
  document.documentElement.lang=language==='en'?'en':'zh-CN';document.title=language==='en'?'Boardgame Timer':'桌游计时器';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(node.parentElement.closest('script,style,#language'))continue;node.textContent=updateNode(node,node.textContent);}
  document.querySelectorAll('[aria-label]').forEach(el=>{const original=el.dataset.originalLabel||el.getAttribute('aria-label');el.dataset.originalLabel=original;el.setAttribute('aria-label',language==='en'?english(original):original);});
  button.textContent=language==='zh'?'English':'中文';button.setAttribute('aria-label',language==='zh'?'切换到英文':'Switch to Chinese');
 }
 return {apply,button,t:text=>language==='en'?english(text):text,toggle(){language=language==='zh'?'en':'zh';try{localStorage.setItem('boardgame-language',language);}catch{}apply();}};
}



