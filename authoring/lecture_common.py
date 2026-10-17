"""PPT 실제 표시 순서에 따른 강의 저작 도구. 원본 이미지/파일은 배포하지 않는다."""
import json
import math
from pathlib import Path

SUPPORT = json.loads((Path(__file__).parent / 'practice_support.json').read_text(encoding='utf-8'))

def S(pages, heading, *body, table=None, code=None):
    if isinstance(pages, int): pages = [pages]
    item = dict(heading=heading, body=list(body), pages=list(pages))
    if table: item['table'] = dict(columns=table[0], rows=table[1])
    if code: item['code'] = code
    return item

def E(heading, *body, links=()):
    return dict(heading=heading, body=list(body), links=[dict(title=t,url=u) for t,u in links])

def Q(question, answer, explanation):
    return dict(question=question, answer=answer, explanation=explanation)

def L(n, chapter, title, outline, sections, checks, extras=()):
    assert len(checks) == 3
    sid = f'P{chapter}'
    pages = []
    for section in sections:
        pp = section.pop('pages')
        section['sources'] = [dict(sourceId=sid, pages=pp)]
        pages.extend(pp)
    assert pages == sorted(pages), (n, pages)
    old = SUPPORT[f'SL{n:02}']
    chars = sum(len(p) for s in sections for p in s['body'])
    return dict(id=f'SL{n:02}',topic='ABCD'[chapter-1],title=title,pptOutline=outline,
        minutes=max(10,math.ceil(chars/220)+5),intro=f'{outline}에 해당하는 PPT {min(pages)}~{max(pages)}번 슬라이드를 순서대로 설명합니다. 표와 그림의 의미는 글과 표로 풀어썼습니다.',
        prerequisiteIds=[f'SL{n-1:02}'] if n>1 else [],
        objectives=[c['question'] for c in checks],
        sections=sections,additionalSections=list(extras),sources=[dict(sourceId=sid,pages=sorted(set(pages)))],supplements=[],
        selfChecks=checks,keyPoints=[c['answer'] for c in checks],check=dict(question=checks[0]['question'],answer=checks[0]['answer']),
        walkthrough=['아래 자료와 문제는 PPT 원문에 실린 사례가 아니라, 개념 적용을 위해 직접 만든 가상 사례입니다.','가상 수치·계정·주소의 조건 안에서만 판단하고, 앞의 PPT 본문과 구분해 복습하세요.'],workedExamples=[],caseIds=[],
        tags=[r[0] for r in old['terms']],**old)
