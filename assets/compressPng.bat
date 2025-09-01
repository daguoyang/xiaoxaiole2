@echo off
setlocal enabledelayedexpansion

set "folderPath=%cd%"  

for /r "%folderPath%" %%F in (*.png) do (
	echo %%F
	pngquant -f --ext .png --quality 0-100 "%%F"
)

echo "pngquant success"
pause