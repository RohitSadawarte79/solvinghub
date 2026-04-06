FROM golang:1.25-alpine AS builder

WORKDIR /app


COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /bin/server /bin/server
EXPOSE 8080
CMD ["/bin/server"]
