#!/bin/sh
set -e

case "$1" in
  gunicorn|celery)
    python manage.py migrate --noinput
    ;;
esac

exec "$@"
