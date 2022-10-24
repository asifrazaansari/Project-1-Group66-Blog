require('dotenv').config()
const express = require('express')
const route = require('./routes/route')
const mongoose = require('mongoose')
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT
const url = process.env.MONGODB_URL

mongoose.connect(url, {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route)

app.listen(port, function () {
    console.log('Express app running on port ' + (port))
})
