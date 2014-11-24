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
priv-app/com.gsamlabs.bbm.rootcompanion.apk
EOF
}

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
