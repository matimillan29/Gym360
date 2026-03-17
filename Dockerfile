# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Install PHP dependencies
FROM composer:2 AS composer-builder

WORKDIR /build

# Copy composer files
COPY backend/composer.json backend/composer.lock ./

# Install dependencies (sin dev)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy backend source
COPY backend/ ./

# Generate optimized autoloader
RUN composer dump-autoload --optimize --no-dev

# Stage 3: Production image
FROM php:8.4-apache

# Install PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql zip intl bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# Configure Apache for Laravel
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Set working directory
WORKDIR /var/www/html

# Copy backend from composer stage (includes vendor)
COPY --from=composer-builder /build/ ./

# Copy frontend build to public
COPY --from=frontend-builder /build/dist/ ./public/

# Rename frontend index.html to app.html (Laravel has its own index.php)
RUN mv public/index.html public/app.html 2>/dev/null || true

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Create symlinks to Cloudron persistent storage (/app/data)
# These will work when /app/data is mounted by Cloudron
RUN rm -rf storage && ln -sf /app/data/storage storage
RUN rm -rf bootstrap/cache && ln -sf /app/data/bootstrap-cache bootstrap/cache

# Create .env symlink to persistent storage
RUN rm -f .env && ln -sf /app/data/.env .env

# Create public/storage symlink for serving uploaded files
RUN ln -sf /app/data/storage/app/public public/storage

# Set permissions on app directory
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80

# Start script handles Laravel initialization
CMD ["/start.sh"]
