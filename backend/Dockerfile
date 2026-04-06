FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files from backend folder
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source code
COPY backend/ .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/server ./cmd/server

# ── Stage 2: Runner ─────────────────────────────────────────────
FROM alpine:latest

WORKDIR /app

COPY --from=builder /bin/server /bin/server

EXPOSE 8080

CMD ["/bin/server"]