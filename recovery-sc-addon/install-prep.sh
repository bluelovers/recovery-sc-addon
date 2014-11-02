#!/sbin/sh
# PA GApps Addon Module Install Preparation Script

# _____________________________________________________________________________________________________________________
#        
addon_type=keyboard;

# Current Keyboard Addon install size (in Kbytes)
addon_size_kb=20068;

# List of files to be deleted or replaced is a function used like a variable
addon_file_list() {
cat <<EOF
/system/addon.d/72-keyboards.sh
/system/app/LatinImeGoogle.apk
/system/app/GoogleLatinIme.apk
/system/lib/libjni_latinime.so
/system/lib/libjni_unbundled_latinimegoogle.so
/system/app/LatinIME.apk
/system/lib/libjni_latinimegoogle.so
/system/app/LatinImeGoogle.odex
EOF
}

# Buffer of extra system space to require for Addon install (10240=10MB)
# This will allow for some ROM size expansion when GApps are restored
buffer_size_kb=10240;

gprop=/tmp/addon.prop;

# Parameters passed from updater-script
device_name="$1";

# declare starting values
reclaimed_addon_space_kb=0;
# _____________________________________________________________________________________________________________________
echo -e "# begin pa gapps addon properties\n# This file contains information needed to flash PA GApps\ngapps_addon_type=$addon_type"  > $gprop;

# Read and save system partition size details (Thanks @JustArchi and @osm0sis for providing script segment)
df=`busybox df -k /system | tail -n 1`;
case $df in
    /dev/block/*) df=$(echo $df | awk '{ print substr($0, index($0,$2)) }');;
esac;
echo $df | awk '{ print "total_system_size_kb=" $1 } { print "used_system_size_kb=" $2 } { print "free_system_size_kb=" $3 }' >> $gprop;

# Perform storage space calculations of files that are to be deleted/replaced
file_size_kb=$(du -ak `addon_file_list` | awk '{ i+=$1 } END { print i }');
reclaimed_addon_space_kb=$((file_size_kb + reclaimed_addon_space_kb));

# Calculate the additional amount of system storage required for installation of GApps and options
free_space_reqd_kb=$((addon_size_kb + buffer_size_kb - reclaimed_addon_space_kb));
if [ "$free_space_reqd_kb" -le "0" ]; then
    free_space_reqd_kb=0;
fi;

echo "free_space_reqd_kb=$free_space_reqd_kb" >> $gprop;
echo "total_addon_size_kb=$addon_size_kb" >> $gprop;
echo "device_name=$device_name" >> $gprop;
echo "# end pa gapps addon properties" >> $gprop;

# Copy addon.prop to the SDCard as 'pa_addon.log'
cp -f $gprop /sdcard/pa_addon.log;
