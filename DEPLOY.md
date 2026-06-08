# GitHub 배포 안내

이 폴더(`final`)에는 웹사이트 배포에 **필요한 파일만** 들어 있습니다.

## GitHub에 올리는 방법

1. GitHub에서 새 저장소를 만들거나 기존 저장소를 엽니다.
2. **`final` 폴더 안의 내용 전체**를 저장소 **루트**에 올립니다.  
   (`final` 폴더 이름 자체가 아니라, 안쪽 파일·폴더만 루트에 둡니다.)
3. 터미널 예시 (`final` 폴더에서):

```bash
git init
git add .
git commit -m "배포: 리뷰 MySQL, UI 개선"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## 절대 올리지 말 것

- `.env.local` (카카오 키, DB 비밀번호)
- `node_modules/`
- `.next/`
- `.vercel/`

## Vercel 배포 (리뷰 포함)

1. [Vercel](https://vercel.com)에서 GitHub 저장소 Import
2. **Environment Variables** (Settings):

| 이름 | 값 |
|------|-----|
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 카카오 JavaScript 키 |
| `DATABASE_URL` | Railway MySQL Connection URL (`?connection_limit=5` 권장) |

3. Railway에서 MySQL **Public Network** → Connection URL 복사
4. 로컬에서 테이블 생성 (한 번만):

```bash
# .env.local 에 Railway URL 넣은 뒤
npm run db:push:cloud
```

5. [카카오 개발자 콘솔](https://developers.kakao.com/) Web 플랫폼에 Vercel URL 등록
6. Deploy / Redeploy

## 이번에 반영된 주요 변경

- 리뷰: MySQL(Railway) + Prisma 연동
- 식당 데이터 3차 추가 (`data/restaurants.json`)
- 가게 클릭 시 전체 메뉴 표시
- 오늘의 사료 룰렛 레이아웃
- 지도 첫 화면: 공주대학로 56 기준
- SiteBanner hydration 수정

## 로컬 확인

```bash
npm install
copy .env.example .env.local
# .env.local 에 카카오 키, DATABASE_URL 입력
npm run build
npm start
```

## 문의

공주대학교 지리학과 임승연, 김혜린 · 캡스톤 디자인 프로젝트
