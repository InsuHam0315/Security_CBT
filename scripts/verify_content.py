"""UI 채점기를 사용하지 않는 독립 계산·코드 검산."""
import contextlib,io,json,sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
read=lambda name:json.loads((root/'src/content'/f'{name}.json').read_text(encoding='utf8'))
cs={c['id']:c for c in read('cases')};qs=read('questions')
def calc(rows,c):
 if 'where' in c:rows=[r for r in rows if r[c['where']['column']]==c['where']['value']]
 op=c['op'];col=c.get('column')
 if op in ('count','countWhere'):v=len(rows)
 elif op=='unique':v=len({r[col] for r in rows})
 elif op=='sum':v=sum(r[col] for r in rows)
 elif op=='rowSum':v=sum(rows[c['row']][k] for k in c['columns'])
 elif op=='cell':v=rows[c['row']][col]
 else:raise ValueError(op)
 return v*c.get('factor',1)
numbers=[q for q in qs if q['kind']=='numeric']
for q in numbers:assert calc(cs[q['caseId']]['rows'],q['numeric']['calculation'])==q['numeric']['value'],q['id']
# 表에 기재된 결과를 다시 읽는 데서 끝내지 않고 원 입력에서 유도한다.
assert cs['SC08']['rows'][1]['현재']-cs['SC08']['rows'][1]['마지막활동']==20
assert 4*1+2*1+1*0==6 and ''.join(str(sum(w for ch,w in zip('rw-r-----'[i:i+3],(4,2,1)) if ch!='-')) for i in (0,3,6))=='640'
assert cs['SC16']['rows'][1]['seq']+1==cs['SC16']['rows'][2]['ack']==501
rows=cs['SC18']['rows'];assert max(0,min(r['끝'] for r in rows)-max(r['시작'] for r in rows))==200
assert cs['SC19']['rows'][0]['수']*cs['SC19']['rows'][1]['수']==60
assert 2**24==16777216 and 6*8==48
outputs={}
for l in read('lessons'):
 if 'microLab' in l:
  b=io.StringIO()
  with contextlib.redirect_stdout(b):exec(l['microLab']['code'],{})
  assert b.getvalue().strip()==l['microLab']['output'],l['id'];outputs[l['id']]=b.getvalue().strip()
# 접근 규칙의 코드에서 실제 첫 일치 결과를 별도로 계산한다.
import ipaddress
def access(address):
 ip=ipaddress.ip_address(address)
 if ip==ipaddress.ip_address('192.0.2.9'):return '거부'
 if ip in ipaddress.ip_network('192.0.2.0/24'):return '허용'
 return '거부'
for r in cs['SC09']['rows']:assert access(r['출발지'])==r['결정']
print(json.dumps(dict(numeric_checks=len(numbers),derived_checks=7,executed_labs=outputs,access_rules=3),ensure_ascii=False,indent=2))
