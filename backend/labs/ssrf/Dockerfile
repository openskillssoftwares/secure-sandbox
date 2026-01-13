FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y curl iputils-ping net-tools && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY templates/ ./templates/
COPY internal/ ./internal/

# Create internal services
RUN mkdir -p /app/internal
RUN echo 'FLAG{ssrf_l0c4lh0st_p1ng}' > /app/internal/easy_flag.txt
RUN echo 'FLAG{1nt3rn4l_n3tw0rk_sc4n}' > /app/internal/admin_secret.txt
RUN echo 'FLAG{cl0ud_m3t4d4t4_l34k}' > /app/internal/cloud_metadata.txt
RUN echo 'FLAG{bl1nd_ssrf_ch41n}' > /app/internal/root_access.txt

# Setup internal HTTP server on port 8080
RUN echo '#!/bin/sh\npython3 -m http.server 8080 --directory /app/internal &\npython3 app.py' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80

CMD ["/app/start.sh"]
