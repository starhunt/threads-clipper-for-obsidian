# Threads to Obsidian

**[English](README.md)**

[Threads](https://www.threads.net) 게시글을 [Obsidian](https://obsidian.md)에 구조화된 마크다운 노트로 자동 저장하는 Chrome 확장 프로그램입니다.

## 기능

- **좋아요/저장 시 자동 저장** — 좋아요 또는 북마크하는 순간 게시글이 캡처됩니다
- **마크다운 변환** — YAML frontmatter가 포함된 Obsidian 호환 마크다운으로 변환
- **이미지 다운로드** — 첨부 이미지를 볼트에 로컬 저장 (선택)
- **AI 변환** — AI를 활용하여 게시글을 요약/분석/재구성 (선택)
- **동적 폴더 경로** — 연/월 기반 자동 폴더 분류
- **토픽/태그 추출** — 주제와 해시태그 자동 감지
- **다양한 게시글 지원** — 단일 게시글, 스레드, 리포스트, 인용, 캐러셀

## 사전 필수 사항

> **이 확장 프로그램은 Obsidian Local REST API 플러그인이 필수입니다. 이 플러그인 없이는 확장 프로그램이 볼트와 통신할 수 없습니다.**

### 1단계: Obsidian Local REST API 플러그인 설치

1. Obsidian을 실행합니다
2. **설정** > **커뮤니티 플러그인**으로 이동합니다
3. **제한 모드**가 켜져 있다면 해제합니다 (커뮤니티 플러그인을 사용하려면 필요)
4. **찾아보기**를 클릭하고 **"Local REST API"**를 검색합니다
5. **설치**를 클릭한 후 **활성화**합니다

### 2단계: 플러그인 설정

1. Obsidian에서 **설정** > **커뮤니티 플러그인** > **Local REST API**로 이동합니다
2. **포트 번호**를 확인합니다 (기본값: `27123`)
3. (권장) 인증을 위한 **API Key**를 설정합니다
4. **HTTPS** 옵션이 원하는 설정과 일치하는지 확인합니다:
   - `HTTP` (기본값) — 로컬 사용 시 별도 설정 없이 작동
   - `HTTPS` — 활성화 시, 브라우저에서 `https://localhost:27123`에 한 번 접속하여 자체 서명 인증서를 수락해야 할 수 있습니다

### 3단계: API 작동 확인

브라우저에서 다음 주소에 접속합니다:

```
http://localhost:27123
```

JSON 응답 또는 API 문서 페이지가 표시되면 플러그인이 정상적으로 실행되고 있는 것입니다. API Key를 설정한 경우 인증을 요구할 수 있습니다.

> **중요**: 확장 프로그램이 노트를 저장하려면 Obsidian이 실행 중이고 Local REST API 플러그인이 활성화되어 있어야 합니다.

## 설치

### Chrome 웹 스토어

*(출시 예정)*

### 수동 설치 (개발자 모드)

1. 이 저장소를 다운로드하거나 클론합니다
2. Chrome에서 `chrome://extensions`에 접속합니다
3. 우측 상단 **개발자 모드**를 활성화합니다
4. **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 이 폴더를 선택합니다
5. 툴바에 확장 프로그램 아이콘이 나타납니다

## 설정

1. 확장 프로그램 아이콘 클릭 > **설정**
2. Local REST API 연결 정보를 입력합니다:
   - 프로토콜: `HTTP` 또는 `HTTPS`
   - 호스트: `localhost` (기본값)
   - 포트: `27123` (기본값)
   - API Key (플러그인에서 설정한 경우)
3. **연결 테스트**를 클릭하여 확인합니다
4. 저장 경로 및 옵션을 설정합니다
5. (선택) AI 변환을 활성화하고 AI 제공자를 설정합니다

## 사용법

1. [threads.net](https://www.threads.net)에 접속합니다
2. 저장하고 싶은 게시글의 **좋아요** 또는 **저장** 버튼을 클릭합니다
3. Obsidian 볼트에 자동으로 저장됩니다

> **참고**: 첫 활성화 클릭만 저장을 트리거합니다. 좋아요/저장 **취소** 시에는 저장되지 않습니다.

## AI 변환 (선택)

활성화하면 AI가 게시글을 분석하여 구조화된 노트를 생성합니다:

- **핵심 요약** — 핵심 메시지 한 문장 + 주요 포인트 3개
- **주요 개념** — 추출된 용어를 테이블로 정리
- **상세 노트** — 맥락이 포함된 심화 분석
- **실행 아이템** — 실행 가능한 체크리스트
- **쉬운 설명** — Feynman 기법으로 이해하기 쉽게 설명

### 지원 AI 제공자

| 제공자 | 기본 모델 | 비고 |
|--------|-----------|------|
| OpenAI | gpt-4o | |
| Google Gemini | gemini-2.0-flash | |
| Anthropic | claude-3-5-sonnet | |
| Grok (xAI) | grok-3 | |
| zai | GLM-4.5 | 커스텀 엔드포인트 |
| Custom | — | OpenAI 호환 API |

- 제공자별 API Key, 모델, 엔드포인트 개별 설정
- 제공자별 **연결 테스트** 버튼
- 커스텀 프롬프트 템플릿 지원

## 설정 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| 트리거 (좋아요) | 좋아요 클릭 시 저장 | 켜짐 |
| 트리거 (저장) | 저장 클릭 시 저장 | 켜짐 |
| 노트 폴더 | 볼트 내 저장 경로 | `Threads` |
| 연/월 폴더 | 하위 폴더 자동 생성 (예: `Threads/2026/03`) | 꺼짐 |
| 이미지 저장 | 이미지 로컬 저장 | 꺼짐 |
| 이미지 폴더 모드 | 중앙 집중 / 노트별 하위 폴더 | 중앙 집중 |
| AI 변환 | AI 기반 콘텐츠 변환 | 꺼짐 |

## 저장 형식

### 기본 형식

```markdown
---
source: threads
type: single
author: "@username"
post_url: "https://threads.net/..."
saved_at: "2026. 03. 23. 14:30"
tags:
  - threads
---

# @username의 게시글

> 게시글 내용

---
*원본 링크: [Threads에서 보기](https://threads.net/...)*
```

### AI 변환 형식

```markdown
---
source: threads
type: single
author: "@username"
topic: "주제명"
post_url: "https://threads.net/..."
saved_at: "2026. 03. 23. 14:30"
tags:
  - threads
  - 주제
---

## 1. 핵심 요약 (Executive Summary)
...

## 2. 주요 개념 (Key Concepts)
| 개념/용어 | 설명 | 맥락 |
...

## 3. 상세 노트 (Detailed Notes)
...

## 4. 실행 아이템 (Action Items)
- [ ] ...

## 5. 쉬운 설명 (Feynman Explanation)
...

## 6. 원문
> ...
```

## 프로젝트 구조

```
sns_to_obsidian/
├── manifest.json              # 확장 프로그램 매니페스트 (MV3)
├── background/
│   ├── service-worker.js      # 백그라운드 서비스 워커
│   └── ai-service.js          # AI API 호출 모듈
├── content/
│   ├── content.js             # 콘텐츠 스크립트 (DOM 감지/추출)
│   └── styles.css             # 토스트 알림 스타일
├── popup/
│   ├── popup.html / js / css  # 팝업 UI
├── options/
│   ├── options.html / js / css # 설정 페이지
└── assets/icons/              # 확장 프로그램 아이콘 (PNG + SVG)
```

## 개인정보

- 모든 데이터는 Chrome 로컬 스토리지에만 저장됩니다
- API 키는 브라우저에만 저장되며, 설정된 AI 제공자 외에는 어떤 서버로도 전송되지 않습니다
- 분석, 추적, 데이터 수집이 없습니다
- 확장 프로그램은 `threads.net` / `threads.com`에서만 동작합니다

## 라이선스

MIT License
