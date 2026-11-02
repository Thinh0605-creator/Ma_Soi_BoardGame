"""Offline full-match self-play trainer for the CORE 6 roles.
No API, no access to hidden identities in villager decision functions.
This is a separate fast training environment, not the full 36-role browser engine.
"""
import argparse, json, math, random, collections, pathlib, time
ACTIONS=('question','challenge','support','probe','reconsider','defend','misdirect')
FEATURES=('bias','suspicion','evidence','pressure','alliance','accused','wolf')
POLICY=pathlib.Path(__file__).with_name('selfplay-policy.json')

def dot(a,b): return sum(x*y for x,y in zip(a,b))
def sigmoid(x): return 1/(1+math.exp(-max(-20,min(20,x))))
def features(s, wolf=False):
    return [1,(s['suspicion']-50)/50,s['evidence'],s['pressure'],s['alliance'],int(s['accused']),int(wolf)]

def action_for(weights,s,wolf,rng,explore=0):
    opts=ACTIONS if wolf else ACTIONS[:-1]
    if rng.random()<explore:return rng.choice(opts)
    x=features(s,wolf)
    return max(opts,key=lambda a:dot(weights[a],x)+rng.gauss(0,.07))

def simulate(weights,rng,explore=.1, n=8, collect=False):
    # Standardized match: 2 wolves at 8 players; 3 wolves at 12-16.
    n=max(8,min(16,n)); nw=2 if n<12 else 3
    roles=['WOLF']*nw+['SEER','GUARD','WITCH','HUNTER']+['VILLAGER']*(n-nw-4)
    rng.shuffle(roles); alive=set(range(n)); wolves={i for i,r in enumerate(roles) if r=='WOLF'}
    # Each player stores ONLY observations; role is used by the referee.
    memory=[{'sus':[50.0]*n,'trust':[0.0]*n,'known':{},'last_vote':None,'pressure':0.0} for _ in range(n)]
    for i in range(n):
        if i in wolves:
            for j in wolves: memory[i]['known'][j]='WOLF'
    used_heal=False; used_poison=False; last_guard=None; trajectory=[]; day=0
    while day<20:
        day+=1
        # Night: wolf consensus from publicly inferred threat, not hidden roles.
        if day>1:
            living_w=[i for i in alive if i in wolves]
            nonwolves=[i for i in alive if i not in wolves]
            if living_w and nonwolves:
                victim=max(nonwolves,key=lambda j:sum(memory[w]['sus'][j]*-.2 + rng.random()*15 for w in living_w))
                guard=next((i for i in alive if roles[i]=='GUARD'),None)
                protected=None
                if guard is not None:
                    options=[i for i in alive if i!=last_guard]
                    protected=max(options,key=lambda j:memory[guard]['trust'][j]+rng.random()*20)
                    last_guard=protected
                witch=next((i for i in alive if roles[i]=='WITCH'),None)
                healed=False
                if witch is not None and not used_heal and rng.random()<.28:
                    healed=True;used_heal=True
                if victim!=protected and not healed: alive.remove(victim)
                if witch is not None and not used_poison and rng.random()<.12:
                    options=[j for j in alive if j!=witch]
                    if options:
                        target=max(options,key=lambda j:memory[witch]['sus'][j])
                        alive.remove(target);used_poison=True
                if victim not in alive and roles[victim]=='HUNTER' and alive:
                    target=max(alive,key=lambda j:memory[victim]['sus'][j]);alive.remove(target)
        # Seer gets private result after night; this is not leaked to other villagers.
        seer=next((i for i in alive if roles[i]=='SEER'),None)
        if seer is not None:
            unknown=[j for j in alive if j!=seer and j not in memory[seer]['known']]
            if unknown:
                t=max(unknown,key=lambda j:memory[seer]['sus'][j]+rng.random()*12)
                memory[seer]['known'][t]='WOLF' if t in wolves else 'NOT_WOLF'
                memory[seer]['sus'][t]=98 if t in wolves else 4
        if not (alive-wolves) or len(alive & wolves)>=len(alive-wolves):break
        if not (alive & wolves):break
        # Public discussion: all living participants update beliefs from visible signals.
        for _ in range(2):
            for i in list(sorted(alive)):
                candidates=[j for j in alive if j!=i and (i not in wolves or j not in wolves)]
                if not candidates:continue
                m=memory[i];t=max(candidates,key=lambda j:m['sus'][j]+rng.gauss(0,12))
                accused=m['pressure']>0.5
                state={'suspicion':m['sus'][t], 'evidence':abs(m['sus'][t]-50)/50,
                       'pressure':m['pressure'],'alliance':max(0,m['trust'][t])/100,'accused':accused}
                action=action_for(weights,state,i in wolves,rng,explore)
                trajectory.append((i,action,features(state,i in wolves)))
                # Speech act: signal and noisy credibility. Wolves can bluff but have no access
                # to hidden roles beyond wolf team. Others evaluate public signal only.
                strength={'question':2,'challenge':8,'support':-5,'probe':4,'reconsider':-3,'defend':-4,'misdirect':7}[action]
                if i in wolves and action=='misdirect':strength+=3
                for j in alive:
                    if j==i:continue
                    trust=memory[j]['trust'][i]
                    delta=strength*(.65+trust/150)+rng.gauss(0,2)
                    memory[j]['sus'][t]=max(2,min(98,memory[j]['sus'][t]+delta))
                    memory[j]['trust'][i]=max(-70,min(70,trust+(1 if action in ('question','probe') else -1)))
                    if t==j:memory[j]['pressure']=min(1,memory[j]['pressure']+.15)
        # Secret voting: majority for a lynch, no public role reveal.
        ballots=collections.Counter()
        for i in alive:
            options=[j for j in alive if j!=i and (i not in wolves or j not in wolves)]
            if not options:continue
            target=max(options,key=lambda j:memory[i]['sus'][j]+rng.gauss(0,10))
            if memory[i]['sus'][target]>46:ballots[target]+=1
            memory[i]['last_vote']=target
        if ballots:
            target,votes=ballots.most_common(1)[0]
            if votes>=math.ceil(len(alive)*2/3):
                alive.remove(target)
                if roles[target]=='HUNTER' and alive:
                    shot=max(alive,key=lambda j:memory[target]['sus'][j]);alive.remove(shot)
        if not (alive & wolves) or len(alive & wolves)>=len(alive-wolves):break
    wolfwin=bool(alive & wolves) and len(alive & wolves)>=len(alive-wolves)
    # Per-agent outcome reward; variance-reduced advantage applied in train().
    rewards={i:(1 if (i in wolves)==wolfwin else -1) for i in range(n)}
    return rewards,trajectory,day,wolfwin

def train(rounds,seed=42,players=8,report_every=0):
    rng=random.Random(seed);weights={a:[0.0]*len(FEATURES) for a in ACTIONS}
    # Initialize with moderate biases, rather than a forced optimal scripted strategy.
    for a,b in [('question',.2),('probe',.18),('defend',.1),('challenge',.08),('support',.05)]:weights[a][0]=b
    baseline={a:0.0 for a in ACTIONS};count={a:0 for a in ACTIONS}
    wins=0;days=0
    for g in range(rounds):
        rewards,traj,d,wolfwin=simulate(weights,rng,explore=max(.06,.3*(1-g/max(1,rounds))),n=players)
        wins+=int(wolfwin);days+=d
        # REINFORCE-style action preference update, bounded and normalized per game.
        lr=.012/math.sqrt(1+g/1500)
        for i,a,x in traj:
            reward=rewards[i];adv=reward-baseline[a]
            count[a]+=1;baseline[a]+=(reward-baseline[a])/count[a]
            for k in range(len(x)):
                weights[a][k]=max(-3,min(3,weights[a][k]+lr*adv*x[k]/max(1,len(traj)/8)))
        if report_every and (g+1)%report_every==0:print(f'{g+1:,} ván | Sói thắng {wins/(g+1):.1%} | {days/(g+1):.1f} ngày/ván',flush=True)
    # Independent evaluation against untrained baseline using separate random seeds.
    baseline_w={a:[0.0]*len(FEATURES) for a in ACTIONS}
    ev_n=min(500,max(100,rounds//10))
    def eval_policy(w,seed):
        rr=random.Random(seed); outcomes=[simulate(w,rr,explore=.03,n=players)[3] for _ in range(ev_n)]
        return sum(outcomes)/ev_n
    base_rate=eval_policy(baseline_w,seed+100000)
    trained_rate=eval_policy(weights,seed+100000)
    result={'version':2,'trainer':'full-match-core6','games':rounds,'players':players,'seed':seed,
            'features':list(FEATURES),'actions':list(ACTIONS),'weights':weights,
            'evaluation':{'matches':ev_n,'baselineWolfWinRate':round(base_rate,4),
                          'trainedWolfWinRate':round(trained_rate,4),
                          'note':'Self-play vs self-play, not skill against human players; role mix core 6 only.'},
            'limitations':'Core roles only; simplified timing, public discussion and 2/3 vote; not exact 36-role engine.'}
    POLICY.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Hoàn thành {rounds:,} ván; {days/rounds:.1f} ngày/ván; đánh giá {ev_n} ván: Sói {base_rate:.1%} (gốc) -> {trained_rate:.1%} (mới).')
    print('Đã lưu:',POLICY)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--games',type=int,default=1000);p.add_argument('--players',type=int,default=8);p.add_argument('--seed',type=int,default=42)
    a=p.parse_args();train(max(1,min(100000,a.games)),a.seed,a.players,report_every=max(100,a.games//10))
