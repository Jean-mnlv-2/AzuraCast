# Stage 1: Build stage
FROM python:3.11-slim as builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install dependencies into a wheels directory
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final stage
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PATH="/home/bantuwave/.local/bin:${PATH}"

WORKDIR /app

# Install runtime dependencies and create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libmagic1 \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 bantuwave \
    && mkdir -p /app/storage/media /app/staticfiles \
    && chown -R bantuwave:bantuwave /app

# Copy wheels from builder and install
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# Copy project files
COPY --chown=bantuwave:bantuwave . .

# Prepare entrypoint
COPY --chown=bantuwave:bantuwave entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Switch to non-root user
USER bantuwave

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "bantuwave.asgi:application"]
