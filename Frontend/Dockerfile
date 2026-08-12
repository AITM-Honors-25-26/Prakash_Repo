# ---- Frontend Dockerfile ----
# Place this at: Frontend/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache).
# NOTE: the committed package-lock.json was generated on Windows and is missing
# the Linux/musl native bindings (npm bug #4828 — e.g. @rolldown/binding-linux-x64-musl
# is never installed for the Alpine build). We therefore install WITHOUT the lock
# so npm resolves the correct platform-specific optional dependencies.
COPY package.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# dev script already includes --host (vite --host)
CMD ["npm", "run", "dev"]
