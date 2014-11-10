#!/sbin/sh
#
# /system/addon.d/77-sco-lazy-addon-script.sh
#

#	export C=/tmp/backupdir
#	export S=/system
#	export V=9
#	https://github.com/ngiordano/cm_vendor/blob/master/prebuilt/common/bin/backuptool.functions
. /tmp/backuptool.functions

list_files() {
cat <<EOF
app/com.estrongs.android.pop.apk
app/com.fiistudio.fiinote.apk
app/com.fiistudio.file2pdf.apk
app/Maps.apk
priv-app/com.eclipsim.gpsstatus2.apk
app/com.google.android.apps.inputmethod.zhuyin.apk
priv-app/com.forpda.lp.apk
priv-app/com.oasisfeng.greenify.apk
app/org.mozilla.firefox_beta.apk
app/com.coolapk.market.apk
priv-app/de.robv.android.xposed.installer.apk
EOF
#app/com.iflytek.speechcloud.apk
#app/vStudio.Android.Camera360.apk
#lib/libjni_latinime.so
#lib/libjni_unbundled_latinimegoogle.so
}

#list_files_data() {
#cat <<EOF
#data/com.eclipsim.gpsstatus2/shared_prefs/com.eclipsim.gpsstatus2_preferences.xml
#data/com.google.android.apps.maps/shared_prefs/settings_preference.xml
#data/com.google.android.apps.maps/files/OfflineMapArea_1
#EOF
#}

case "$1" in
  backup)
    list_files | while read FILE DUMMY; do
      backup_file $S/$FILE
    done

#    list_files_data | while read FILE DUMMY; do
#      backup_file $S/$FILE
#    done
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
