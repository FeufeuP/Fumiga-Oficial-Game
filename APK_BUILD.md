# FUMIGA — APK Android

O projeto está preparado para empacotamento Capacitor com `appId` `com.fumiga.project`, `android:screenOrientation="landscape"` e viewport responsivo em paisagem.

## Fluxo automático de atualização grande

Executar:

```bash
pnpm build-apk
```

O script valida TypeScript, gera `dist/public`, sincroniza Capacitor e executa `android/gradlew assembleDebug`. O artefato esperado é:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Estado desta sessão

A estrutura Android foi criada e a orientação landscape foi fixada no manifesto. A compilação chegou ao Gradle, mas a sessão não possui uma plataforma Android SDK moderna instalada; o erro atual é `SDK location/platform not found`. O preview web foi validado, porém não vou alegar que um `.apk` foi produzido quando o binário não foi gerado.

Quando o SDK Android estiver disponível, o mesmo comando produzirá o APK debug automaticamente após cada grande atualização.
