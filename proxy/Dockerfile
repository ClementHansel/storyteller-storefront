FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --production

COPY src/ ./src/

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3025

CMD ["node", "src/index.js"]
