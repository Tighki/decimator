@ECHO OFF

cd /d "C:\Users\Tighki\Desktop\decimator-main\services\frontend"
echo Установка зависимостей...
call npm install
echo Запуск frontend...
call npm start