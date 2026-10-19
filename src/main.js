import express from 'express'
import { authenticationController, messageController, userController } from './modules/index.js'
import { globalErrorHandling } from './middleware/index.js'
import { bootstrap } from './DB/connection.db.js'
import { ORIGINS, PORT } from './config.js'
import cors from 'cors'
import helmet from 'helmet'
import { generateLimiter } from './common/utils/index.js'
import morgan from 'morgan'
const app = express()

await bootstrap(app , PORT);

var corsOptions = {
  origin: function (origin, callback) {
    if(!ORIGINS.includes(origin)){
        callback(new Error("Unauthorized Origin" , {cause:{status:401}}) , ORIGINS)
    }else{
        callback(null , ORIGINS)
    }
  }
}

const limiter = generateLimiter({});

app.set("trust proxy" , true)

app.use(cors(corsOptions), helmet(), morgan("common"),limiter ,  express.json())

app.use("/upload" , express.static("./upload"))

app.all("/", (req, res) => res.status(200).send({ message: "Welcome to BE API 🌸" }))

app.use("/auth", authenticationController)
app.use("/user", userController)
app.use("/message", messageController)

app.all("{/*dummy}", (req, res) => res.status(404).send({ message: "Invalid application routing" }))

app.use(globalErrorHandling)
