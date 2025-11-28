#!/bin/sh

echo "Waiting for DB at $DATABASE_HOST:$DATABASE_PORT..."

while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
  echo "DB not ready, waiting..."
  sleep 1
done

echo "DB is LIVE! Starting app..."
exec "$@"
