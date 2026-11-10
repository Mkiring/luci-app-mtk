# LuCI App for MediaTek WiFi (luci-app-mtk)

LuCI controller and configuration interface for the MediaTek MT7628
proprietary WiFi AP driver (`mt7628.ko`, WEXT based, ra0).

- Interface names: `ra0` (main AP), `ra1`... (MBSSID), `apcli0` (STA/repeater)
- Profile: `/etc/wireless/mt7628/mt7628.dat` (edited directly, uci is bypassed)
- Factory reset template: `/usr/share/mt7628/mt7628.dat`
- WiFi control: `/sbin/wifi-mtk <up|down|restart|reload|reset|status>`
  (the driver re-reads the profile on interface down/up)

## Installation

```bash
make package/luci-app-mtk/compile V=s
# needs kmod-mt7628-mtk-ap and a LuCI collection in the image
```

Configuration is written straight to the dat profile and applied via
`wifi-mtk`, not through netifd's `/etc/config/wireless`.

## Files

| File | Description |
|------|-------------|
| `root/usr/lib/lua/mtkwifi.lua` | Core WiFi management library |
| `root/usr/lib/lua/wps_action.lua` | WPS action helper |
| `root/sbin/wifi-mtk` | driver control script (up/down/restart/reset) |
| `luasrc/controller/mtkwifi.lua` | LuCI web interface controller |
| `luasrc/view/admin_mtk/*.htm` | Web UI templates |
| `root/usr/share/mt7628/mt7628.dat` | factory reset profile template |

## Troubleshooting

```bash
# driver loaded?
lsmod | grep mt7628

# interface present?
ls /sys/class/net/ | grep -E '^ra|^apcli'

# profile present?
ls -la /etc/wireless/mt7628/

# apply configuration by hand
wifi-mtk restart
```

## Git Repository

- Source: https://github.com/Mkiring/luci-app-mtk

## License

Apache-2.0 (upstream), see file headers.
