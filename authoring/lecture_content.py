"""1~4장 본문과 표시 순서 기준의 슬라이드 대응표."""
from lecture_ch1 import lessons as ch1
from lecture_ch2 import lessons as ch2
from lecture_ch3 import lessons as ch3
from lecture_ch4 import lessons as ch4

def make_lessons():
    items = ch1()+ch2()+ch3()+ch4()
    # 기존 ID/문제/학습 기록은 유지하고 세부 강의는 한 장 안의 단락으로 표시한다.
    items[2]['code'] = '점검 범위 합의\n→ 허용된 대상·기간·기법 안에서 확인\n→ 최소 증거 보존·보고\n→ 원인 제거와 복구 검증'
    items[2]['codeNotes'] = ['명시적으로 허용한 범위를 정합니다.','범위를 벗어나면 중단하고 재확인합니다.','실제 개인정보를 과도하게 수집하지 않습니다.','협업하여 기능·무결성·재발 여부를 검증합니다.']
    items[2]['terms'] = [['윤리','기술 사용의 책임과 허용 범위','사전 허가'],['거버넌스','의사결정·책임 구조','정책과 업무'],['사고 대응','증거·격리·복구·검증','담당자 협업']]
    items[2]['mistakes'] = ['점검 도구 사용 능력과 접근 권한을 혼동하지 않습니다.','PPT의 과거 통계·법률 표를 현행 수치로 일반화하지 않습니다.']
    items[23]['terms'] = [['CSRF','인증 상태를 이용한 원치 않는 요청','상태 변경과 자동 인증'],['CSRF 토큰','요청 정당성 검증 값','서버 검증'],['안전한 출력','데이터를 코드와 분리','출력 문맥'],['API 권한','요청별 자원 접근 제어','서버에서 검사']]
    return items

def coverage(items):
    counts = [40,74,78,56]
    result = []
    for ch,total in enumerate(counts,1):
        for page in range(1,total+1):
            matches = [dict(lessonId=l['id'],sectionIndex=i,heading=s['heading'])
                for l in items for i,s in enumerate(l['sections'])
                if any(r['sourceId']==f'P{ch}' and page in r['pages'] for r in s['sources'])]
            front = {1:'표지',2:'목차',3:'학습목표'}
            reason = front.get(page) or ('개정 안내' if ch==2 else '마무리') if page in [1,2,3,total] else None
            assert matches or reason, (ch,page,'설명에 연결되지 않은 슬라이드')
            assert not (matches and reason), (ch,page,'본문/표지 분류 중복')
            result.append(dict(sourceId=f'P{ch}',page=page,kind='content' if matches else 'frontmatter',reason=reason,sections=matches))
    assert sum(r['kind']=='content' for r in result)==232
    return result
