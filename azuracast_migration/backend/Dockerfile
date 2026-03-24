# Utiliser une image Python officielle comme image de base
FROM python:3.11-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# psycopg2-binary : pas de build; libmagic1 pour python-magic; curl pour healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "bantuwave.asgi:application"]
