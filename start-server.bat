@echo off
chcp 65001 >nul

:: ============================================================
:: ЗАПУСК СИСТЕМЫ ДОСТУПА: Магазин Воспоминаний v3.1.1
:: ============================================================

:: Создаём/очищаем лог-файл
set "LOG=start-server.log"
echo. > "%LOG%"
echo ============================================================ >> "%LOG%"
echo [%date% %time%] START SERVER: Магазин Воспоминаний v3.1.1 >> "%LOG%"
echo ============================================================ >> "%LOG%"

echo.
echo ============================================================
echo ЗАПУСК СИСТЕМЫ ДОСТУПА: Магазин Воспоминаний v3.1.1
echo Хроники измерений активируются...
echo ============================================================
echo.

:: 1. Устанавливаем PYTHONHOME — путь к Python внутри окружения
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "PYTHONHOME=%SCRIPT_DIR%Python311"
set "PATH=%PYTHONHOME%;%PYTHONHOME%\Scripts;%PATH%"

echo Подключение к временной линии...
echo    Активация окружения...
echo    * PYTHONHOME = %PYTHONHOME%
echo    * Лог: %LOG%
echo.

:: 2. Проверка сервера
echo Проверка состояния сервера...
if exist "siss.py" (
    echo    OK Файл siss.py найден >> "%LOG%"
    echo    OK Файл siss.py найден
) else (
    echo    ERROR Ошибка: siss.py не найден!
    echo    Проверьте целостность хроник.
    echo    ERROR Ошибка: siss.py не найден! >> "%LOG%"
    pause
    exit /b 1
)
echo.

:: 3. Запуск сервера
echo Инициализация сервера...
echo    Порт: 8000
echo    Адрес: http://localhost:8000
echo.
echo    WARN Не закрывайте это окно. Иначе причинно-следственные связи разорвутся.
echo    Для остановки нажмите Ctrl+C.
echo.

:: Открываем браузер
start http://localhost:8000

:: Запускаем сервер — через ПРИРОДНЫЙ python, а не через venv\Scripts
echo Запуск Python...
echo [%date% %time%] PYTHON: Checking version... >> "%LOG%"
Python311\python.exe --version >> "%LOG%" 2>&1
Python311\python.exe --version
echo [%date% %time%] PYTHON: Starting siss.py... >> "%LOG%"
echo.
echo Запуск siss.py...
echo [%date% %time%] PYTHON: Running siss.py >> "%LOG%"
Python311\python.exe siss.py >> "%LOG%" 2>&1
set ERRORLEVEL=%ERRORLEVEL%

:: Завершение — с ожиданием нажатия (без таймера)
echo.
echo ============================================================
echo SERVER STOPPED. Реальность стабильна.
echo Хроники сохранены. Возвращайтесь снова!
echo ============================================================
echo [%date% %time%] SERVER STOPPED. Error level: %ERRORLEVEL% >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo.
echo.
echo Нажмите Enter, чтобы закрыть...
pause >nul