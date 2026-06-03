.PHONY: install dev-backend dev-frontend test seed clean

install:
	cd backend && python3.12 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && . venv/bin/activate && pytest -v

seed:
	cd backend && . venv/bin/activate && python -m app.sample_data

clean:
	rm -f backend/fiserv.db
	cd backend && . venv/bin/activate && python -c "from app.db import init_db; init_db()"
