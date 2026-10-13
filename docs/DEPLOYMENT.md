# GitHub Pages 배포

- 저장소: https://github.com/InsuHam0315/Security_CBT
- 배포 브랜치: `codex/computer-security-cbt`
- Vite base: `/Security_CBT/`
- 공개 URL: https://insuham0315.github.io/Security_CBT/

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
