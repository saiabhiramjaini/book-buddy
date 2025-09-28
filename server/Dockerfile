FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
RUN npm install typescript -g
COPY . .
RUN npm run build
RUN npx drizzle-kit generate
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
