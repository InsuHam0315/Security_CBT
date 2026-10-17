# GitHub Pages 배포

- 저장소: https://github.com/InsuHam0315/Security_CBT
- 배포 브랜치: `codex/computer-security-cbt`
- Vite base: `/` (환경 변수 `VITE_BASE_PATH`로 다른 경로 빌드 가능)
- 공개 URL: https://ist-security.kro.kr/

2026-10-17에 내도메인.한국의 `ist-security.kro.kr` CNAME과 GitHub Pages Custom domain 연결에 맞춰 루트 경로로 변경했습니다. DNS의 CNAME 대상은 `insuham0315.github.io`이며 프로토콜·저장소 경로를 붙이지 않습니다. GitHub Pages는 해당 저장소의 Custom domain에 전체 도메인을 설정해야 합니다. 현재 워크플로 배포 방식은 저장소의 CNAME 파일을 사용하지 않습니다.

`ERR_NAME_NOT_RESOLVED`는 DNS 조회 문제입니다. 공개 DNS에서 CNAME과 IP가 정상 조회되는데 특정 브라우저만 실패하면 저장 완료 여부·잠시 전 실패한 DNS 캐시·사용 중인 DNS를 확인합니다. GitHub HTTPS 인증서가 `bad_authz`이면 DNS가 정상인 상태에서 같은 Custom domain을 제거 후 재등록해 인증서 발급을 다시 요청할 수 있습니다. 인증서 발급 후 HTTPS 강제를 켭니다. 관련 절차는 [GitHub 문제 해결 안내](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)를 참고합니다.

`HashRouter`로 `#/lessons/SL22` 같은 링크를 제공합니다. GitHub Pages의 서버 경로 재작성 없이 직접 방문·새로고침이 가능합니다. root의 기존 BigData_CBT 앱과 저장소를 공유하지 않습니다.

저장소 Settings → Pages의 빌드 소스는 GitHub Actions입니다. `.github/workflows/pages.yml`은 지정 브랜치 push 또는 수동 실행으로 다음을 수행합니다.

`github-pages` 환경의 허용 브랜치에 `codex/computer-security-cbt`를 정확히 등록했습니다. 초기 자동 설정은 main만 허용했으므로 지정 작업 브랜치의 배포가 거부되었고, 요청한 브랜치를 추가해 해결했습니다. 와일드카드로 다른 브랜치의 배포를 허용하지 않습니다. `.gitattributes`와 생성기의 LF 출력으로 Windows/Linux 빌드 자산 비교에서 줄바꿈 차이를 방지합니다.

1. 잠금 파일로 npm 의존성 설치
2. 콘텐츠/참조/회차 검사, 단위·저장 테스트, Python 독립 계산 및 코드 실행
3. TypeScript와 production 빌드
4. 임시 Chromium 컨텍스트의 4개 화면 폭·전체 메뉴 경로·자료·백업 검증
5. 검증된 `dist`만 Pages artifact로 업로드하고 배포

코드 읽기에는 contents:read, Pages 배포에는 pages:write와 id-token:write를 사용합니다. 서버 인증 키나 개인 데이터 파일을 빌드에 넣지 않습니다. 페이지 워크플로는 [GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 따릅니다.

배포 완료 확인은 Actions 성공뿐 아니라 원격 브랜치 HEAD, HTTPS 응답, 로컬 빌드와 공개 JS/CSS/SVG의 SHA-256, 실제 공개 강의·회차·메뉴 화면으로 진행합니다. 배포를 바꿀 때 동일 절차를 적용하세요.

로컬 `test-results`, 원본 PPTX·PDF·추출 원문, 인증 DB·학습 백업은 `.gitignore`로 제외하며 커밋 대상도 별도로 확인합니다. 내용 보강은 authoring 원본을 수정한 후 재생성·검사하고 푸시합니다.
