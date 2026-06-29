# Base image con Alpine
FROM node:20-alpine AS base
# Se requiere openssl y libc6-compat para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

# Dependencias
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
# Generamos el cliente de Prisma para que quede en node_modules
RUN npx prisma generate

# Build de la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner (Producción)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiamos la aplicación compilada, dependencias y archivos estáticos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# REGLA 3: Mantener herramientas de BD en el runner (Copiamos prisma)
COPY --from=builder /app/prisma ./prisma

# Asignar permisos al usuario no-root sobre el directorio de trabajo
RUN chown -R nextjs:nodejs /app

USER nextjs

# Exponer el puerto interno requerido (por defecto en Next.js es el 3000)
EXPOSE 3000

ENV PORT=3000

# El entrypoint ejecutará las migraciones de producción (si las hay) y luego levantará la app
# Si no usas migraciones automatizadas, puedes cambiar esto a CMD ["npm", "start"]
CMD ["npm", "start"]
