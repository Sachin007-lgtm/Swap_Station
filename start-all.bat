@echo off
set ROOT=%~dp0
pushd "%ROOT%backend"
start "backend" cmd /k "npm start"
start "simulator" cmd /k "npm run signal-simulator"
popd
pushd "%ROOT%frontend"
start "frontend" cmd /k "npm run dev"
popd
