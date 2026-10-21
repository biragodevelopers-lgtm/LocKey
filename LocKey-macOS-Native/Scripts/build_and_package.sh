#!/bin/bash

# Script completo per compilare LocKey ed esportare l'installer .DMG
# Esegue la compilazione nativa Swift, genera il bundle .app, firma ad-hoc con entitlements e genera il DMG.

set -euo pipefail

APP_NAME="LocKey"
BUILD_DIR="./Build"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"

echo "=================================================="
echo "      Compilazione e Pacchettizzazione LocKey      "
echo "=================================================="

# 1. Pulisce la cartella Build precedente
mkdir -p "${BUILD_DIR}"
rm -rf "${APP_BUNDLE}"

# 2. Crea la struttura delle cartelle del bundle macOS .app
echo "➡️  [1/4] Creazione della struttura del bundle .app..."
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# Genera il file Info.plist del bundle
cat <<EOF > "${APP_BUNDLE}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>it.biragodev.lockey</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.4</string>
    <key>CFBundleVersion</key>
    <string>4</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>CFBundleDevelopmentRegion</key>
    <string>it</string>
    <key>CFBundleLocalizations</key>
    <array>
        <string>it</string>
        <string>en</string>
    </array>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 BiragoDev (www.biragodev.it). Tutti i diritti riservati.</string>
    <key>NSFaceIDUsageDescription</key>
    <string>LocKey richiede l'uso dell'autenticazione biometrica per sbloccare in sicurezza le tue credenziali nel Vault.</string>
</dict>
</plist>
EOF

# Genera l'icona dell'applicazione se esiste l'immagine base
ICON_BASE="./Resources/app_icon_base.png"
ICONSET_DIR="/tmp/LocKey_$$.iconset"
ICNS_FILE="./Resources/AppIcon.icns"

if [ -f "${ICNS_FILE}" ]; then
    echo "➡️  [1.5] Copia del file icone .icns esistente..."
    cp "${ICNS_FILE}" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns"
elif [ -f "${ICON_BASE}" ]; then
    echo "➡️  [1.5] Generazione del file icone .icns..."
    rm -rf "${ICONSET_DIR}"
    mkdir -p "${ICONSET_DIR}"
    
    # Ridimensiona l'immagine per tutti i formati richiesti da macOS tramite sips, forzando il formato PNG
    sips -s format png -z 16 16     "${ICON_BASE}" --out "${ICONSET_DIR}/icon_16x16.png" > /dev/null
    sips -s format png -z 32 32     "${ICON_BASE}" --out "${ICONSET_DIR}/icon_16x16@2x.png" > /dev/null
    sips -s format png -z 32 32     "${ICON_BASE}" --out "${ICONSET_DIR}/icon_32x32.png" > /dev/null
    sips -s format png -z 64 64     "${ICON_BASE}" --out "${ICONSET_DIR}/icon_32x32@2x.png" > /dev/null
    sips -s format png -z 128 128   "${ICON_BASE}" --out "${ICONSET_DIR}/icon_128x128.png" > /dev/null
    sips -s format png -z 256 256   "${ICON_BASE}" --out "${ICONSET_DIR}/icon_128x128@2x.png" > /dev/null
    sips -s format png -z 256 256   "${ICON_BASE}" --out "${ICONSET_DIR}/icon_256x256.png" > /dev/null
    sips -s format png -z 512 512   "${ICON_BASE}" --out "${ICONSET_DIR}/icon_256x256@2x.png" > /dev/null
    sips -s format png -z 512 512   "${ICON_BASE}" --out "${ICONSET_DIR}/icon_512x512.png" > /dev/null
    sips -s format png -z 1024 1024 "${ICON_BASE}" --out "${ICONSET_DIR}/icon_512x512@2x.png" > /dev/null
    
    # Compila l'iconset in un file .icns finale
    iconutil -c icns "${ICONSET_DIR}" -o "${ICNS_FILE}"
    rm -rf "${ICONSET_DIR}"
    
    # Copia l'icona all'interno delle risorse dell'app bundle
    cp "${ICNS_FILE}" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns"
else
    echo "⚠️  Avviso: Immagine base dell'icona non trovata in '${ICON_BASE}'."
fi

# 3. Compila l'applicazione tramite il compilatore Swift (swiftc)
echo "➡️  [2/4] Compilazione dei file sorgenti Swift (Universal Binary: arm64 + x86_64)..."
if [ -d "/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk" ]; then
    SDK_PATH="/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk"
else
    SDK_PATH=$(xcrun --show-sdk-path --sdk macosx)
fi

SOURCES=(
    Sources/Models/Models.swift
    Sources/Cryptography/CryptoManager.swift
    Sources/Cryptography/BiometricAuthenticator.swift
    Sources/Storage/VaultStore.swift
    Sources/Storage/ClipboardManager.swift
    Sources/Storage/HotKeyManager.swift
    Sources/Views/MainSplitView.swift
    Sources/Views/CredentialRowView.swift
    Sources/Views/LockScreenView.swift
    Sources/App/LocKeyApp.swift
)

ARM64_BIN="${BUILD_DIR}/${APP_NAME}_arm64"
X86_BIN="${BUILD_DIR}/${APP_NAME}_x86_64"
FINAL_BIN="${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# Compilazione per Apple Silicon (arm64)
echo "   Compilazione target arm64 (Apple Silicon)..."
swiftc -sdk "${SDK_PATH}" -target "arm64-apple-macosx13.0" -parse-as-library "${SOURCES[@]}" -o "${ARM64_BIN}" || true

# Compilazione per Intel (x86_64)
echo "   Compilazione target x86_64 (Intel)..."
swiftc -sdk "${SDK_PATH}" -target "x86_64-apple-macosx13.0" -parse-as-library "${SOURCES[@]}" -o "${X86_BIN}" || true

# Unione in Universal Binary con lipo
if [ -f "${ARM64_BIN}" ] && [ -f "${X86_BIN}" ]; then
    echo "   Creazione Universal Binary con lipo..."
    lipo -create -output "${FINAL_BIN}" "${ARM64_BIN}" "${X86_BIN}"
    rm -f "${ARM64_BIN}" "${X86_BIN}"
elif [ -f "${ARM64_BIN}" ]; then
    echo "   Utilizzo binario arm64..."
    mv "${ARM64_BIN}" "${FINAL_BIN}"
elif [ -f "${X86_BIN}" ]; then
    echo "   Utilizzo binario x86_64..."
    mv "${X86_BIN}" "${FINAL_BIN}"
else
    echo "❌ Errore durante la compilazione dei binari."
    exit 1
fi

# 4. Applica la firma digitale ad-hoc
echo "➡️  [3/4] Esecuzione codesign (firma ad-hoc)..."
codesign --force --sign - --deep "${APP_BUNDLE}"

# 5. Genera il file .dmg finale usando il nostro script
echo "➡️  [4/4] Avvio della generazione dell'immagine disco DMG..."
./Scripts/create_dmg.sh

echo "=================================================="
echo "🎉 OPERAZIONE COMPLETATA! Il DMG è pronto in: ./LocKey.dmg"
echo "=================================================="
