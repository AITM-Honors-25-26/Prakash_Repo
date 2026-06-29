# ---- Backend Dockerfile ----
# Place this at: Backend/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 9005

CMD ["npm", "run", "watch"]
