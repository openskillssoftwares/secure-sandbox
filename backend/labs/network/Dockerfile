FROM ubuntu:22.04

# Install network services
RUN apt-get update && apt-get install -y \
    openssh-server \
    vsftpd \
    telnetd \
    apache2 \
    mysql-server \
    netcat-openbsd \
    nmap \
    curl \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH (vulnerable)
RUN mkdir /var/run/sshd
RUN echo 'root:password123' | chpasswd
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config
RUN echo 'FLAG{0p3n_p0rt_d1sc0v3ry}' > /root/easy_flag.txt

# Configure FTP (vulnerable)
RUN echo 'anonymous_enable=YES' >> /etc/vsftpd.conf
RUN echo 'write_enable=YES' >> /etc/vsftpd.conf
RUN mkdir -p /srv/ftp
RUN echo 'FLAG{s3rv1c3_3num3r4t10n}' > /srv/ftp/medium_flag.txt

# Configure web server
RUN echo '<html><body><h1>Web Server</h1><p>FLAG{f1r3w4ll_byp4ss}</p></body></html>' > /var/www/html/index.html

# Create vulnerable service on port 9999
RUN echo '#!/bin/bash\nwhile true; do echo "FLAG{z3r0_d4y_3xpl01t}" | nc -l -p 9999; done' > /start_vuln_service.sh
RUN chmod +x /start_vuln_service.sh

# Startup script
RUN echo '#!/bin/bash\n\
service ssh start\n\
service vsftpd start\n\
service apache2 start\n\
/start_vuln_service.sh &\n\
tail -f /dev/null' > /start.sh

RUN chmod +x /start.sh

EXPOSE 22 21 80 9999

CMD ["/start.sh"]
