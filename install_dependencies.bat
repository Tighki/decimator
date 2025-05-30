@ECHO OFF
cd /d "C:\Users\Administrator\Desktop\dec\services\decimator_api"
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install wheel
pip install bcrypt --only-binary=:all:
pip install -r requirements.txt
echo "Установка завершена!" 