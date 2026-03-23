FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (ignoring package-lock to avoid conflicts if it doesn't exist)
RUN npm install

# Copy all the frontend code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the dev server and explicitly bind to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
