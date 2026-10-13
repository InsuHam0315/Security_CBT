# 수업 자료와 보완 설명

표의 위치는 PPTX 실제 표시 순서입니다. 보완은 같은 주제의 판단 조건을 설명하기 위한 것이며 새로운 시험 범위를 선언하지 않습니다.

| 위치 | 수업 자료에서 주의할 설명 | 사이트의 보완 |
|---|---|---|
| P2 13 | `/etc/passwd`의 비밀번호 필드와 UID/GID 설명 | `x`는 보통 shadow에 별도 저장된다는 표시. 암호화된 비밀번호 자체나 로그인 가능 여부의 증거로 단정하지 않는다. UID와 기본 GID를 구분한다. |
| P2 20 | XDMCP 6000 포트 표기 | XDMCP는 UDP 177. X11 서버의 6000 계열 포트와 구분한다. |
| P2 27 | NTFS의 거부 우선·권한 합산 요약 | 학습용 단순 규칙과 실제 명시/상속 ACE의 순서·유효 권한을 구분한다. 모든 상황에 단순 규칙을 적용하지 않는다. |
| P2 49 | W3C 로그 예의 `200 0 0` | `#Fields`가 선언한 순서가 기준. 필드 선언 없이 세 수치를 전송 바이트로 확정하지 않는다. 가상 사례에는 필드를 명시한다. |
| P3 36 | 목적지 .255를 사용하는 Smurf 도식 | 지향 브로드캐스트는 네트워크 프리픽스에서 계산. 모든 .255가 브로드캐스트인 것은 아니며 전달·응답 정책도 필요하다. |
| P3 76 | 무선 EAP 인증의 해시 전송 요약 | EAP 방식마다 메시지와 신뢰 조건이 다르므로 한 도식을 모든 EAP 방식으로 일반화하지 않는다. |
| P4 52 | 일부 태그와 따옴표가 생략된 CSRF HTML 예 | 원 예를 실행 코드로 복제하지 않고 브라우저의 세션 쿠키 전송·서버 토큰 검증 과정을 가상 흐름으로 설명한다. |

추가로 NGINX allow/deny는 첫 일치 규칙, TCP의 SYN/FIN은 순서 공간에서 각각 1을 소비하는 조건을 설명했습니다. 네트워크 단편의 끝 위치는 제외하는 반열린 구간으로 명시해 중첩 길이 계산을 일관되게 했습니다. 로그의 200 응답만으로 정상 권한·사고 부재를 단정하지 않습니다.

역사적 사건·기술 소개는 수업 맥락으로 다룹니다. 법률의 현재 형량이나 최신 사건 세부를 시험 정답처럼 추가하지 않았습니다. 원문에서 언급한 암호·AI·패스키 등은 소개 및 신뢰 조건 수준으로 제한했습니다.

보완 확인에 사용한 1차 자료:

- [Linux passwd(5)](https://man7.org/linux/man-pages/man5/passwd.5.html): passwd 필드와 shadow 표시
- [X.Org XDMCP 명세](https://xorg.freedesktop.org/archive/X11R7.7/doc/libXdmcp/xdmcp.html): UDP 177
- [Microsoft DACL ACE 순서](https://learn.microsoft.com/en-us/windows/win32/secauthz/order-of-aces-in-a-dacl): 명시·상속과 deny/allow 정렬
- [Microsoft IIS 로그 필드](https://learn.microsoft.com/en-us/iis/configuration/system.applicationhost/sites/site/logfile/): W3C 필드 설정
- [NGINX 접근 모듈](https://nginx.org/en/docs/http/ngx_http_access_module.html): 순서대로 검사하는 접근 규칙
- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html): TCP 순서·확인 번호

공개 블로그의 교재 연습문제 답안은 공식 해답으로 채택하지 않았습니다. 원문과 판본 대조가 필요합니다.
