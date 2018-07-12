# docker-swarm-feeds
HTTP endpoints for fetching various feeds from Swarm (traefik domain tags, latest service updates, etc)

## Usage

docker-compose-yml
```
version: '3'
services:
 feeds:
  image: flaviostutz/docker-swarm-feeds
  ports:
    - "8000:8000"
  environment:
    - FEED_NAME=test
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

## Endpoints

* /domains
