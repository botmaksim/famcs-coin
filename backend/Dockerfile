FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.io,direct
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o famcscoin-api main.go
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/famcscoin-api .
COPY --from=builder /app/internal/db/migrations ./internal/db/migrations
EXPOSE 8083
CMD ["./famcscoin-api"]