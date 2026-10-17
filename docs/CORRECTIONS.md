# 수업 자료와 구분한 추가 해설·정정

본문은 PPT의 순서와 항목을 설명하고, 아래는 원자료의 오류·버전 차이 또는 추가 해석이다. 시험의 정정 기준을 새로 선언하지 않는다.

## SL01 · 역사 표기의 정정

콜로서스는 토미 플라워스가 개발한 로렌츠(Tunny) 암호 해독용 장치입니다. 에니그마 해독의 봄브와 콜로서스를 같은 장치로 설명하지 않습니다. PPT의 「튜링이 만든 에니그마 해독용 콜로서스」 문장은 정정이 필요합니다.
모리스 웜은 FBI 자료에서 1988년 11월 2일로 확인됩니다. DEF CON 창립자의 회고는 첫 대회를 1993년으로 기록합니다. PPT의 11월 22일·1990년과 구분합니다.
PPT의 개인용 컴퓨터 연표는 제품·설립 시점이 섞여 있습니다. 애플은 공식 회사 연혁에서 1976년 설립으로 밝힙니다. 숫자 자체가 출제되는 경우 강의 정정 여부를 확인할 항목입니다.

- [콜로서스 박물관](https://www.tnmoc.org/colossus)
- [FBI 모리스 웜 기록](https://www.fbi.gov/history/cases-and-criminals/morris-worm)
- [DEF CON 창립자 회고](https://forum.defcon.org/node/196999)
- [Apple 설립 연혁](https://www.apple.com/tn/newsroom/2026/03/apple-to-celebrate-50-years-of-thinking-different/)

## SL03 · 법률·통계의 시점 구분

본문은 PPT에 실린 범죄 유형·조항·형량을 빠뜨리지 않고 설명한 것입니다. 개인정보 관련 규정 등은 개정·이관될 수 있으므로 PPT 표를 현행 법률표로 사용하지 않습니다. 현행 정보통신망법 제48조는 정당한 권한 없는 침입 또는 허용 범위를 넘은 침입을 금지합니다. 시험에서 특정 조문·형량을 묻는다면 교수자의 정정·기준 시점을 확인할 항목입니다.

- [국가법령정보센터 제48조](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1028660557)

## SL05 · 버전과 정책에 따라 달라지는 계정 설명

PPT의 Guests·Power Users 표는 과거 Windows의 설명입니다. 현대 Windows의 실제 로컬·원격 로그인 허용은 정책과 구성에 따라 달라집니다. /etc/passwd의 로그인 셸도 모든 시스템에서 bash로 고정되는 것은 아닙니다.

- [passwd 파일 형식](https://man7.org/linux/man-pages/man5/passwd.5.html)

## SL07 · XDMCP 포트 및 규칙의 정정

XDMCP는 UDP 177을 사용합니다. PPT의 6000은 X11 디스플레이 연결에서 사용하는 TCP 6000 계열과 구분해야 합니다. NGINX의 순서 규칙은 NGINX 접근 모듈의 동작이며 다른 제품의 정책 처리 방식까지 일반화하지 않습니다.

- [XDMCP 규격](https://xorg.freedesktop.org/archive/X11R7.7/doc/libXdmcp/xdmcp.html)
- [NGINX access 모듈](https://nginx.org/en/docs/http/ngx_http_access_module.html)

## SL08 · NTFS의 거부 우선 설명을 읽는 범위

Windows의 권장 ACE 순서는 명시적 항목을 상속 항목보다 앞에 두고, 같은 명시적 항목 안에서 거부를 허용보다 앞에 둡니다. 따라서 모든 상속 거부가 모든 명시적 허용보다 우선한다고 외우면 틀릴 수 있습니다.
PPT의 읽기 및 실행 항목에 적힌 「파일 옮기기」는 해당 권한만으로 모든 이동이 가능하다는 뜻으로 사용하면 안 됩니다. 이동에는 원본·목적지의 쓰기·삭제 등 권한이 추가로 관계합니다. 또한 NT 4.0 이후의 모든 설치가 반드시 NTFS라는 식으로 일반화하지 않습니다.

- [Microsoft ACE 순서](https://learn.microsoft.com/en-us/windows/win32/secauthz/order-of-aces-in-a-dacl)

## SL10 · 출처 오류와 로그 해석 보충

PPT의 /usr/adm 설명에 포함된 데이터베이스 오브젝트 언급은 로그 경로 설명과 맞지 않는 문장입니다. 경로는 UNIX 배포판·서비스별 실제 설정을 기준으로 확인합니다. IIS의 200 0 0은 선택한 필드가 상태/하위 상태/Win32 상태일 수 있으므로 파일 헤더를 기준으로 판독합니다.

- [IIS 로그 필드](https://learn.microsoft.com/en-us/iis/configuration/system.applicationhost/sites/site/logfile/)
- [Apache LogFormat](https://httpd.apache.org/docs/2.4/mod/mod_log_config.html)

## SL11 · Android 연표의 정정

Android 공식 개발자 블로그의 1.0 SDK 및 첫 G1 발표 기록은 2008년 9월 23일입니다. 2007년의 초기 플랫폼 공개와 상용 1.0 기기 발표를 구분합니다. Android 1.1은 2009년 2월 공개됐고 내부명은 Petit Four이며, PPT에 등장하는 iPhone은 Android 1.1의 코드명이 아닙니다.

- [Android 1.0 발표](https://android-developers.googleblog.com/2008/09/announcing-android-10-sdk-release-1.html)
- [Android 1.1 발표](https://android-developers.googleblog.com/2009/02/android-11-sdk-release-1-now-available.html)
- [AOSP 과거 버전 안내](https://android.googlesource.com/platform/docs/source.android.com/%2B/jb-dev/src/source/overview.md)

## SL12 · PPT의 케이블·주소 표를 읽는 기준

PPT의 CAT 표와 오른쪽 연혁 그림은 같은 등급에 서로 다른 전송률을 제시합니다. CAT6의 250MHz 같은 주파수 대역폭과 실제 링크 전송률을 혼합해서 외우지 않습니다. 전송률은 적용 이더넷 규격·길이·장비에 따라 판단합니다.
클래스 A의 0·127 대역 등에는 특수 용도가 있으므로 표의 전체 비트 조합 수를 사용 가능한 일반 호스트 수로 그대로 쓰지 않습니다. 클래스 표는 역사적 분류이며 실제 네트워크/호스트 경계는 서브넷 마스크·CIDR 프리픽스로 확인합니다.


## SL17 · 파일명·제로 트러스트·응답 조건 정정

정확한 파일명은 /etc/hosts.equiv입니다. 과거 호스트 신뢰의 실제 허용 여부는 사용자·서비스·PAM 등 조건도 영향을 줍니다. 이 방식을 현대의 제로 트러스트로 부르면 안 됩니다.
DNS 응답은 질의 ID·포트·이름/유형 등 대응 조건을 확인해야 하므로 먼저 도착했다는 이유만으로 모두 채택되는 것은 아닙니다. ICMP Redirect도 기존 게이트웨이와 같은 링크의 새 게이트웨이 등 검증 조건을 갖습니다.
ARP 경로를 가로챘다고 정상 검증되는 HTTPS의 암호문을 바로 복호화할 수 있는 것은 아닙니다. 경로 통제와 암호·인증 검증은 다른 경계입니다.

- [hosts.equiv 형식](https://man7.org/linux/man-pages/man5/hosts.equiv.5.html)
- [RFC 5452 DNS 응답 검증](https://www.rfc-editor.org/rfc/rfc5452.html)
- [RFC 1122 Redirect 검증](https://www.rfc-editor.org/rfc/rfc1122.html)

## SL19 · 무선 표·인증 그림의 해석 보충

802.11i는 보안 개선 규격이므로 b/a/g/n처럼 전송률 세대로만 배열하면 혼동이 생깁니다. 또한 EAP-TLS는 인증서와 TLS를 사용하는 방식이어서 PPT의 해시 도전·응답 하나로 모든 Enterprise 인증을 설명할 수 없습니다.
추가 계산으로 24비트 IV의 조합 수는 2의 24승, 16,777,216가지입니다. 이는 가능한 IV 수이며 그 수만큼 반드시 수집해야만 공격이 가능하다거나 동일한 시간이 걸린다는 뜻은 아닙니다.


## SL20 · 연결 종료·캐시·HTTP 버전 보충

PPT의 매 응답 뒤 연결을 끊는 설명은 초기 HTTP의 단순화한 흐름입니다. HTTP/1.1은 지속 연결을 기본으로 하며 HTTP/2·3도 하나의 응답이 끝났다고 항상 연결을 종료하지 않습니다. HTML을 스크립트로 부르는 표현과 응답의 상태 줄도 버전·역할에 따라 구분합니다.

- [HTTP 의미 규격 RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)
- [HTTP/1.1 RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html)

## SL22 · 직접 만든 코드 예제의 범위

아래 Python/SQLite 예제와 계산은 PPT의 Node.js 코드를 그대로 옮긴 것이 아닙니다. 문자열 결합과 값 바인딩의 차이를 메모리 내부 가상 테이블에서 확인하는 별도 학습 예제입니다. 결과 2와 0은 해당 테이블·자료형·입력 조건에만 해당합니다.


## SL23 · XSS와 쿠키 속성의 관계

HttpOnly는 스크립트의 쿠키 읽기를 제한하지만 XSS 실행 자체를 없애지는 않습니다. 스크립트가 같은 출처에서 요청을 보내거나 화면을 바꾸는 피해도 있으므로 출력 문맥에 맞는 인코딩·안전한 DOM API·검증된 HTML 정화와 CSP 같은 방어를 조합합니다. 아래 사례의 쿠키·주소·사용자는 직접 만든 가상 자료입니다.
