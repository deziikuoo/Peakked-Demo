Install ADB (PowerShell as Admin, any folder):
winget install --id Google.PlatformTools -e
Close and reopen terminal, then test:
adb --versionadb devices
If adb is still not found, run it by full path:
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" --version& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
Once adb works, do USB reverse + Expo localhost:
adb reverse tcp:8081 tcp:8081adb reverse tcp:19000 tcp:19000adb reverse tcp:19001 tcp:19001cd "C:\Users\dawan\OneDrive\Documents\Coding Files\NEXA Mobile\nexa-mobile"npx expo start --clear --localhost
