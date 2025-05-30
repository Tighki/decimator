@ECHO OFF
cd /d "C:\Users\Tighki\Desktop\dec\services\decimator_api"

echo Удаление старого виртуального окружения...
IF EXIST .venv (
    rmdir /s /q .venv
)

echo Создание нового виртуального окружения...
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip --index-url https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn
pip install wheel --index-url https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn
pip install --index-url https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn --timeout 100 --retries 10 fastapi databases motor python-dotenv uvicorn requests aiofiles fastapi-jwt-auth passlib[bcrypt] pydantic==1.10.13 bcrypt
python run_service.py