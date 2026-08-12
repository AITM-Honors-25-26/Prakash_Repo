# ---- Frontend Dockerfile ----
# Place this at: Frontend/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# dev script already includes --host (vite --host)
CMD ["npm", "run", "dev"]
