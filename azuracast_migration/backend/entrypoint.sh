#!/bin/sh
set -e
cd /app
python manage.py migrate --noinput
if [ "${USE_S3:-0}" != "1" ] && [ "${USE_S3:-false}" != "True" ]; then
  python manage.py collectstatic --noinput || true
fi
exec "$@"
