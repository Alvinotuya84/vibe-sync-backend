# Dockerfile
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY .env* ./

# Expose port
EXPOSE 8000

# Start app
CMD ["npm", "run", "start:prod"]