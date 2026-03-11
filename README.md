# ipTIME WOL Fast

서버에서 ipTIME 공유기에 로그인하여 등록된 WOL(Wake-on-LAN) 기기 목록을 가져오고, 내부 API 라우트를 통해 WOL 신호를 전송하는 Next.js 애플리케이션입니다.

## 환경 변수

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
iptime_end_point=http://your-router-host:9999
iptime_id=your-router-admin-id
iptime_pw=your-router-admin-password
WOL_WEB_PASSWORD_HASH=sha256-hex  # 비워두면 비번 없이 동작
```

`.env` 파일은 git에 의해 무시됩니다. `.env.example` 파일을 템플릿으로 사용하세요.

## 개발 설정

```bash
npm install
npm run dev
```

### 웹 잠금 비밀번호 변경

```bash
npm run set-password -- <원하는_비밀번호>
npm run set-password -- --disable
```

`set-password`는 평문 비밀번호를 받아 SHA-256 해시를 생성해 `.env`의 `WOL_WEB_PASSWORD_HASH`에 저장한다.
`--disable`을 쓰면 `WOL_WEB_PASSWORD_HASH`를 비워서 웹/API 인증을 비활성화한다.
`WOL_WEB_PASSWORD_HASH`가 비어 있으면 웹/API 인증을 요구하지 않습니다.

## API 라우트

- `GET /api/wol/devices`: 등록된 WOL 기기 목록 조회
- `POST /api/wol/wake`: WOL 신호 전송. JSON 바디: `{ "mac": "AA:BB:CC:DD:EE:FF", "name": "Optional label" }`

## 참고 사항

- 공유기 인증 정보는 서버 측에서만 사용됩니다.
- 런타임 통신은 `/cgi/service.cgi`에 대해 `fetch`를 사용합니다.
- 확인된 WOL 관련 메서드:
  - `session/login`
  - `session/info`
  - `wol/show`
  - `wol/signal`
