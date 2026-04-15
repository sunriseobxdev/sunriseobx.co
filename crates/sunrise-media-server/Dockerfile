FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY sunrise-media-server /usr/local/bin/
EXPOSE 9999
CMD ["sunrise-media-server"]
