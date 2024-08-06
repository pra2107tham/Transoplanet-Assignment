# Use Node.js 20 as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the remaining application files
COPY server.js .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["node", "server.js"]
