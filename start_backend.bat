@ECHO OFF
cd /d "%~dp0services\decimator_api"
python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt
python run_service.py