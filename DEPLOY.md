# GitHub 배포 안내

이 폴더(`final`)에는 웹사이트 배포에 **필요한 파일만** 들어 있습니다.  
**마지막 동기화:** 프로젝트 최신 소스 기준으로 갱신되었습니다.

## 포함된 것

- Next.js 소스 (`app/`, `components/`, `lib/`)
- 음식점·리뷰 데이터 (`data/`)
- 배너 이미지 (`public/banner-hero.png`)
- 설정·보안 파일 (`package.json`, `.github/`, `SECURITY.md` 등)
- 환경 변수 예시 (`.env.example`)

## 포함되지 않은 것

- `node_modules/` — 배포 플랫폼에서 `npm install`
- `.next/` — `npm run build` 시 생성
- `.env.local` — **카카오맵 키 (절대 업로드 금지)**

## GitHub에 올리는 방법

1. GitHub에서 새 저장소를 만듭니다.
2. **`final` 폴더 안의 내용 전체**를 저장소 **루트**에 올립니다.  
   (`final` 폴더 이름 자체가 아니라, 안쪽 파일·폴더만 루트에 둡니다.)
3. 터미널 예시 (`final` 폴더에서):

```bash
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

## 사이트 공개 (Vercel 권장)

1. [Vercel](https://vercel.com)에서 GitHub 저장소 Import
2. Environment Variables:
   - `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` = 카카오 JavaScript 키
3. [카카오 개발자 콘솔](https://developers.kakao.com/) Web 플랫폼에 배포 URL 등록
4. Deploy

## 로컬 확인

```bash
npm install
copy .env.example .env.local
# .env.local 에 카카오 키 입력 후
npm run build
npm start
```

## 문의

공주대학교 지리학과 임승연, 김혜린 · 캡스톤 디자인 프로젝트
