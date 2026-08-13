FROM node:22-alpine

WORKDIR /app

# Install dependencies WITHOUT the committed lock: it was generated on Windows and
# is missing the Linux/musl native bindings (npm bug #4828 — e.g.
# @rolldown/binding-linux-x64-musl is never installed for the Alpine build), so npm
# must resolve the correct platform-specific optional dependencies.
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

# dev script already includes --host (vite --host)
CMD ["npm", "run", "dev"]
