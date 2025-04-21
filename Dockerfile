FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci --no-optional

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]