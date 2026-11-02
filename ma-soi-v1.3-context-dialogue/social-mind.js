// Persistent, per-character social reasoning. No secret roles are read here.
export class SocialMind {
  constructor(engine) { this.engine = engine; this.reset(); }
  reset() { this.states = new Map(); this.events = []; }
  state(bot) {
    if (!this.states.has(bot.id)) this.states.set(bot.id, {
      trust: {}, ties: {}, grudges: {}, claims: [], promises: [], statements: [],
      temperament: ['thận trọng','thẳng thắn','hay nghi ngờ','điềm tĩnh','dễ xúc động'][Math.floor(Math.random()*5)]
    });
    return this.states.get(bot.id);
  }
  observe(speaker, text) {
    if (!speaker || !text) return;
    const engine = this.engine;
    const event = {day:engine.dayNumber, speakerId:speaker.id, speaker:speaker.name, text:String(text).slice(0,350)};
    this.events.push(event); if (this.events.length > 140) this.events.shift();
    for (const bot of engine.players.filter(p=>!p.isHuman && p.id!==speaker.id)) {
      const state=this.state(bot);
      const named = engine.players.filter(p=>p.id!==speaker.id && p.id!==bot.id && String(text).toLocaleLowerCase('vi').includes(p.name.toLocaleLowerCase('vi')));
      for (const p of named) {
        const old=state.trust[p.id]??50;
        const negative=/nghi|sói|nói dối|mâu thuẫn|treo|không tin|bỏ phiếu/i.test(text);
        const positive=/tin|bảo vệ|đồng ý|ủng hộ|vô tội/i.test(text);
        if (negative) state.trust[p.id]=Math.max(0,old-3);
        else if (positive) state.trust[p.id]=Math.min(100,old+2);
      }
      if (String(text).toLocaleLowerCase('vi').includes(bot.name.toLocaleLowerCase('vi'))) {
        state.grudges[speaker.id]=(state.grudges[speaker.id]||0)+(/nghi|sói|dối|treo/i.test(text)?1:0);
      }
    }
  }
  rememberSpeech(bot,text,plan) {
    const state=this.state(bot);
    state.statements.push({day:this.engine.dayNumber,text:String(text).slice(0,350),intent:plan.intent});
    if (state.statements.length>24) state.statements.shift();
  }
  chooseRespondent(text,bots) {
    const lower=String(text).toLocaleLowerCase('vi');
    const mentioned=bots.filter(p=>lower.includes(p.name.toLocaleLowerCase('vi')));
    if (mentioned.length) return mentioned[0];
    const weighted=bots.map(p=>({p,score:(this.state(p).grudges[this.engine.getHumanPlayer()?.id]||0)*3+Math.random()*5}));
    weighted.sort((a,b)=>b.score-a.score); return weighted[0]?.p;
  }
  plan(bot,kind,userText) {
    const state=this.state(bot), engine=this.engine;
    const alive=engine.getAlivePlayers().filter(p=>p.id!==bot.id);
    const suspects=alive.map(p=>({p,score:(bot.aiMemory?.suspicions?.[p.id]??50)+(50-(state.trust[p.id]??50))*.5+(state.grudges[p.id]||0)*3})).sort((a,b)=>b.score-a.score);
    const target=suspects[0]?.p;
    const recent=this.events.slice(-18).filter(e=>e.speakerId!==bot.id);
    const own=state.statements.slice(-7);
    const intent=kind==='defense'?'tự bảo vệ bằng cách trả lời cáo buộc cụ thể':kind==='reply'?'trả lời trực tiếp câu hỏi, có thể phản bác':target?'kiểm tra lời khai hoặc thăm dò sự đồng thuận':'phân tích thông tin công khai';
    return {temperament:state.temperament,intent,focus:target?.name||null,
      trust: suspects.slice(0,5).map(x=>({name:x.p.name,trust:Math.round(state.trust[x.p.id]??50)})),
      tensions:Object.entries(state.grudges).filter(([,n])=>n>0).slice(-5).map(([id,n])=>({name:engine.getPlayer(id)?.name,count:n})).filter(x=>x.name),
      ownStatements:own, recentEvents:recent, userText:String(userText).slice(0,450),
      constraints:['Chỉ dựa vào dữ kiện nhân vật được biết','Có thể đánh lừa hoặc gài bẫy bằng lời nói trong game','Không tự bịa kết quả soi hay hành động đã xảy ra']};
  }
}
