#!/bin/bash
# 双击即可启动「每日诗词浮窗」。可拖到程序坞或设为登录启动。
cd "$(dirname "$0")"
nohup ./node_modules/.bin/electron . >/dev/null 2>&1 &
sleep 1
exit 0
