#!/bin/sh
set -eu

PORT="${PORT:-10000}"

# Render supplies PORT at runtime; Apache must listen on that port.
sed -ri "s/^Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# The migrations are idempotent and allow a fresh Neon database to initialize on first boot.
php artisan config:clear
php artisan migrate --force
php artisan config:cache

# Apache/PHP runs as www-data; keep runtime directories writable after setup.
chown -R www-data:www-data storage bootstrap/cache

exec "$@"
