"""Paired-seed diagnostic for two court thresholds. Abstract simulator, NOT actual game."""
import argparse,random,collections
from selfplay36 import ACTIONS,FEATURES,simulate
p=argparse.ArgumentParser();p.add_argument('--games',type=int,default=500);p.add_argument('--players',type=int,default=8);p.add_argument('--seed',type=int,default=2026)
a=p.parse_args()
weights={x:[0.0]*len(FEATURES) for x in ACTIONS}
print('CHỈ MÔ PHỎNG XẤP XỈ — không phản ánh tỷ lệ thắng trong game thật.')
for rule in ('supermajority','majority'):
    results=[]; days=[]
    for i in range(a.games):
        _,_,day,wolf=simulate(weights,random.Random(a.seed+i),explore=.03,n=a.players,vote_rule=rule)
        results.append(wolf);days.append(day)
    print(f'{rule}: {sum(results)}/{len(results)} Sói thắng ({sum(results)/len(results):.1%}), {sum(days)/len(days):.1f} ngày/ván')
print('Phe độc lập chưa có điều kiện thắng chính xác; không dùng để kết luận cân bằng 3 phe.')
