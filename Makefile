# Copyright (C) Hua Shao <nossiac@163.com>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mtk
PKG_VERSION:=1.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Hua Shao <nossiac@163.com>
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=MediaTek Proprietary WiFi Configuration
LUCI_DEPENDS:=+luci-base +luci-compat +iw +wireless-tools

define Package/$(PKG_NAME)/config
config PACKAGE_libmapd
	bool "Include MAP daemon library support"
	depends on PACKAGE_$(PKG_NAME)
	default n
endef

include ../../feeds/luci/luci.mk

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR)/src \
		$(TARGET_CONFIGURE_OPTS) \
		CFLAGS="$(TARGET_CFLAGS) -I. -Wall -shared -fPIC" \
		ioctl_helper
	mkdir -p $(PKG_BUILD_DIR)/usr/lib/lua
	cp $(PKG_BUILD_DIR)/src/ioctl_helper.so $(PKG_BUILD_DIR)/usr/lib/lua/
endef

# call BuildPackage - OpenWrt buildroot signature
