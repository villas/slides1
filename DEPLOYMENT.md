# Deployment Guide

## Frontend Deployment

### Simple HTTP Server
```bash
# Using Python (development)
python3 -m http.server 8000

# Using Node.js serve
npx serve .

# Using PHP
php -S localhost:8000
```

### Web Server Configuration

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ backend_api.php/$1 [L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css text/javascript application/javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/* "access plus 1 month"
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/slideshow;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
```

## Backend Deployment

### Development
```bash
# Install dependencies
pip install fastapi fdb uvicorn python-multipart

# Run development server
uvicorn backend_example:app --reload --host 0.0.0.0 --port 8000
```

### Production

#### Using Gunicorn
```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend_example:app --bind 0.0.0.0:8000
```

#### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "backend_example:app", "--bind", "0.0.0.0:8000"]
```

#### Systemd Service
```ini
[Unit]
Description=Real Estate Slideshow API
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/path/to/api
ExecStart=/usr/local/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend_example:app --bind 127.0.0.1:8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## Database Setup

### Firebird Configuration
```sql
-- Create properties table
CREATE TABLE properties (
    property_id INTEGER NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(12,2),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    area_sqft INTEGER,
    property_type VARCHAR(50),
    year_built INTEGER,
    garage_spaces INTEGER,
    description BLOB SUB_TYPE TEXT,
    status VARCHAR(20) DEFAULT 'available',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_created ON properties(created_date);
```

## File System Structure
```
property_images/
├── 1/
│   ├── main.jpg
│   ├── kitchen.jpg
│   ├── bedroom.jpg
│   └── thumbs/
│       ├── main.jpg
│       ├── kitchen.jpg
│       └── bedroom.jpg
├── 2/
│   ├── exterior.jpg
│   └── thumbs/
│       └── exterior.jpg
└── ...
```

## TV Display Setup

### Kiosk Mode (Chrome)
```bash
# Launch in kiosk mode
google-chrome --kiosk --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://your-domain.com

# For Raspberry Pi
chromium-browser --kiosk --disable-infobars http://your-domain.com
```

### Auto-start on Boot
```bash
# Add to /etc/xdg/lxsession/LXDE-pi/autostart
@chromium-browser --kiosk --disable-infobars http://localhost:8000
```

## Security Considerations

1. **API Security**
   - Use HTTPS in production
   - Implement API rate limiting
   - Validate all input parameters
   - Use environment variables for sensitive config

2. **File Security**
   - Restrict image directory permissions
   - Validate file types and sizes
   - Scan uploads for malware

3. **Database Security**
   - Use connection pooling
   - Implement proper user permissions
   - Regular backups and monitoring

## Performance Optimization

1. **Image Optimization**
   - Use WebP format where supported
   - Generate multiple sizes/thumbnails
   - Implement lazy loading
   - Use CDN for image delivery

2. **Caching**
   - Enable browser caching for static assets
   - Implement API response caching
   - Use Redis for session storage

3. **Network**
   - Enable gzip compression
   - Minimize HTTP requests
   - Use HTTP/2 where possible

## Monitoring

1. **Application Monitoring**
   - Monitor API response times
   - Track error rates and types
   - Log slideshow usage patterns

2. **System Monitoring**
   - Monitor server resources
   - Database performance
   - Network bandwidth usage

3. **Alerts**
   - Set up alerts for API failures
   - Monitor disk space for images
   - Database connection issues