# 거지와 공주

공주시 음식점의 메뉴·가격 정보를 지도와 검색으로 보여 주는 웹앱입니다. 데이터는 [`data/restaurants.json`](data/restaurants.json)에서 읽으며, 이후 API·DB로 바꿀 때는 [`lib/restaurants.ts`](lib/restaurants.ts)의 `getRestaurants()`만 교체하면 됩니다.

## 필요 환경

- Node.js 20 이상 권장
- [카카오맵 JavaScript API](https://apis.map.kakao.com/web/guide/)용 **JavaScript 키**

## 카카오맵 키 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에서 앱을 만들고 **JavaScript 키**를 확인합니다.
2. 앱 설정 → **플랫폼** → **Web**에 사이트 도메인을 등록합니다. 로컬 개발 시 `http://localhost:3000`을 추가합니다.
3. 프로젝트 루트에 `.env.local` 파일을 만들고 다음을 넣습니다 (값은 본인 키로 교체).

```bash
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=여기에_JavaScript_키
```

`.env.example` 파일도 참고하세요. 환경 변수를 바꾼 뒤에는 개발 서버를 다시 실행합니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 빌드

```bash
npm run build
npm start
```

## 데이터

- 형식은 [`lib/types/restaurant.ts`](lib/types/restaurant.ts)의 `Restaurant` 타입을 따릅니다.
- 검색은 이름·주소·태그·메뉴명에 대해 동작합니다.
- **리뷰**는 MySQL에 저장됩니다 (`lib/reviewsStore.ts` → Prisma).

## 리뷰 DB (로컬 MySQL)

`.env.local`에 `DATABASE_URL`을 넣은 뒤:

```bash
npm run db:push    # reviews 테이블 생성 (로컬)
npm run dev
```

## Vercel 배포 (리뷰 포함)

로컬 PC의 MySQL(`localhost`)은 Vercel에서 접속할 수 없습니다. **클라우드 MySQL**이 필요합니다.

### 1. 클라우드 MySQL 만들기 (예: Railway)

1. [Railway](https://railway.app/) 가입 → **New Project** → **MySQL** 추가
2. MySQL 서비스 → **Connect** → **Public URL** 또는 연결 문자열 복사
3. URL 끝에 `?connection_limit=5` 를 붙이는 것을 권장합니다.

### 2. 테이블 생성 (한 번만)

로컬 `.env.local`에 Railway URL을 잠깐 넣거나, 별도 `.env.production.local` 파일을 만든 뒤:

```bash
npm run db:push:cloud
```

### 3. Vercel 환경 변수

Vercel 프로젝트 → **Settings → Environment Variables**

| 이름 | 값 |
|------|-----|
| `DATABASE_URL` | Railway(또는 다른 클라우드) MySQL URL |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 카카오 JavaScript 키 |

### 4. 카카오맵 도메인

카카오 개발자 콘솔 → Web 플랫폼에 Vercel 주소 추가  
예: `https://your-project.vercel.app`

### 5. GitHub push → Vercel 재배포

배포 후 배포 사이트에서 리뷰 작성·조회가 MySQL에 저장됩니다.

## 보안

- 취약점 제보: [`SECURITY.md`](SECURITY.md)
- Push/PR 시 의존성·시크릿 검사: [`.github/workflows/security.yml`](.github/workflows/security.yml)
- 의존성 자동 업데이트 PR: [`.github/dependabot.yml`](.github/dependabot.yml)
- API 키는 `.env.local`에만 두고, 저장소에는 [`.env.example`](.env.example)만 올립니다.

