FROM golang:1.25-alpine AS builder

WORKDIR /app

ENV GOTOOLCHAIN=auto

# ← No "backend/" prefix when root dir is set to /backend
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/server ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /bin/server /bin/server
EXPOSE 8080
CMD ["/bin/server"]
