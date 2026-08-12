
#download nodejs
FROM node:20-alpine


#set working directory
WORKDIR /app

#copy package.json and package-lock.json
COPY package*.json ./

#install Dependencies 
RUN npm ci


#copy all files to working directory
COPY . .

# run build command
RUN npm run build


# Expose port
EXPOSE 3000

#start server 
CMD ["npm", "run", "start"]
