# ---- Frontend Dockerfile ----
# Place this at: Frontend/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json yarn.lock ./
RUN yarn install

# Copy source
COPY . .

EXPOSE 5173

# --host exposes Vite to outside the container
CMD ["yarn", "dev", "--host"]
