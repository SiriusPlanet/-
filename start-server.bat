@echo off
chcp 65001 >nul

echo Запуск TVA-сервера...
echo.
echo Не закрывайте это окно. Иначе причинно-следственные связи разорвуться.
echo Сервер работает.
echo Для остановки нажмите Ctrl+C.
echo.
echo 🌐 Доступ к хроникам измерений активирован
echo 🕰️ Подключение к временной линии...
echo.

start http://localhost:8000
python -m http.server 8000

echo.
echo 🛑 Сервер остановлен. Реальность стабильна.
pause