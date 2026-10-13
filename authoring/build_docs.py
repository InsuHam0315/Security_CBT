"""직접 작성한 콘텐츠 ID와 참조로 출처·커버리지 문서를 생성한다."""
import json
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1]
read=lambda name:json.loads((root/'src/content'/f'{name}.json').read_text(encoding='utf8'))
sources,topics,lessons,cases,questions,rounds=map(read,['sources','topics','lessons','cases','questions','blueprints'])
cm={c['id']:c for c in cases};qm={q['id']:q for q in questions}
docs=root/'docs';docs.mkdir(exist_ok=True)
refs=lambda item:'; '.join(r['sourceId']+' '+','.join(map(str,r['pages'])) for r in item['sources'])
lines=['# 자료 목록과 슬라이드별 출처 지도','','Lecture 폴더와 하위 폴더에서 확인한 학습 파일은 아래 PPTX 4개입니다. 강의계획서·시험 공지·별도 코드·PDF는 발견되지 않았습니다. 시험 대비 범위는 사용자가 1~4장 전체로 확인했습니다.','','| ID | 로컬 자료 이름 | 실제 표시 슬라이드 수 | 분석 |','|---|---|---:|---|']
for s in sources:lines.append(f"| {s['id']} | {s['filename']} | {s['pages']} | 텍스트·표·그림·코드 렌더링 확인 |")
lines+=['','총 248장. 3·4장은 일반 PowerPoint 열기에서 오류가 있어 읽기 전용 복구 열기로 렌더링했습니다. 원본은 수정하지 않았습니다. 분석용 PDF와 이미지는 저장소 밖에 보관하며 공개하지 않습니다. 읽지 못한 자료는 없습니다.','','아래 번호는 표지를 포함한 1부터 시작하는 **PPTX의 실제 표시 순서**입니다. presentation.xml의 관계 순서로 계산했으며 내부 slideN.xml 번호나 교재 쪽수와 같다고 가정하지 않습니다. 콘텐츠 출처 버튼에서도 같은 번호를 표시합니다.','','`—`는 분석했지만 해당 슬라이드를 직접 근거로 연결한 콘텐츠가 없다는 뜻입니다. 원문을 추출·재게시하는 표가 아닙니다.']
for s in sources:
 lines += ['',f"## {s['id']} · {s['filename']}",'','| 슬라이드 | 강의 | 사례 | 문항 |','|---:|---|---|---|']
 for page in range(1,s['pages']+1):
  matching=lambda items:[i['id'] for i in items if any(r['sourceId']==s['id'] and page in r['pages'] for r in i['sources'])]
  lines.append('| '+str(page)+' | '+' | '.join(', '.join(matching(items)) or '—' for items in [lessons,cases,questions])+' |')
lines+=['','## 교재 연습문제','','교재: 양대일, 『정보 보안 개론』 4판, 한빛아카데미, ISBN 9791156645443. [출판사](https://www.hanbit.co.kr/books/B8742050283?code=B8742050283)는 공식 연습문제 해답을 제공하지 않는다고 안내합니다.','','인터넷에서 발견한 제3자 게시물: [1장](https://greencloud.tistory.com/99), [2장](https://aengdoo25.tistory.com/3), [3장](https://aengdoo25.tistory.com/2), [4장](https://aengdoo25.tistory.com/1). 1장은 판본 미표기, 2~4장은 제목에 개정4판 표기. 책의 원문·번호·정답과 일치하는지는 미검증입니다. 전체를 복제해 콘텐츠에 넣지 않았습니다. 직접 작성한 예상문제와 교재 복습 체크리스트를 분리합니다. 실제 족보는 아직 제공되지 않았습니다.']
(docs/'SOURCES.md').write_text('\n'.join(lines)+'\n',encoding='utf8',newline='\n')
lines=['# 시험 범위와 콘텐츠 커버리지','','사용자 확인 범위: 1~4장 전체. 교수자의 공지·실제 시험 규격은 미확인. 5장 이후 독립 강의를 추가하지 않았습니다. 소개 수준의 암호·서명·프로토콜은 1~4장에서 다룬 수준에 맞춥니다.','','| 범위 | 강의 | 사례 | 고유 문항 |','|---|---:|---:|---:|']
for t in topics:lines.append(f"| {t['title']} | {sum(l['topic']==t['id'] for l in lessons)} | {sum(c['topic']==t['id'] for c in cases)} | {sum(q['topic']==t['id'] for q in questions)} |")
lines+=['','각 사례는 직접 만든 가상 자료이며 5문항을 공유합니다. 이름·숫자만 바꾼 복제 사례를 만들지 않았습니다.','','| 강의 | 제목 | 사례 | 고유 문항 | 근거 슬라이드 |','|---|---|---|---|---|']
for l in lessons:
 cs=[c for c in cases if c['lessonId']==l['id']];qs=[q for q in questions if q['lessonId']==l['id']]
 lines.append(f"| {l['id']} | {l['title']} | {', '.join(c['id'] for c in cs)} | {', '.join(q['id'] for q in qs)} | {refs(l)} |")
lines+=['','## 사례와 문항 연결','','| 사례 | 제목 | 자료 유형 | 강의 | 문항 | 근거 슬라이드 |','|---|---|---|---|---|---|']
for c in cases:lines.append(f"| {c['id']} | {c['title']} | {c['kind']} | {c['lessonId']} | {', '.join(c['questionIds'])} | {refs(c)} |")
lines+=['','## 고정 종합 회차','','각 회차는 아래 사례 순서대로 각 5문항을 연속 배치합니다. 기본 50문항·75분은 사이트의 학습 설정입니다. 연습·시험은 같은 구성을 사용하고 선택적 선지 섞기는 문항 순서를 바꾸지 않습니다.','','| 회차 | 사례 순서 | 1장 | 2장 | 3장 | 4장 | 합계 |','|---|---|---:|---:|---:|---:|---:|']
sets=[]
for r in rounds:
 ids=[q for cid in r['caseIds'] for q in cm[cid]['questionIds']];sets.append(set(ids));counts=Counter(qm[q]['topic'] for q in ids)
 lines.append('| '+r['id']+' | '+', '.join(r['caseIds'])+' | '+' | '.join(str(counts[t['id']]) for t in topics)+' | '+str(len(ids))+' |')
lines+=['','250개 출제 슬롯 = 160개 고유 문항 + 90번의 회차 간 재사용. 한 회차 안의 중복은 0입니다. 1장은 개념 소개 중심이므로 5문항, 시스템·네트워크·웹은 각 15문항으로 배분했습니다. 모든 사례와 고유 문항은 최소 한 회차에 포함됩니다.','','| 회차 조합 | 공유 문항 수 |','|---|---:|']
for i,a in enumerate(rounds):
 for j in range(i+1,len(rounds)):lines.append(f"| {a['id']} / {rounds[j]['id']} | {len(sets[i]&sets[j])} |")
lines+=['','두 회차의 공유 개수를 모두 더한 값은 90번의 추가 출제 횟수와 다른 집계입니다. 세 회차 이상에 쓰인 문항은 조합마다 계산됩니다.','', '문항 형식: '+', '.join(f'{k} {v}' for k,v in Counter(q['kind'] for q in questions).items())+'.','', '강의·개별 사례·오답·북마크의 집중 복습은 종합 회차와 별도 준비 화면으로 이동합니다. 향후 실제 기출은 출처를 확인해 별도 컬렉션으로 추가하며 현재 예상문제의 출처 표시를 바꾸지 않습니다.']
(docs/'COVERAGE.md').write_text('\n'.join(lines)+'\n',encoding='utf8',newline='\n')
