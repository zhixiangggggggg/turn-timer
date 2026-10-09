import { setupLanguage } from './language.js';
import { GameState } from './js/state/GameState.js';
import { TimeMethod } from './js/engine/methods/TimeMethod.js';
import { GameStatus } from './js/utils/constants.js';

// Reuse TempoMate state and timing rules; settle elapsed time before every action.
export class BoardgameClock {
  constructor(now = () => Date.now()) { this.now=now; this.game=new GameState(); this.method=new TimeMethod({}); this.initial=1200000; this.turnLimit=20000; this.last=0; this.lastSwitch=-Infinity; this.reset(); }
  reset(ms=this.initial,turnLimit=this.turnLimit) { if(!Number.isFinite(ms)||ms<=0) throw new Error('请选择大于零的时间'); if(!Number.isFinite(turnLimit)||turnLimit<=0) throw new Error('请选择大于零的回合时限'); this.initial=ms; this.turnLimit=turnLimit; this.game.initGame({periods:[{timeMs:ms}],freezeDefault:false}); for(const p of [this.game.left,this.game.right]){p.overtime=false;p.turnMs=this.turnLimit;} this.last=this.now(); this.lastSwitch=-Infinity; }
  settle() {
    const now=this.now(); let elapsed=Math.max(0,now-this.last); this.last=now;
    if(this.game.status!==GameStatus.RUNNING)return;
    while(elapsed>0){
      const p=this.game.getActivePlayerState();
      const remaining=p.overtime?p.turnMs:p.timeMs;
      const used=Math.min(elapsed,remaining); elapsed-=used;
      if(p.overtime){
        p.turnMs-=used;
        if(p.turnMs===0){this.handoff();this.lastSwitch=now;}
      }else{
        this.method.onTick(used,p);
        if(p.timeMs===0){p.overtime=true;p.turnMs=this.turnLimit;}
      }
    }
  }
  handoff() { this.game.switchTurn(); const incoming=this.game.getActivePlayerState(); if(incoming.overtime)incoming.turnMs=this.turnLimit; }
  start(side) { if(this.game.status!==GameStatus.IDLE)return;this.last=this.now();this.game.startGame(side==='left'?'right':'left'); }
  switch(side) { this.settle(); if(this.game.status!==GameStatus.RUNNING||side!==this.game.activePlayer||this.now()-this.lastSwitch<350)return;this.lastSwitch=this.now();this.handoff(); }
  pause() {this.settle();this.game.togglePause();this.last=this.now();}
}

if(typeof document!=='undefined'){
const clock=new BoardgameClock(); const $=s=>document.querySelector(s); const panels=[...document.querySelectorAll('.clock')];const dialog=$('#dialog');const wheels=[];let previousStatus=null;let wake=null;
const language=setupLanguage();
const format=ms=>{const s=Math.ceil(ms/1000);return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
function render(){
  const g=clock.game;
  panels.forEach(panel=>{
    const side=panel.dataset.side,p=g.getPlayer(side),active=g.activePlayer===side;
    panel.classList.toggle('active',active&&g.status===GameStatus.RUNNING);
    panel.disabled=g.status!==GameStatus.RUNNING||!active;
    panel.querySelector('.time').textContent=format(p.overtime?(active?p.turnMs:clock.turnLimit):p.timeMs);
    panel.querySelector('.moves').textContent=`已完成 ${p.moves} 回合`;
    const mode=p.overtime?`每回合 ${clock.turnLimit/1000} 秒`:'基础时间';
    const state=g.status===GameStatus.IDLE?'准备就绪':g.status===GameStatus.PAUSED?'已暂停':active?'行动中':'等待对手';
    panel.querySelector('.badge').textContent=`${mode} · ${state}`;
    panel.querySelector('.hint').textContent=g.status===GameStatus.RUNNING&&active?(p.overtime?'点击结束回合 · 计时结束自动切换':'点击结束回合'):(p.overtime?`下一回合可用 ${clock.turnLimit/1000} 秒`:' ');
  });
  $('#start').disabled=g.status!==GameStatus.IDLE;
  $('#first').disabled=g.status!==GameStatus.IDLE;
  $('#pause').disabled=![GameStatus.RUNNING,GameStatus.PAUSED].includes(g.status);
  $('#pause').textContent=g.status===GameStatus.PAUSED?'继续对局':'暂停';
  $('#settings').disabled=g.status!==GameStatus.IDLE;
  $('#status').textContent=g.status===GameStatus.RUNNING?`玩家 ${g.activePlayer==='left'?'A':'B'} 行动中${g.getActivePlayerState().overtime?` · 每回合 ${clock.turnLimit/1000} 秒`:''}`:g.status===GameStatus.PAUSED?'对局已暂停':'请选择先行玩家，然后开始对局';
  $('.help').textContent=`点击本方计时区域结束回合。基础时间耗尽后，每回合 ${clock.turnLimit/1000} 秒，计时结束自动切换。`;
  language.apply();
  if(previousStatus!==g.status){previousStatus=g.status;syncWake();}
}
language.button.onclick=()=>{clock.settle();language.toggle();render();};
async function syncWake(){if(clock.game.status===GameStatus.RUNNING&&document.visibilityState==='visible'&&navigator.wakeLock){try{if(!wake||wake.released)wake=await navigator.wakeLock.request('screen');}catch{}}else if(wake){await wake.release().catch(()=>{});wake=null;}}
panels.forEach(p=>p.addEventListener('click',()=>{clock.switch(p.dataset.side);render();}));$('#start').onclick=()=>{clock.start($('#first').value);render();};$('#pause').onclick=()=>{clock.pause();render();};$('#reset').onclick=()=>{clock.settle();if(confirm(language.t('确认重新开始对局？双方计时和回合数将重置。')))clock.reset();render();};
[9,59,59].forEach((max,index)=>{const wheel=document.createElement('div');wheel.className='wheel';wheel.setAttribute('role','group');wheel.setAttribute('aria-label',['小时','分钟','秒'][index]);wheel.innerHTML='<div class="spacer"></div>';for(let n=0;n<=max;n++){const b=document.createElement('button');b.type='button';b.textContent=String(n).padStart(2,'0');b.onclick=()=>wheel.scrollTo({top:n*40,behavior:'smooth'});wheel.append(b);}const space=document.createElement('div');space.className='spacer';wheel.append(space);$('#wheels').append(wheel);wheels.push(wheel);});
function setWheels(ms){const s=Math.floor(ms/1000);[Math.floor(s/3600),Math.floor(s/60)%60,s%60].forEach((n,i)=>wheels[i].scrollTo({top:n*40,behavior:'instant'}));}
let editing='main',draftMain=clock.initial,draftOvertime=clock.turnLimit;
function readWheels(){const [h,m,s]=wheels.map(w=>Math.round(w.scrollTop/40));return (h*3600+m*60+s)*1000;}
function storeDraft(){if(editing==='main')draftMain=readWheels();else draftOvertime=readWheels();}
function showEditor(){
  $('#main-tab').setAttribute('aria-pressed',String(editing==='main'));
  $('#overtime-tab').setAttribute('aria-pressed',String(editing==='overtime'));
  $('#setting-description').textContent=editing==='main'?'每位玩家可累计使用的初始时间。':'基础时间耗尽后，每回合按此时限重新计时，计时结束自动切换至对手。';
  document.querySelectorAll('[data-min]').forEach((b,i)=>{const seconds=editing==='main'?[300,600,1200,1800][i]:[10,20,30,60][i];b.dataset.seconds=seconds;b.textContent=editing==='main'?`${seconds/60} 分钟`:`${seconds} 秒`;});
  setWheels(editing==='main'?draftMain:draftOvertime);language.apply();
}
for(const [id,mode] of [['#main-tab','main'],['#overtime-tab','overtime']])$(id).onclick=()=>{storeDraft();editing=mode;showEditor();};
$('#settings').onclick=()=>{draftMain=clock.initial;draftOvertime=clock.turnLimit;editing='main';dialog.showModal();$('#error').textContent='';showEditor();};
document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>setWheels(Number(b.dataset.seconds)*1000));
$('#form').onsubmit=e=>{if(e.submitter?.value!=='save')return;storeDraft();if(draftMain<=0||draftOvertime<=0){e.preventDefault();$('#error').textContent='基础时间和回合时限都必须至少为 1 秒。';language.apply();return;}clock.reset(draftMain,draftOvertime);render();};
document.addEventListener('visibilitychange',()=>{clock.settle();render();syncWake();});setInterval(()=>{clock.settle();render();},50);render();
}








