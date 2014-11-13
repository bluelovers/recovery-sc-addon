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
bin/app_process
EOF
}

case "$1" in
	backup)
		list_files | while read FILE DUMMY; do
			if [ -f "$S/$FILE.orig" && -f "$S/$FILE" ]
			then
				backup_file $S/$FILE.orig
				backup_file $S/$FILE
			fi
		done
	;;
	restore)
		list_files | while read FILE REPLACEMENT; do
#			if [ -f "$C/$S/$FILE.orig" && -f "$C/$S/$FILE" ]
#			if [ -f "/data/data/de.robv.android.xposed.installer/$FILE" && -f "$S/$FILE" ]
			if [ -f "$C/$S/$FILE.orig" ]
			then
				cp -a "$S/$FILE" "$S/$FILE.orig"
				R=""
				[ -n "$REPLACEMENT" ] && R="$S/$REPLACEMENT"
				[ -f "$C/$S/$FILE" ] && restore_file $S/$FILE $R
#				cp /data/data/de.robv.android.xposed.installer/$FILE $S/$FILE
			fi
		done
	;;
	pre-backup)
		# Stub
		list_files | while read FILE DUMMY; do
			if [ -f "$S/$FILE.orig" && -f "$S/$FILE" ]
			then
				backup_file $S/$FILE.orig
				backup_file $S/$FILE
			fi
		done
	;;
	post-backup)
		# Stub
	;;
	pre-restore)
		# Remove the stock/AOSP Keyboard
#		rm -f /system/app/LatinIME.apk
#		rm -f /system/lib/libjni_latinimegoogle.so

		# Removing 'Rogue' Keyboard app found in Velocity (and possibly other) ROM's
#		rm -f /system/app/GoogleLatinIme.apk
	;;
	post-restore)
		# Stub
;;
esac
