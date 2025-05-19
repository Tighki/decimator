@ECHO OFF
cd /d "C:\Users\Tighki\Desktop\dec\services\decimator_api"
python -m venv .venv
call .venv\Scripts\activate
pip install poetry
poetry install
python run_service.py