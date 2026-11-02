// Offline social intelligence: persistent contextual-bandit strategy, local templates.
// Training is a synthetic decision benchmark, NOT training a language model.
const STORE='masoi_offline_policy_v1';
const ACTIONS=['question','challenge','support','probe','reconsider','defend','misdirect'];
const DEFAULT={question:1.2,challenge:1,support:.8,probe:1.1,reconsider:.8,defend:1.2,misdirect:.9};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=()=>Math.random();
const pick=a=>a[Math.floor(rand()*a.length)];
const safe=x=>String(x||'').replace(/[<>]/g,'').slice(0,180);
export class OfflineBrain {
 constructor(engine){this.engine=engine;this.profile=this.load();this.recent=new Map();this.selfplay=null;this.loadSelfplay();}
 async loadSelfplay(){try{const r=await fetch('./selfplay-policy.json?version=12',{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(d.version===2&&['full-match-core6','curriculum-36-abstract'].includes(d.trainer)&&d.weights&&d.features?.length===7){this.selfplay=d;}}catch(e){console.warn('Self-play policy unavailable',e);}}
 load(){try{const d=JSON.parse(localStorage.getItem(STORE));if(d&&d.version===1&&d.weights)return d;}catch{}return {version:1,weights:{...DEFAULT},trained:0,benchmark:null};}
 save(){try{localStorage.setItem(STORE,JSON.stringify(this.profile));}catch{}}
 reset(){this.recent.clear();}
 // Synthetic self-play: each trial samples an information state, selects a strategy,
 // and receives a noisy proxy reward for clarity, credibility and faction objectives.
 // Not a complete Werewolf match; see TRAINING.md.
 train(rounds=2000){
  rounds=clamp(Math.floor(Number(rounds)||2000),100,20000);
  let rewardTotal=0;
  for(let i=0;i<rounds;i++){
   const state={accused:rand()<.3, evidence:rand(), pressure:rand(), wolf:rand()<.28, alliance:rand()};
   const choices=ACTIONS.filter(a=>!['misdirect'].includes(a)||state.wolf);
   const epsilon=.20*Math.pow(.99993,i);
   const action=rand()<epsilon?pick(choices):choices.reduce((a,b)=>this.profile.weights[a]>this.profile.weights[b]?a:b);
   const utility={question:.60+state.evidence*.2,challenge:.25+state.evidence*.75,support:.25+state.alliance*.65,probe:.58+(.5-state.evidence)*.3,reconsider:.30+(1-state.evidence)*.48,defend:state.accused?.83:.25,misdirect:state.wolf?.53+state.pressure*.25:0}[action];
   const reward=clamp(utility+(rand()-.5)*.26,0,1);
   this.profile.weights[action]=clamp(this.profile.weights[action]+.035*(reward-.55),.25,2.5);
   rewardTotal+=reward;
  }
  this.profile.trained+=rounds;
  this.profile.benchmark={rounds,meanReward:Number((rewardTotal/rounds).toFixed(3)),note:'Synthetic proxy reward, not actual game win rate'};
  this.save();return this.profile.benchmark;
 }
 choose(bot,kind,plan){
  const st=this.engine.social.state(bot);
  const suspicion=bot.aiMemory?.suspicions||{};
  const candidates=this.engine.getAlivePlayers().filter(p=>p.id!==bot.id);
  const ranked=candidates.map(p=>({p,score:(suspicion[p.id]??50)+(50-(st.trust[p.id]??50))*.45+(st.grudges[p.id]||0)*3})).sort((a,b)=>b.score-a.score);
  const target=ranked[0]?.p;
  const accused=kind==='defense'||(kind==='reply'&&/sói|nghi|tại sao|dối|treo/i.test(plan.userText));
  const choices=accused?['defend','reconsider','challenge','question']:bot.team==='werewolf'?['probe','question','support','misdirect','challenge']:['probe','question','challenge','support','reconsider'];
  const used=this.recent.get(bot.id)||[];
  const x=[1,((ranked[0]?.score??50)-50)/50,Math.abs((ranked[0]?.score??50)-50)/50,accused?1:0,Math.max(0,(st.trust[target?.id]||0))/100,accused?1:0,bot.team==='werewolf'?1:0];
  const scored=choices.map(a=>({a,s:this.profile.weights[a]+(this.selfplay?.weights?.[a]?.reduce((v,w,k)=>v+w*x[k],0)||0)*1.8+(a==='challenge'&&ranked[0]?.score>65?.3:0)+(a==='defend'&&accused?.6:0)-(used.includes(a)?.8:0)+rand()*.25})).sort((a,b)=>b.s-a.s);
  const action=scored[0].a;
  this.recent.set(bot.id,[...used.slice(-2),action]);
  return {action,target,score:ranked[0]?.score??50,st};
 }
 speak(bot,kind='discussion',userText=''){
  const plan=this.engine.social.plan(bot,kind,userText);
  const {action,target,score,st}=this.choose(bot,kind,plan);
  const name=safe(target?.name||'mọi người');
  const events=this.engine.social.events.filter(e=>e.speakerId!==bot.id).slice(-12);
  const last=events.slice().reverse().find(e=>target&&e.text.toLowerCase().includes(target.name.toLowerCase()));
  const evidence=last?`Lúc trước ${safe(last.speaker)} có nhắc đến ${name}; tớ muốn kiểm tra xem nhận định ấy có nhất quán không.`:'';
  const addressed=safe(userText).trim();
  const statements={
   question:[`Tớ muốn hỏi ${name}: điều gì khiến cậu đưa ra nhận định đó?`,`Có ai giải thích được vì sao ${name} lại được nhiều người chú ý không?`,`Tớ muốn nghe ${name} nói rõ hơn trước khi quyết định.`],
   challenge:[`Tớ chưa bị thuyết phục về ${name}. Chúng ta cần đối chiếu lời nói với hành động.`,`Khoan đã, có điểm chưa hợp lý trong cách mọi người đánh giá ${name}.`,`Nếu nghi ${name}, hãy nêu sự kiện cụ thể, đừng chỉ hùa theo.`],
   support:[`Tớ tạm đồng tình với hướng phân tích vừa rồi, nhưng chưa muốn kết luận sớm.`,`Tớ nghĩ nên nghe ${name} trình bày hết rồi mới bỏ phiếu.`,`Tớ sẽ cân nhắc lời của ${name}, miễn là có lý do rõ ràng.`],
   probe:[`Tớ muốn thử một giả thuyết: nếu ${name} vô tội thì ai đang hưởng lợi từ sự nghi ngờ này?`,`Mọi người thử nhớ lại ai đổi ý nhanh nhất sau lời buộc tội vừa rồi.`,`Tớ muốn xem phản ứng của ${name} trước một câu hỏi khó, chứ chưa kết luận gì.`],
   reconsider:[`Tớ đang xem lại nhận định ban đầu. Có lẽ chúng ta đang bỏ sót một chi tiết.`,`Tớ chưa chắc ${name} đáng nghi như lúc đầu. Cần thêm một dấu hiệu nữa.`,`Có thể tớ đã đánh giá quá nhanh. Hãy so sánh lời khai qua các ngày.`],
   defend:[`Tớ không đồng ý với cáo buộc đó. Cậu hãy chỉ ra hành động cụ thể khiến cậu nghi tớ.`,`Tớ có thể giải thích lập trường của mình, nhưng đừng biến suy đoán thành kết luận.`,`Nếu mọi người muốn treo tớ, ít nhất hãy đối chiếu những gì tớ đã nói trước đó.`],
   misdirect:[`Tớ nghĩ đang có người cố đẩy sự chú ý về ${name} để tránh bị chất vấn.`,`Cứ nhìn xem ai đang vội vàng kết luận. Tớ muốn nghe thêm một người khác.`,`Tớ không muốn cả làng chỉ xoay quanh ${name}; còn những phiếu bầu bất thường thì sao?`]
  };
  // Dialogue grounding: classify the actual question BEFORE choosing a generic line.
  // These responses do not expose private night actions or fabricate evidence.
  const lower=addressed.toLocaleLowerCase('vi');
  const players=this.engine.getAlivePlayers();
  const mentioned=players.filter(p=>p.id!==bot.id && lower.includes(p.name.toLocaleLowerCase('vi')));
  const human=this.engine.getHumanPlayer();
  const isQuestion=/\?|\b(ai|sao|tại sao|vì sao|thế nào|đâu|chưa|không|gì)\b/i.test(lower);
  const prophet=/tiên tri|soi|điều tra|nhà tiên tri/.test(lower);
  const roleClaim=/vai trò|vai gì|có phải.*(sói|dân)|cậu là|bạn là|khai vai|lộ vai/.test(lower);
  const vote=/bỏ phiếu|biểu quyết|treo|xử tử|đề cử|phiếu/.test(lower);
  const why=/tại sao|vì sao|lý do|bằng chứng|căn cứ|dựa vào đâu|sao lại/.test(lower);
  const wolf=/\bsói\b|ma sói/.test(lower);
  const self=mentioned.some(p=>p.id===bot.id)||lower.includes(bot.name.toLocaleLowerCase('vi'));
  const subject=mentioned.find(p=>p.id!==bot.id);
  const who=subject?.name||name;
  const contextual=(kind==='reply' && addressed) ? (()=>{
    if(prophet) return pick([
      'Câu hỏi về Tiên Tri đúng trọng tâm. Nếu đã soi được ai thì người đó cần cân nhắc thời điểm công bố; ép lộ ngay có thể khiến Sói nhắm vào họ.',
      'Tớ không biết Tiên Tri đã soi ai đêm qua. Nếu có người tự nhận đã soi, mình nên hỏi họ soi đêm nào và kiểm tra lời khai ở những ngày tiếp theo.',
      'Tớ không có kết quả soi nào để xác nhận. Mọi người đừng tự nhận biết vai của người khác nếu chưa có thông tin công khai.'
    ]);
    if(roleClaim) return bot.team==='werewolf' ? 'Tớ chưa muốn công khai vai lúc này. Cậu có thể nói rõ vì sao cần thông tin ấy ngay hôm nay không?' : 'Tớ chưa muốn khai vai chỉ vì một câu hỏi. Nếu có bằng chứng cụ thể chống lại tớ, tớ sẽ giải thích từng điểm.';
    if(vote) return `Nếu định đưa ${who} ra biểu quyết, tớ muốn nghe ít nhất một hành vi hoặc lời khai cụ thể trước. Chỉ dựa vào cảm giác thì rất dễ xử nhầm.`;
    if(why && subject) return `Về ${who}, tớ chưa có bằng chứng chắc chắn. Nếu cậu đang hỏi lý do nghi ngờ, mình cần chỉ ra phát biểu nào của ${who} mâu thuẫn, chứ không thể nói chung chung.`;
    if(wolf && /ai|nghi|người nào/.test(lower)) return `Hiện tớ chưa đủ dữ kiện để kết luận ai là Sói. Tớ sẽ xem lời khai và cách bỏ phiếu của ${who} trước khi chọn người nghi nhất.`;
    if(self || (isQuestion && !subject)) return `Tớ hiểu câu hỏi của cậu, nhưng chưa có thông tin công khai để khẳng định. Cậu muốn tớ giải thích lập trường hay đánh giá một người cụ thể?`;
    if(subject) return `Cậu vừa nhắc đến ${who}. Tớ muốn phân biệt điều ${who} thực sự đã nói với suy đoán của cả làng; hiện chưa có đủ căn cứ để kết luận.`;
    return `Tớ nghe ý cậu. Trước khi kết luận, mình cần một dữ kiện kiểm chứng được, không chỉ lời đồn.`;
  })() : null;
  let message=contextual || pick(statements[action]);
  if(kind==='discussion' && events.length){
    const recentEvent=events[events.length-1];
    const recentText=recentEvent.text.toLocaleLowerCase('vi');
    if(/tiên tri|soi/.test(recentText)) message=pick([
      'Về chuyện Tiên Tri vừa được nhắc tới: tớ nghĩ nên ghi lại ai đã tự nhận có thông tin, rồi đối chiếu vào ngày sau.',
      'Nếu chưa có kết quả soi công khai, đừng lấy việc im lặng làm bằng chứng một người là Sói.'
    ]);
    else if(/bằng chứng|căn cứ|lý do/.test(recentText)) message=`${safe(recentEvent.speaker)} vừa yêu cầu lý do rõ ràng. Tớ đồng ý: nếu muốn nghi ai, hãy chỉ ra hành vi có thể kiểm chứng.`;
  }
  if(kind==='reply'&&addressed&&!contextual){
   message=pick([`Cậu hỏi tớ về chuyện đó à? ${message}`,`Tớ nghe câu hỏi của cậu. ${message}`,`Để tớ trả lời thẳng: ${message}`]);
  }
  if(kind==='defense')message=pick(statements.defend);
  if(evidence&&rand()<.45&&kind!=='defense'&&!contextual)message+=' '+evidence;
  if(st.temperament==='nóng nảy')message='Nói thẳng nhé, '+message.charAt(0).toLowerCase()+message.slice(1);
  if(st.temperament==='thận trọng')message='Theo những gì tớ quan sát, '+message.charAt(0).toLowerCase()+message.slice(1);
  return message;
 }
}
export const offlineTrainingKey=STORE;
