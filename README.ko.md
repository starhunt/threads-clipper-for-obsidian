# Threads Clipper for Obsidian

[Threads](https://www.threads.net)에서 **좋아요** 또는 **저장**한 게시글을 [Obsidian](https://obsidian.md)으로 바로 보내는 Chrome 확장 프로그램입니다.

## 이번 출시 범위

이번 버전은 가장 단순한 클리핑 흐름에 집중한 URI 출시판입니다.

포함 기능:
- **좋아요 시 저장**
- **저장(북마크) 시 저장**
- **Obsidian URI**로 노트 생성
- **플러그인 설치 불필요**
- **연/월 폴더 자동 정리**

제외 기능:
- AI 변환
- 외부 AI 프로바이더 연동
- Obsidian Local REST API 의존
- 볼트 내부 미디어 로컬 다운로드
- 분석/추적 기능

## 사전 준비

컴퓨터에 Obsidian만 설치되어 있으면 됩니다.

이 버전은 내장된 **Obsidian URI (`obsidian://new`)** 방식으로 노트를 생성합니다.

## 설치

### Chrome 웹 스토어

출시 예정

### 수동 설치

1. 이 저장소를 다운로드하거나 클론합니다
2. `chrome://extensions`를 엽니다
3. **개발자 모드**를 켭니다
4. **압축해제된 확장 프로그램을 로드합니다**를 클릭합니다
5. 이 폴더를 선택합니다

## 사용 방법

1. `threads.net` 또는 `threads.com`을 엽니다
2. 게시글에 **좋아요** 또는 **저장**을 누릅니다
3. 확장 프로그램이 노트 내용을 클립보드에 준비하고 Obsidian을 열어 노트를 생성합니다

## 저장되는 내용

- 작성자 핸들 / 표시 이름
- 게시글 URL
- 게시 시각
- 본문 텍스트
- 감지 가능한 스레드 연속 글
- 인용 / 리포스트 구조
- 미디어 링크

## URI 모드 참고 사항

- 커뮤니티 플러그인이 필요 없습니다
- 노트 본문은 클립보드를 통해 Obsidian으로 전달됩니다
- 이번 출시판에서는 이미지를 로컬 파일로 저장하지 않고 링크로 남깁니다
- 볼트 이름을 입력하면 저장 후 해당 노트를 다시 열기 쉬워집니다

## 기본 노트 형식

```markdown
---
source: threads
type: single
author: "@username"
author_name: "표시 이름"
post_url: "https://www.threads.net/@username/post/..."
saved_at: "2026. 04. 28. 15:00"
post_date: "2026. 04. 28. 14:55"
tags:
  - threads
---

# @username의 게시글

## 📋 게시글 정보
...

## 📝 본문
> 원문 내용
```

## 개인정보

- 설정은 Chrome storage에 저장됩니다
- 이 출시판에서는 API Key나 Local REST API 설정이 필요 없습니다
- 분석, 텔레메트리, 광고, 제3자 추적이 없습니다
- 네트워크 요청은 Threads 도메인과 Threads 미디어 CDN으로 제한됩니다

## 패키징

```bash
./scripts/package-cws.sh
```

출력:
- `release/threads-clipper-for-obsidian-cws-v<version>.zip`

## 아키텍처

`spec/architecture.md`를 참고하세요.

## 라이선스

MIT License
