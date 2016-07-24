#!/bin/sh
sudo echo 1 > /proc/sys/kernel/sysrq
#sync, unmount, and shutdown (still not completely safe because processes running)
sudo echo s > /proc/sysrq-trigger
/bin/sleep 1
sudo echo u > /proc/sysrq-trigger
/bin/sleep 1
sudo echo o  > /proc/sysrq-trigger
