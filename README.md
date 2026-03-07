# ipTIME WOL Fast

서버에서 ipTIME 공유기에 로그인하여 등록된 WOL(Wake-on-LAN) 기기 목록을 가져오고, 내부 API 라우트를 통해 WOL 신호를 전송하는 Next.js 애플리케이션입니다.

## 환경 변수

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
iptime_end_point=http://your-router-host:9999
iptime_id=your-router-admin-id
iptime_pw=your-router-admin-password
```

`.env` 파일은 git에 의해 무시됩니다. `.env.example` 파일을 템플릿으로 사용하세요.

## 개발 설정

```bash
npm install
npm run dev
```

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
