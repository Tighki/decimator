@ECHO OFF

cd /d "C:\Users\Administrator\Desktop\dec\services\frontend"
echo Установка зависимостей...
call npm install
echo Запуск frontend...
call npm start