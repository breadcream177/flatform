# Environment Setup

이 문서는 Between Jobs 로컬 실행에 필요한 환경변수 설정 기준을 정리합니다.

## Frontend

위치:

```text
frontend/community-frontend
```

예시 파일:

```text
.env.example
```

로컬에서 값을 바꾸고 싶으면 `.env.local`을 만들어 사용합니다.

```text
VITE_API_BASE_URL=http://localhost:8080
```

`VITE_API_BASE_URL`은 프론트가 호출할 백엔드 주소입니다.

로컬 실행:

```powershell
npm.cmd run dev
```

## Backend

위치:

```text
backend/community-backend
```

예시 파일:

```text
.env.example
src/main/resources/application-example.yml
```

백엔드는 `application.yml`에서 `.env` 파일을 자동으로 읽도록 설정되어 있습니다.
로컬 실행 전에 `.env.example`을 참고해서 `.env`를 만들고 필요한 값을 채웁니다.
`application.yml`이 없다면 `src/main/resources/application-example.yml`을 참고해서 `application.yml`을 만듭니다.

필수 확인 값:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
FRONTEND_ORIGIN
NAVER_SEARCH_CLIENT_ID
NAVER_SEARCH_CLIENT_SECRET
GEMINI_API_KEY
GEMINI_MODEL
```

소셜 로그인을 사용할 경우 추가로 확인합니다.

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
KAKAO_REDIRECT_URI
```

로컬 실행:

```powershell
.\gradlew.bat bootRun
```

## Important Notes

`.env` 파일은 실제 개인 설정과 API 키가 들어갈 수 있으므로 커밋하지 않습니다.

`application.yml`에는 실제 키를 직접 적지 않고 환경변수 이름만 남깁니다.

`change-me` 값이 남아 있으면 Naver 검색, Gemini 요약, OAuth 로그인은 정상 동작하지 않을 수 있습니다. 이 경우 기능이 조용히 더미 데이터로 대체되지 않고 명확한 오류 메시지를 반환하도록 구성되어 있습니다.
