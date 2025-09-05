FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.25.3-alpine
# Copy the built app
COPY --from=build /app/dist/whatsapp-clone-ui/browser /usr/share/nginx/html
# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200
