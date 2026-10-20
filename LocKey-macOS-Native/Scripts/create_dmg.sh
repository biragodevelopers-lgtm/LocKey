#!/bin/bash

# Script di compilazione e pacchettizzazione in formato .DMG per LocKey
# Utilizza utility native di macOS (hdiutil) senza dipendenze esterne.

set -euo pipefail

APP_NAME="LocKey"
BUILD_DIR="./Build"
DMG_NAME="LocKey.dmg"
VOLUME_NAME="LocKey Installer"
STAGING_DIR="/tmp/tmp_dmg_staging_$$"
TEMP_DMG="/tmp/tmp_stage_$$.dmg"
FINAL_DMG="/tmp/${DMG_NAME}"

echo "=================================================="
echo "      Generazione Pacchetto LocKey .DMG           "
echo "=================================================="

# 1. Verifica che l'app compilata esista
if [ ! -d "${BUILD_DIR}/${APP_NAME}.app" ]; then
    echo "❌ ERRORE: Non è stato trovato il file ${APP_NAME}.app nella cartella '${BUILD_DIR}'."
    echo "Procedura:"
    echo "  1. Compila o Archivia l'app LocKey da Xcode."
    echo "  2. Crea una cartella chiamata 'Build' nella directory del progetto."
    echo "  3. Copia il file 'LocKey.app' all'interno della cartella 'Build'."
    echo "  4. Esegui nuovamente questo script."
    exit 1
fi

# 2. Pulisce eventuali rimasugli temporanei
rm -rf "${STAGING_DIR}" "${TEMP_DMG}" "${FINAL_DMG}"
mkdir -p "${STAGING_DIR}"

echo "➡️  [1/5] Copia dell'applicazione nella directory temporanea di staging..."
cp -R "${BUILD_DIR}/${APP_NAME}.app" "${STAGING_DIR}/"

echo "➡️  [2/5] Creazione del collegamento simbolico alla cartella Applicazioni..."
ln -s /Applications "${STAGING_DIR}/Applications"

echo "➡️  [3/5] Creazione dell'immagine disco temporanea (lettura/scrittura)..."
hdiutil create -srcfolder "${STAGING_DIR}" -volname "${VOLUME_NAME}" -fs HFS+ -format UDRW "${TEMP_DMG}"

echo "➡️  [4/5] Conversione dell'immagine nel formato finale compresso di sola lettura (UDZO)..."
hdiutil convert "${TEMP_DMG}" -format UDZO -o "${FINAL_DMG}"
mv -f "${FINAL_DMG}" "./${DMG_NAME}"

echo "➡️  [5/5] Pulizia dei file temporanei..."
rm -f "${TEMP_DMG}"
rm -rf "${STAGING_DIR}"

echo "=================================================="
echo "✅ OPERAZIONE COMPLETATA CON SUCCESSO!"
echo "Il file di installazione è pronto: ${DMG_NAME}"
echo "=================================================="
