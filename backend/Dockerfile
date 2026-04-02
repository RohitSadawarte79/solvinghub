FROM golang:alpine AS builder

WORKDIR /app

# Cache Go module downloads as a separate layer
COPY go.mod go.sum ./
RUN go mod download

# Copy the full source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/server ./cmd/server

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
# Use distroless for a tiny, secure image with no shell
FROM gcr.io/distroless/static-debian12

COPY --from=builder /bin/server /bin/server

EXPOSE 8080

ENTRYPOINT ["/bin/server"]
