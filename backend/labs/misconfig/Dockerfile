FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy vulnerable nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy web files
COPY index.html .
COPY .env .
COPY admin/ ./admin/
COPY config/ ./config/
COPY .git/ ./.git/

# Create exposed files
RUN echo 'DB_PASSWORD=supersecret123' > .env
RUN echo 'API_KEY=sk_live_abc123xyz' >> .env
RUN echo 'FLAG{d3f4ult_cr3d3nt14ls}' >> .env
RUN mkdir -p config && echo '{"admin":"admin","flag":"FLAG{d3bug_m0d3_3n4bl3d}"}' > config/credentials.json
RUN mkdir -p .git && echo 'FLAG{c0rs_byp4ss_ch41n}' > .git/secret.txt
RUN mkdir -p admin && echo '<!DOCTYPE html><html><body><h1>Admin Panel</h1><p>FLAG{mult1_s3rv1c3_ch41n}</p></body></html>' > admin/dashboard.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
