# Android 테스트 APK

현재 `../dist` 게임을 앱에 포함해 오프라인으로 실행합니다. 가로 전체 화면을 사용하며 진행 상태는 앱의 WebView 저장소에 자동 저장됩니다. 웹 브라우저 기록과 별도로 시작합니다.

Android 8.0 이상, 최신 Android System WebView 또는 Chrome을 권장합니다.

## 빌드

JDK 17 이상과 Android SDK 35가 필요합니다. SDK 경로를 `ANDROID_HOME` 또는 이 폴더의 `local.properties`에 지정한 뒤 실행합니다.

```powershell
.\gradlew.bat assembleDebug lintDebug
```

생성 파일은 `build/outputs/apk/debug/TapTapRider-debug.apk`입니다. 개발용 키로 서명한 테스트 빌드이며 앱 ID는 `com.mytears.taptaprider.test`입니다. 다음 테스트 버전도 같은 개발용 키를 사용하면 설치한 앱 위에 업데이트할 수 있습니다.

휴대폰으로 APK를 복사해서 열고, 설치에 사용하는 파일 앱의 알 수 없는 앱 설치를 허용하면 설치할 수 있습니다. 앱을 삭제하면 앱에 저장된 게임 기록도 삭제됩니다.
