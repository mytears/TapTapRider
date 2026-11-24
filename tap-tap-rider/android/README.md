# Android 테스트 APK

현재 `../dist` 게임을 앱에 포함합니다. 일반 배달은 오프라인으로 실행할 수 있으며 보상형 광고는 인터넷 연결이 필요합니다. 가로 전체 화면을 사용하며 진행 상태는 앱의 WebView 저장소에 자동 저장됩니다. 웹 브라우저 기록과 별도로 시작합니다.

Android 8.0 이상, 최신 Android System WebView 또는 Chrome을 권장합니다.

## 빌드

JDK 17 이상과 Android SDK 35가 필요합니다. SDK 경로를 `ANDROID_HOME` 또는 이 폴더의 `local.properties`에 지정한 뒤 실행합니다.

```powershell
.\gradlew.bat assembleDebug lintDebug
```

생성 파일은 `build/outputs/apk/debug/TapTapRider-debug.apk`입니다. 개발용 키로 서명한 테스트 빌드이며 앱 ID는 `com.mytears.taptaprider.test`입니다. 다음 테스트 버전도 같은 개발용 키를 사용하면 설치한 앱 위에 업데이트할 수 있습니다.

휴대폰으로 APK를 복사해서 열고, 설치에 사용하는 파일 앱의 알 수 없는 앱 설치를 허용하면 설치할 수 있습니다. 앱을 삭제하면 앱에 저장된 게임 기록도 삭제됩니다.

## 특별 콜 광고

현재 Google 공식 테스트 앱 ID와 보상형 광고 단위 ID를 사용합니다. 테스트 광고는 수익을 발생시키지 않습니다. `RewardedAdsController`는 앱 내 게임 origin의 메인 프레임에서만 요청을 받고, SDK의 보상 콜백을 받은 경우에만 콜 해금 결과를 돌려줍니다. 광고 조기 종료, 로드 실패, 표시 실패, 타임아웃은 보상으로 처리하지 않습니다.

실제 광고 배포 전에는 AndroidManifest.xml의 AdMob 앱 ID와 RewardedAdsController.java의 광고 단위 ID를 소유한 AdMob ID로 교체하고, 배포 대상에 맞는 동의 수집 및 스토어 개인정보 설정을 완료해야 합니다. 현재 웹 미리보기의 5초 시청은 보상 흐름을 확인하는 테스트입니다.
