# 랜덤 조 편성기 (Team Randomizer)

N명의 참가자를 4개 조에 공정하게 랜덤 배분하는 웹 도구입니다.

## 주요 기능

- **조장 고정 배치**: 각 조에 조장을 미리 지정
- **참가자 관리**: 추가/삭제/수정 가능
- **랜덤 배분**: Fisher-Yates 알고리즘으로 공정한 셔플
- **신뢰도 테스트**: 2,000회 시뮬레이션으로 분포 검증
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원

## 사용법

1. 조별 고정 멤버(조장) 입력
2. 일반 참가자 추가/수정
3. "조 편성하기" 클릭
4. (선택) "신뢰도 테스트"로 랜덤 공정성 확인

## 기술 스택

- HTML5, CSS3, Vanilla JavaScript
- Fisher-Yates Shuffle Algorithm
- TDD (Test-Driven Development)

## 개발 원칙

- **Kent Beck의 TDD**: Red-Green-Refactor 사이클
- **Agentic Coding**: AI 에이전트 기반 자율 개발
- **Context7 MCP**: 최신 문서 참조
- **Playwright MCP**: 시각적 검증

## 라이선스

MIT License
