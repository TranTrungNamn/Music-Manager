FROM node:20-slim

WORKDIR /app

# Chỉ copy package.json trước để tận dụng cache của Docker
COPY package*.json ./
RUN npm install

# Copy toàn bộ code
COPY . .

# Build dự án NestJS
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]