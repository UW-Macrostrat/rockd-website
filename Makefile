all:
	docker build -t rockd_website:latest .
	docker run --rm -it -p 5500:5500 --name rockd_website --env-file .env rockd_website:latest

VERSION := $(shell jq -r .version ./package.json)

TAG := hub.opensciencegrid.org/macrostrat/rockd-website:$(VERSION)

debug:
	docker build -t rockd_website:latest .
	-docker kill rockd_website
	docker run --rm -t \
		-p 5500:5500 \
		-p 9229:9229 \
		-d \
		--name rockd_website \
		--env-file .env \
		rockd_website:latest \
		node --inspect=0.0.0.0:9229 /code/server.js

publish:
	docker build --platform=linux/amd64 -t $(TAG) .
	docker push $(TAG)

