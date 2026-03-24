FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm install

# Copier le reste du code source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
