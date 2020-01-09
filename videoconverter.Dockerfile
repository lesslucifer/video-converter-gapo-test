FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone

# [NODEJS]
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get -yqq update
RUN apt-get install -yqq nodejs npm yarn

#[REDIS]
RUN apt-get install -yqq redis-server
COPY ./config/etc/redis/redis.conf /etc/redis/redis.conf

#[SUPPERVISOR]
RUN apt-get install -yqq supervisor nano htop
COPY ./config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENTRYPOINT /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80