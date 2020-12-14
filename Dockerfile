FROM nginx

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/html
