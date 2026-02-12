FROM node:20

WORKDIR /app

# Installer client PostgreSQL pour pg_isready
RUN apt-get update && apt-get install -y postgresql-client

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD sh -c "until pg_isready -h db -p 5432; do echo 'Waiting for database...'; sleep 2; done && npx prisma migrate deploy && node prisma/seed.js && npm start"

