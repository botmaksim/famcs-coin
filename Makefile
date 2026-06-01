.PHONY: up down build logs

up:
	DOCKER_BUILDKIT=0 docker compose up

build:
	DOCKER_BUILDKIT=0 docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f
