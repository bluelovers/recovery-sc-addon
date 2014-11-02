#!/sbin/sh
#
# /system/addon.d/77-sco-lazy-addon-script.sh
#
. /tmp/backuptool.functions

list_files() {
cat <<EOF
app/com.estrongs.android.pop.apk
app/com.fiistudio.fiinote.apk
app/com.fiistudio.file2pdf.apk
app/Maps.apk
app/com.iflytek.speechcloud.apk
app/vStudio.Android.Camera360.apk
priv-app/com.eclipsim.gpsstatus2.apk
EOF
#lib/libjni_latinime.so
#lib/libjni_unbundled_latinimegoogle.so
}

case "$1" in
  backup)
    list_files | while read FILE DUMMY; do
      backup_file $S/$FILE
    done
  ;;
  restore)
    list_files | while read FILE REPLACEMENT; do
      R=""
      [ -n "$REPLACEMENT" ] && R="$S/$REPLACEMENT"
      [ -f "$C/$S/$FILE" ] && restore_file $S/$FILE $R
    done
  ;;
  pre-backup)
    # Stub
  ;;
  post-backup)
    # Stub
  ;;
  pre-restore)
    # Remove the stock/AOSP Keyboard
#    rm -f /system/app/LatinIME.apk
#    rm -f /system/lib/libjni_latinimegoogle.so

    # Removing 'Rogue' Keyboard app found in Velocity (and possibly other) ROM's
#    rm -f /system/app/GoogleLatinIme.apk
  ;;
  post-restore)
    # Stub
;;
esac
