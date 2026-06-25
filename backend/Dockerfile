# Imagen del backend SICAD
FROM node:24-alpine

WORKDIR /app

# Instala dependencias primero (mejor cacheo de capas)
COPY package*.json ./
RUN npm install

# Copia el resto del código y el esquema Prisma
COPY . .

# Genera el cliente Prisma
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]
