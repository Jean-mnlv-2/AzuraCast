#!/usr/bin/env bash

# BantuWave Utility Script
# ------------------------------

set -e

# Display ASCII banner
echo "----------------------------------------------------"
echo "  ____              _       __                      "
echo " |  _ \            | |      \ \                     "
echo " | |_) | __ _ _ __ | |_ _   \ \  __ ___   _____     "
echo " |  _ < / _\` | '_ \| __| | | \ \/ _\` \ \ / / _ \    "
echo " | |_) | (_| | | | | |_| |_| |\  (_| |\ V /  __/    "
echo " |____/ \__,_|_| |_|\__|\__,_| \_\__,_| \_/ \___|    "
echo "----------------------------------------------------"
echo "  Management Utility for BantuWave Radio Platform   "
echo "----------------------------------------------------"

# Help message
show_help() {
    echo "Usage: ./bantuwave.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup         Initial setup (copies .env.sample, builds containers)"
    echo "  start         Start the application (detached)"
    echo "  stop          Stop the application"
    echo "  restart       Restart the application"
    echo "  update        Pull latest changes and rebuild containers"
    echo "  logs          Follow logs from all containers"
    echo "  shell         Open a Django backend shell"
    echo "  migrate       Run database migrations"
    echo "  createsuperuser  Create a Django superuser"
    echo "  test          Run tests for both backend and frontend"
    echo "  help          Show this help message"
}

# Command functions
setup() {
    echo "Setting up BantuWave..."
    if [ ! -f .env ]; then
        echo "Creating .env file from .env.sample..."
        cp .env.sample .env
        echo "Please edit the .env file to configure your application."
    else
        echo ".env file already exists, skipping."
    fi
    echo "Building containers..."
    docker compose build
    echo "Setup complete. Run ./bantuwave.sh start to begin."
}

start() {
    echo "Starting BantuWave..."
    docker compose up -d
    echo "Application started at http://localhost:${WEB_PORT:-8080} (WEB_PORT dans .env)"
}

stop() {
    echo "Stopping BantuWave..."
    docker compose down
    echo "Application stopped."
}

restart() {
    echo "Restarting BantuWave..."
    docker compose restart
    echo "Application restarted."
}

update() {
    echo "Updating BantuWave..."
    git pull
    docker compose build
    docker compose up -d
    docker compose exec backend python manage.py migrate
    echo "Update complete."
}

logs() {
    docker compose logs -f
}

shell() {
    docker compose exec backend python manage.py shell
}

migrate() {
    docker compose exec backend python manage.py migrate
}

createsuperuser() {
    docker compose exec backend python manage.py createsuperuser
}

test() {
    echo "Running backend tests..."
    docker compose exec backend python manage.py test
}

# Main command dispatcher
case "$1" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    update)
        update
        ;;
    logs)
        logs
        ;;
    shell)
        shell
        ;;
    migrate)
        migrate
        ;;
    createsuperuser)
        createsuperuser
        ;;
    test)
        test
        ;;
    help|*)
        show_help
        ;;
esac
