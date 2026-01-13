FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir flask==3.0.0 pycryptodome==3.19.0

# Copy application files
COPY app.py .
COPY templates/ ./templates/

# Create secrets directory
RUN mkdir -p /app/secrets
RUN echo 'FLAG{b4s3_64_3nc0d1ng}' > /app/secrets/easy_flag.txt
RUN echo 'FLAG{w34k_c1ph3r_cr4ck3d}' > /app/secrets/medium_flag.txt
RUN echo 'FLAG{h4sh_c0ll1s10n_f0und}' > /app/secrets/hard_flag.txt
RUN echo 'FLAG{qu4ntum_r3s1st4nt_br0k3n}' > /app/secrets/impossible_flag.txt

EXPOSE 80

CMD ["python3", "app.py"]
