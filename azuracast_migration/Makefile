# BantuWave Makefile
# -------------------------

SHELL := /bin/bash
.PHONY: help build up down restart logs shell migrate migrations tests frontend-build clean

# Display help by default
help:
	@echo "BantuWave - Management Commands"
	@echo "------------------------------------"
	@echo "build            Rebuild all Docker containers"
	@echo "up               Start all containers in detached mode"
	@echo "down             Stop and remove all containers"
	@echo "restart          Stop and start all containers"
	@echo "logs             Show real-time logs for all containers"
	@echo "shell            Open a Django shell in the backend container"
	@echo "migrate          Apply all Django migrations"
	@echo "migrations       Create new Django migrations"
	@echo "tests            Run backend tests"
	@echo "frontend-build   Build the React frontend for production"
	@echo "clean            Clean up temporary files and logs"

# Docker orchestration
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

# Backend commands
shell:
	docker compose exec backend python manage.py shell

migrate:
	docker compose exec backend python manage.py migrate

migrations:
	docker compose exec backend python manage.py makemigrations

tests:
	docker compose exec backend python manage.py test

# Frontend commands
frontend-build:
	docker compose exec frontend npm run build

# Utility
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/static/*
	rm -rf frontend/dist/*
