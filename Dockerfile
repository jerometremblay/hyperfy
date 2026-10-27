# Build stage
FROM node:26.12.1-alpine AS builder
WORKDIR /app

# Install native addon build tools
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json to leverage layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files and build
COPY . .
RUN npm run build

# Production stage
FROM node:26.12.1-alpine AS production
WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl && \
    adduser -S nodeuser -u 1001

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts

# Set build argument and environment variable
ARG COMMIT_HASH=local
ENV COMMIT_HASH=${COMMIT_HASH:-local} \
    NODE_ENV=production

# Expose the port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=2s --timeout=10s --start-period=5s --retries=5 \
  CMD curl -f http://localhost:3000/status || exit 1

# Start the application
CMD ["npm", "run", "start"]
