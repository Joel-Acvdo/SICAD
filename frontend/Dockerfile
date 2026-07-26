# Imagen del frontend SICAD (Next.js en modo standalone)
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# La URL de la API se inyecta en el build (Next.js hornea las variables NEXT_PUBLIC_* al compilar)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Destino del proxy /api: Next hornea el rewrite en el build, así que BACKEND_URL
# debe estar disponible AQUÍ (no solo en runtime).
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

# Imagen final ligera
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
