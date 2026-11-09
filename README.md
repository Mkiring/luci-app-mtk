# LuCI App for MediaTek WiFi (luci-app-mtk)

LuCI controller and configuration interface for MediaTek proprietary WiFi drivers.

## Supported Drivers

### Old Driver (RT2860/RT3090)
- Interface names: `ra0`, `ra1`, etc.
- Config paths: `/etc/Wireless/MT7628.dat`
- Daemon: `rt2860apd`

### New Driver (MT7628 v4.1.1.0+)
- Interface names: `wlan0`, `wlan1`, etc. (cfg80211)
- Config paths: `/etc/wireless/mt7628/mt7628.dat`
- Daemon: `hostapd`
- Kernel support: Linux 5.4+

## Installation

```bash
# Install on target device
opkg install luci-app-mtk*.ipk

# Or include in firmware build
make menuconfig
# Navigate to: LuCI -> Applications -> <*> luci-app-mtk
make defconfig
make
```

## Configuration

After installation, access the web interface at:
```
http://<router-ip>/cgi-bin/luci/admin/mtk/wifi
```

## Compatibility Notes

This app automatically detects which driver is active and adjusts accordingly:
- Interface names are normalized (`ra0` ↔ `wlan0`)
- Config file paths are auto-detected
- Daemon management adapts to driver type

## Files

| File | Description |
|------|-------------|
| `root/usr/lib/lua/mtkwifi.lua` | Core WiFi management library |
| `root/usr/lib/lua/l1dat_parser.lua` | L1 profile parser (old driver) |
| `luasrc/controller/mtkwifi.lua` | LuCI web interface controller |
| `luasrc/view/admin_mtk/*.htm` | Web UI templates |
| `src/ioctl_helper.c` | ioctl helper for Lua |

## Troubleshooting

### No WiFi devices detected
```bash
# Check if driver is loaded
lsmod | grep mt7628

# Check interface names
ls /sys/class/net/ | grep -E "ra|wlan"

# Check config files exist
ls -la /etc/wireless/mt7628/
```

### Config not saving
```bash
# Ensure write permissions
chmod 644 /etc/wireless/mt7628/mt7628.dat

# Check Lua syntax
lua -e "loadfile('/usr/lib/lua/mtkwifi.lua')()"
```

### Web UI shows errors
```bash
# Check logs
logread | grep -i mtk

# Test Lua parsing
lua -e "require('mtkwifi'); print('OK')"
```

## Git Repository

- Source: https://github.com/Mkiring/luci-app-mtk
- Compatible with OpenWrt 21.02 and later

## License

GPL-2.0
