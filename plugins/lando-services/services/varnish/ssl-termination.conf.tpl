upstream varnish {
  server "{{LANDO_VARNISH_ALIAS}}";
}

server {
  listen *:443 ssl;
  server_name  localhost;

  ssl on;
  ssl_certificate           /certs/cert.crt;
  ssl_certificate_key       /certs/cert.key;

  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

  location / {
    proxy_pass            "http://{{LANDO_VARNISH_ALIAS}}";
    proxy_read_timeout    90;
    proxy_connect_timeout 90;
    proxy_redirect        off;

    proxy_set_header      X-Real-IP $remote_addr;
    proxy_set_header      X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header      X-Forwarded-Proto https;
    proxy_set_header      X-Forwarded-Port 443;
    proxy_set_header      Host $http_host;
  }
}
