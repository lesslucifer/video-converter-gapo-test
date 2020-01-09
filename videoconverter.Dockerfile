FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone

RUN apt-get clean && apt-get -yqq update && apt-get install -yqq locales curl software-properties-common git gettext

# [NODEJS]
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get -yqq update
RUN apt-get install -yqq nodejs npm yarn

#[REDIS]
RUN apt-get install -yqq redis-server

#[SUPPERVISOR]
RUN apt-get install -yqq supervisor nano htop

#[FFMPEG]
RUN apt-get install -yqq ffmpeg

COPY . /var/www/server
COPY ./.config/start_server.sh /sbin/start_server.sh
COPY ./.config/etc/redis/redis.conf /etc/redis/redis.conf
COPY ./.config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./.config/env.json /var/www/server/env.json

RUN chmod 755 /sbin/start_server.sh

ENTRYPOINT /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80