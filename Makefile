# Copyright (C) Hua Shao <nossiac@163.com>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mtk
PKG_VERSION:=1.0
PKG_RELEASE:=4
PKG_MAINTAINER:=Hua Shao <nossiac@163.com>
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=MediaTek Proprietary WiFi Configuration
LUCI_DEPENDS:=+luci-base +luci-compat +wireless-tools

include ../../feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
