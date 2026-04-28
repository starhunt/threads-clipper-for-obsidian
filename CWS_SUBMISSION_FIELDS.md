# Chrome Web Store Submission Fields — Threads Clipper for Obsidian

## URLs
- Privacy Policy URL:
  `https://starhunt.github.io/infographic/privacy-policy.html`
- Source repository:
  `https://github.com/starhunt/sns_to_obsidian`

## Upload file
- ZIP:
  `/Users/starhunter/StudyProj/chrome_extension/threads-clipper-for-obsidian/release/threads-clipper-for-obsidian-cws-v1.1.0.zip`

## Store listing

### Default language
- Korean

### Extension name
- Threads Clipper for Obsidian

### Category
- Productivity

### Short description (KO)
- 좋아요 또는 저장한 Threads 게시글을 플러그인 없이 Obsidian으로 바로 보냅니다.

### Detailed description (KO)
Threads Clipper for Obsidian은 Threads에서 **좋아요** 또는 **저장(북마크)** 한 게시글을 Obsidian으로 빠르게 보내는 크롬 확장 프로그램입니다.

이번 출시판은 가장 간단한 사용성을 목표로 **Obsidian URI** 방식만 사용합니다. 별도의 Local REST API 플러그인 설치 없이, 좋아요나 저장만으로 노트를 생성할 수 있습니다.

#### 핵심 기능
- 좋아요 시 자동 저장
- 저장(북마크) 시 자동 저장
- Obsidian URI를 통한 직접 노트 생성
- 플러그인 설치 불필요
- 연/월 폴더 자동 정리
- 팝업에서 저장 통계와 빠른 토글 확인

#### 저장되는 정보
- 작성자 핸들 / 표시 이름
- 게시글 URL
- 게시 시각
- 본문 텍스트
- 감지 가능한 스레드 연속 글
- 인용 / 리포스트 구조
- 미디어 링크

#### 이 버전에서 제외한 것
- AI 변환 기능 없음
- 외부 AI 서비스 연동 없음
- Local REST API 설정 없음
- 로컬 미디어 파일 다운로드 없음
- 원격 백엔드 없음
- 분석 / 추적 / 광고 SDK 없음

#### 사용 전 준비
이 확장 프로그램을 사용하려면:
1. Obsidian이 설치되어 있어야 합니다
2. Obsidian이 기본 URI 핸들러로 동작해야 합니다
3. 사용 중에는 Obsidian이 실행 중이면 더 자연스럽게 노트가 생성됩니다

#### 개인정보 관련 안내
- 설정은 브라우저 확장 저장소에 저장됩니다
- API Key나 플러그인 설정이 필요 없습니다
- 데이터는 원격 개발자 서버로 전송되지 않습니다
- AI 서버나 광고 네트워크로도 전송되지 않습니다

## Optional English listing

### Short description (EN)
- Send liked or bookmarked Threads posts straight to Obsidian with no plugin setup.

### Detailed description (EN)
Threads Clipper for Obsidian is a Chrome extension that quickly sends Threads posts to Obsidian when you **like** or **bookmark** them.

This release is intentionally optimized for the simplest setup possible by using **Obsidian URI** only. No Local REST API plugin is required.

#### Core features
- Save automatically on Like
- Save automatically on Bookmark
- Create notes directly through Obsidian URI
- No plugin setup required
- Optional year/month folder organization
- Check save stats and quick toggles from the popup

#### What gets saved
- Author handle and display name
- Post URL
- Post timestamp
- Main post text
- Detected thread continuation posts
- Quote / repost structure when available
- Media links

#### What is intentionally not included in this release
- No AI transformation
- No external AI provider integration
- No Local REST API setup
- No local media file download into the vault
- No remote backend
- No analytics, tracking, or ad SDKs

## Data disclosure guidance

### Single purpose
- Yes: saves user-triggered Threads posts into Obsidian.

### Data handled
- Website content (Threads post content selected by user action)
- User activity (Like / Bookmark as save trigger)
- User-provided settings (vault name, note path preferences)

### Data not handled
- No financial info
- No health info
- No authentication credentials
- No personally sold data
- No precise location

### Data usage
- App functionality only
- No analytics
- No advertising
- No personalization outside the feature itself

### Data transfer
- Data is not sent to remote developer servers.
- Data is passed locally to Obsidian through the `obsidian://` URI flow.

## Screenshot plan
1. Saved note result in Obsidian
2. Settings page
3. Popup quick control
4. Real Threads capture with save success toast (recommended)
