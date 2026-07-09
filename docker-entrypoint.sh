#!/bin/sh
# Writes the runtime configuration for BusyNest from environment variables.
# Runs automatically when the container starts (nginx docker-entrypoint.d).

cat > /usr/share/nginx/html/config.js <<EOF
window.__BUSYNEST_CONFIG__ = {
  supabaseUrl: '${SUPABASE_URL}',
  supabaseAnonKey: '${SUPABASE_ANON_KEY}',
}
EOF

echo "BusyNest: wrote runtime config (supabaseUrl=${SUPABASE_URL:-<empty>})"
