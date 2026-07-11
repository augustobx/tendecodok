# Base image con Alpine
FROM node:20-alpine AS base
# Se requiere openssl y libc6-compat para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

# --- 1. Dependencias ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
# Generamos el cliente de Prisma para que quede en node_modules
RUN npx prisma generate

# --- 2. Build de la aplicación ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 3. Runner (Producción) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# REGLA DE ORO: Copiamos y asignamos permisos en el mismo comando (--chown)
# Esto evita que Docker duplique el peso de los archivos en una capa nueva
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma

USER nextjs

# Exponer el puerto interno requerido (por defecto en Next.js es el 3000)
EXPOSE 3000
ENV PORT=3000

# El entrypoint ejecutará las migraciones de producción (si las hay) y luego levantará la app
# Si no usas migraciones automatizadas, puedes cambiar esto a CMD ["npm", "start"]
CMD ["npm", "start"]