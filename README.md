# Promptly – AI Prompt Refiner
made by SbEnChOi X --> Antigravity (goat) with gemini 3 pro planning
##  프로젝트 소개
Promptly는 **Electron** 기반의 투명 오버레이 위젯으로, 데스크톱 어디서든 AI 모델(Gemini, Claude 등)의 프롬프트를 바로 개선할 수 있게 해줍니다. PowerShell UI Automation을 이용해 텍스트 입력 필드를 자동으로 감지하고, 감지되지 않을 경우 수동 입력 사이드바를 제공합니다.

##  주요 기능
- **호버 활성화 메뉴**: 위젯에 마우스를 1초 올리면 **종료(Power)** 버튼과 **수동 입력(Manual Input)** 버튼이 슬라이드‑아웃됩니다.
- **원형 로딩 애니메이션**: 호버 대기 시간 동안 위젯 테두리를 따라 회전하는 로딩 원이 표시됩니다.
- **자동 텍스트 감지**: ChatGPT, Claude 등 웹·데스크톱 버전의 입력창을 UI Automation으로 탐지합니다.
- **수동 입력 모드**: UI Automation이 동작하지 않을 때 사이드바에 텍스트를 직접 입력할 수 있습니다.
- **Google Gemini API 키 내장**: 별도 설정 없이 바로 동작 (키 사용량은 공유 시 주의 필요).
- **포터블 Windows 빌드** (`electron-packager --no-asar`) 로 `Promptly.exe` 하나만 배포 가능합니다.

##  개발 환경 설정 및 실행 방법
```bash
# 1. 레포지토리 복제 (이미 복제했으면 이 단계 건너뛰기)
git clone https://github.com/SbEnChOi/Promptly.git
cd Promptly

# 2. 의존성 설치
npm install

# 3. 개발 모드 실행 (핫 리로드 지원)
npm run electron:dev
```
- 위 명령을 실행하면 `http://localhost:5173` 에 Vite 개발 서버가 띄워지고, Electron 창이 자동으로 열립니다.
- 위젯을 화면에 띄운 뒤 마우스를 올려 1초 기다리면 메뉴가 나타나는 것을 확인할 수 있습니다.

##  빌드 및 배포
```bash
# 1. 프론트엔드 빌드 (production) 
npm run build

# 2. Windows (x64)용 패키징
npx -y electron-packager . Promptly --platform=win32 --arch=x64 --out=release --overwrite --no-asar
```
- 빌드가 성공하면 `release/Promptly-win32-x64` 폴더 안에 `Promptly.exe` 가 생성됩니다.
- 해당 폴더를 **ZIP** 으로 압축하고 친구에게 전달하면 바로 실행할 수 있습니다. (압축 방법은 `DISTRIBUTION_GUIDE.md` 참고)

##  개발 중 겪었던 어려움
- **UI Automation 제한**: Electron 기반 웹뷰는 `TextPattern`을 제공하지 않아 텍스트와 커서 위치를 직접 읽을 수 없었습니다. 이를 보완하기 위해 수동 입력 사이드바를 추가했습니다.
- **패키징 문제**: `electron-builder` 로는 여러 차례 빌드 오류가 발생했으며, `electron-packager` 로 전환하고 `--no-asar` 옵션을 사용해 PowerShell 스크립트가 정상적으로 포함되도록 해결했습니다.
- **로딩 애니메이션 제어**: 메뉴가 열릴 때 로딩 원이 역방향으로 회전하는 현상을 방지하기 위해 로딩 원을 `isLoading && !isExpanded` 조건으로 렌더링하고, `stroke-dashoffset` 전환을 제어했습니다.
- **GitHub 인증**: Personal Access Token 없이도 푸시할 수 있도록 SSH 키와 GitHub CLI 두 가지 방법을 제공했습니다.

##  앞으로의 개선 방향
- **Electron 앱 전용 텍스트 추출**: 프리로드 스크립트와 IPC를 활용해 웹뷰 내부 텍스트를 직접 가져오는 방안 연구.
- **API 키 관리**: 환경 변수 또는 안전한 저장소(예: keytar)로 전환해 사용자별 API 키를 별도 설정하도록 개선.
- **다중 플랫폼 지원**: macOS·Linux용 빌드 스크립트 추가.
- **UI/UX 다듬기**: 다크 모드, 색상 테마, 호버 지연 시간 사용자 설정 등.

## 라이선스
따윈 없음