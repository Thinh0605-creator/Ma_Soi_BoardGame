"""36-role curriculum self-play (ABSTRACT simulator).
All 36 role IDs are sampled across matches. Night abilities are grouped into archetypes,
not exact implementations of every role. This is NOT the full browser game engine.
No network or external API.
"""
import argparse, json, math, random, collections, pathlib, time
ACTIONS=('question','challenge','support','probe','reconsider','defend','misdirect')
FEATURES=('bias','suspicion','evidence','pressure','alliance','accused','wolf')
POLICY=pathlib.Path(__file__).with_name('selfplay36-policy.json')
ROLE_IDS=['WEREWOLF', 'ALPHA_WOLF', 'FROST_WOLF', 'WOLF_SORCERER', 'WOLF_CUB', 'WHITE_WEREWOLF', 'NIGHTMARE_WOLF', 'ILLUSION_WOLF', 'PLAGUE_WOLF', 'DISGUISED_WOLF', 'SEER', 'APPRENTICE_SEER', 'FOX', 'MEDIUM', 'BODYGUARD', 'WITCH', 'PRIEST', 'DOCTOR', 'HUNTER', 'ELDER', 'SILVER_KNIGHT', 'VILLAGER', 'LYCAN', 'CUPID', 'MAYOR', 'DETECTIVE', 'BLIND_ORACLE', 'ALCHEMIST', 'JUDGE', 'STORYTELLER', 'FOOL_TANNER', 'SERIAL_KILLER', 'DOPPELGANGER', 'AVENGER', 'CULT_LEADER', 'PARASITE']
WOLF_ROLES=set(ROLE_IDS[:10])
VILLAGE_ROLES=set(ROLE_IDS[10:30])
INDEPENDENT_ROLES=set(ROLE_IDS[30:])
INFO_ROLES={'SEER','APPRENTICE_SEER','FOX','DETECTIVE','BLIND_ORACLE','MEDIUM'}
PROTECT_ROLES={'BODYGUARD','DOCTOR','PRIEST','SILVER_KNIGHT'}
POTION_ROLES={'WITCH','ALCHEMIST'}
REVENGE_ROLES={'HUNTER','AVENGER'}
KILLER_ROLES={'SERIAL_KILLER'}
CONTROL_ROLES={'FROST_WOLF','NIGHTMARE_WOLF','ILLUSION_WOLF','PLAGUE_WOLF','WOLF_SORCERER'}


def dot(a,b): return sum(x*y for x,y in zip(a,b))
def sigmoid(x): return 1/(1+math.exp(-max(-20,min(20,x))))
def features(s, wolf=False):
    return [1,(s['suspicion']-50)/50,s['evidence'],s['pressure'],s['alliance'],int(s['accused']),int(wolf)]

def action_for(weights,s,wolf,rng,explore=0):
    opts=ACTIONS if wolf else ACTIONS[:-1]
    if rng.random()<explore:return rng.choice(opts)
    x=features(s,wolf)
    return max(opts,key=lambda a:dot(weights[a],x)+rng.gauss(0,.07))

def simulate(weights,rng,explore=.1, n=8, collect=False, role_counts=None, vote_rule="supermajority"):
    # Standardized match: 2 wolves at 8 players; 3 wolves at 12-16.
    n=max(8,min(16,n)); nw=2 if n<12 else 3
    # Stratified role curriculum: every one of the 36 IDs is eligible to appear.
    # At 8 players not all roles appear in a single match, by definition.
    special_wolves=[r for r in ROLE_IDS[:10] if r!='WEREWOLF']
    wolf_cards=['WEREWOLF']+rng.sample(special_wolves,min(nw-1,len(special_wolves)))
    n_independent=1 if rng.random()<(0.20 if n<10 else .35) else 0
    nonwolf_count=n-nw-n_independent
    village_special=[r for r in ROLE_IDS[10:30] if r!='VILLAGER']
    # Rotate through a mix of villagers with a chance for ordinary villagers.
    n_special=min(nonwolf_count, max(2, int(nonwolf_count*.75)))
    village_cards=rng.sample(village_special,n_special)+['VILLAGER']*(nonwolf_count-n_special)
    neutral_cards=rng.sample(ROLE_IDS[30:],n_independent)
    roles=wolf_cards+village_cards+neutral_cards
    rng.shuffle(roles)
    if role_counts is not None:
        for role in roles:role_counts[role]+=1
    alive=set(range(n)); wolves={i for i,r in enumerate(roles) if r in WOLF_ROLES}
    neutral={i for i,r in enumerate(roles) if r in INDEPENDENT_ROLES}
    # NOTE: independent victory remains unsupported; report explicitly, never silently treat as village.
    # Each player stores ONLY observations; role is used by the referee.
    memory=[{'sus':[50.0]*n,'trust':[0.0]*n,'known':{},'last_vote':None,'pressure':0.0} for _ in range(n)]
    for i in range(n):
        if i in wolves:
            for j in wolves: memory[i]['known'][j]='WOLF'
    used_heal=set(); used_poison=set(); last_guard={}; trajectory=[]; day=0; alpha_used=False
    public_accusations=collections.Counter(); last_nominations=[]
    while day<20:
        day+=1
        # Night archetypes: approximate effects, NOT exact role rules.
        if day>1:
            living_w=[i for i in alive if i in wolves]
            nonwolves=[i for i in alive if i not in wolves]
            victim=None
            if living_w and nonwolves:
                victim=max(nonwolves,key=lambda j:sum(memory[w]['sus'][j]*-.2+rng.random()*15 for w in living_w))
            protected=set()
            for guard in list(alive):
                if roles[guard] in PROTECT_ROLES:
                    options=[i for i in alive if i!=last_guard.get(guard)]
                    if options:
                        target=max(options,key=lambda j:memory[guard]['trust'][j]+rng.random()*20)
                        protected.add(target);last_guard[guard]=target
            if victim is not None:
                healers=[i for i in alive if roles[i] in POTION_ROLES and i not in used_heal]
                healed=bool(healers and rng.random()<.23)
                if healed:used_heal.add(rng.choice(healers))
                if victim not in protected and not healed:
                    alpha=next((i for i in living_w if roles[i]=='ALPHA_WOLF'),None)
                    if alpha is not None and not alpha_used and rng.random()<.12:
                        wolves.add(victim);alpha_used=True
                    else:
                        alive.remove(victim)
            for witch in list(alive):
                if roles[witch] in POTION_ROLES and witch not in used_poison and rng.random()<.09:
                    options=[j for j in alive if j!=witch]
                    if options:
                        target=max(options,key=lambda j:memory[witch]['sus'][j])
                        alive.discard(target);used_poison.add(witch)
            for killer in list(alive):
                if roles[killer] in KILLER_ROLES and rng.random()<.55:
                    targets=[j for j in alive if j!=killer]
                    if targets:alive.discard(rng.choice(targets))
            for dead in list(set(range(n))-alive):
                if roles[dead] in REVENGE_ROLES and dead not in used_poison:
                    targets=[j for j in alive if j!=dead]
                    if targets and rng.random()<.65:
                        alive.discard(max(targets,key=lambda j:memory[dead]['sus'][j]))
                    used_poison.add(dead)
            # Investigative archetypes: result stays in investigator's private memory.
            for investigator in list(alive):
                if roles[investigator] not in INFO_ROLES:continue
                unknown=[j for j in alive if j!=investigator and j not in memory[investigator]['known']]
                if unknown:
                    t=max(unknown,key=lambda j:memory[investigator]['sus'][j]+rng.random()*12)
                    # Lycan/disguise roles can give deceptive results in this abstraction.
                    seen_wolf=t in wolves or roles[t]=='LYCAN'
                    if roles[t]=='DISGUISED_WOLF':seen_wolf=False
                    if roles[investigator]=='BLIND_ORACLE' and rng.random()<.25:seen_wolf=not seen_wolf
                    memory[investigator]['known'][t]='WOLF' if seen_wolf else 'NOT_WOLF'
                    memory[investigator]['sus'][t]=98 if seen_wolf else 4
                    # Investigators may publicly claim their result, with imperfect credibility.
                    # Only the investigator learns the raw result; others hear a claim.
                    if rng.random()<.70:
                        for listener in alive:
                            if listener==investigator:continue
                            reliability=.45 if roles[investigator] in ('BLIND_ORACLE','FOX') else .65
                            shift=(26 if seen_wolf else -20)*reliability
                            memory[listener]['sus'][t]=max(2,min(98,memory[listener]['sus'][t]+shift))
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
        # Court procedure aligned with browser game: nomination threshold 20%,
        # each qualifying candidate receives a separate YES/NO secret ballot,
        # execution requires >= 2/3 of ALL living players; at most one execution/day.
        # This abstracts time and defense speeches, not the exact 36-role rules.
        nominations=collections.Counter()
        for i in sorted(alive):
            options=[j for j in alive if j!=i and (i not in wolves or j not in wolves)]
            if not options:continue
            m=memory[i]
            t=max(options,key=lambda j:m['sus'][j]+rng.gauss(0,9))
            # Nominate only if there is meaningful suspicion, avoiding arbitrary pile-ons.
            if m['sus'][t]>49:nominations[t]+=1
        minimum=math.ceil(len(alive)*.20)
        candidates=[t for t,c in nominations.most_common() if c>=minimum]
        for target in candidates:
            # Defense stage: some voters soften, while contradiction can strengthen belief.
            defense_strength=rng.gauss(0,3)
            yes=0
            for i in sorted(alive):
                if i==target:continue
                m=memory[i]
                # Wolves may protect teammates, but cannot see hidden civilian roles.
                if i in wolves and target in wolves:continue
                suspicion=m['sus'][target]+defense_strength+rng.gauss(0,10)
                if target in m['known']:
                    suspicion+= 35 if m['known'][target]=='WOLF' else -35
                if suspicion>=58:yes+=1
            if yes >= (len(alive)//2+1 if vote_rule=="majority" else math.ceil(len(alive)*2/3)):
                alive.remove(target)
                if roles[target]=='HUNTER' and alive:
                    shot=max(alive,key=lambda j:memory[target]['sus'][j])
                    alive.remove(shot)
                break
        if not (alive & wolves) or len(alive & wolves)>=len(alive-wolves):break
    wolfwin=bool(alive & wolves) and len(alive & wolves)>=len(alive-wolves)
    # Per-agent outcome reward; variance-reduced advantage applied in train().
    rewards={i:(1 if (i in wolves)==wolfwin else -1) for i in range(n)}
    return rewards,trajectory,day,wolfwin

def train(rounds,seed=42,players=8,report_every=0,vote_rule="supermajority"):
    rng=random.Random(seed);weights={a:[0.0]*len(FEATURES) for a in ACTIONS}
    # Initialize with moderate biases, rather than a forced optimal scripted strategy.
    for a,b in [('question',.2),('probe',.18),('defend',.1),('challenge',.08),('support',.05)]:weights[a][0]=b
    baseline={a:0.0 for a in ACTIONS};count={a:0 for a in ACTIONS}
    wins=0;days=0;role_counts=collections.Counter()
    for g in range(rounds):
        rewards,traj,d,wolfwin=simulate(weights,rng,explore=max(.06,.3*(1-g/max(1,rounds))),n=players,role_counts=role_counts,vote_rule=vote_rule)
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
        rr=random.Random(seed); outcomes=[simulate(w,rr,explore=.03,n=players,vote_rule=vote_rule)[3] for _ in range(ev_n)]
        return sum(outcomes)/ev_n
    base_rate=eval_policy(baseline_w,seed+100000)
    trained_rate=eval_policy(weights,seed+100000)
    result={'version':3,'trainer':'curriculum-36-court-abstraction','voteRule':vote_rule,'games':rounds,'players':players,'seed':seed,
            'features':list(FEATURES),'actions':list(ACTIONS),'weights':weights,
            'roleCoverage':dict(sorted(role_counts.items())),'roleIds':ROLE_IDS,'evaluation':{'matches':ev_n,'baselineWolfWinRate':round(base_rate,4),
                          'trainedWolfWinRate':round(trained_rate,4),
                          'note':'Abstract self-play vs self-play, NOT human performance. Neutral victory unsupported; rates should not be interpreted as 3-faction balance.'},
            'limitations':'36 role IDs sampled; night skills approximate. Court uses nomination 20% and configurable YES threshold, but defense/timing abstract. Independent victory, lovers, and unique roles are NOT accurate. Browser weights affect speech only. Not a validated 36-role balance model.'}
    POLICY.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Đã gặp {len(role_counts)}/36 vai; '+', '.join(f'{r}:{role_counts[r]}' for r in ROLE_IDS if role_counts[r]==0))
    print(f'Hoàn thành {rounds:,} ván; {days/rounds:.1f} ngày/ván; đánh giá {ev_n} ván: Sói {base_rate:.1%} (gốc) -> {trained_rate:.1%} (mới).')
    print('LƯU Ý: Phe Độc Lập chưa được chấm thắng đúng; chưa thể đánh giá cân bằng 3 phe.')
    print('Đã lưu:',POLICY)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--games',type=int,default=1000);p.add_argument('--players',type=int,default=8);p.add_argument('--seed',type=int,default=42)
    p.add_argument('--vote-rule',choices=['majority','supermajority'],default='supermajority')
    a=p.parse_args();train(max(1,min(100000,a.games)),a.seed,a.players,report_every=max(100,a.games//10),vote_rule=a.vote_rule)
