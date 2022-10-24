const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const authorModel = require("../models/authorModel")

const isvalidEmail = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
const isValidPassword = new RegExp(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/)
const stringChecking = function (data) {
    if (typeof data !== 'string') {
        return false;
    } else if (typeof data === 'string' && data.trim().length === 0) {
        return false;
    } else {
        return true;
    }
}


const createAuthor = async function (req, res) {
    try {
        let data = req.body

        if (Object.keys(data).length === 0) return res.status(400).send({ status: false, msg: "Please enter data to create Author" })

        const { fname, lname, title, email, password } = data

        if (!stringChecking(fname)) return res.status(400).send({ status: false, msg: "fname must be present and have non empty string " })

        if (!stringChecking(lname)) return res.status(400).send({ status: false, msg: "lname must be present and have non empty string " })

        if (!isvalidEmail.test(email)) return res.status(400).send({ status: false, msg: "please enter non empty valid email" })

        if (title !== "Mr" && title !== "Mrs" && title !== "Miss") return res.status(400).send({ status: false, msg: "title should be present and have value  Mr, Mrs and Miss only" })

        const duplicateEmail = await authorModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, msg: "email Id already register ,use another email" })

        if (!isValidPassword.test(password)) {
            return res.status(400).send({ status: false, msg: "Password must be present and have at least a symbol, upper and lower case letters and a number with min 6 and max 16 letters" })
        }
        const createdata = await authorModel.create(data)
        return res.status(201).send({ status: true, msg: "Author Created", data: createdata })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

const loginUser = async function (req, res) {
    try {
        let emailId = req.body.email
        let password = req.body.password
        if (!emailId || !password) {
            return res.status(400).send({ status: false, msg: "please enter email and password" })
        }
        if (!isvalidEmail.test(emailId)) return res.status(400).send({ status: false, msg: "please enter non empty valid email" })
        if (!isValidPassword.test(password)) {
            return res.status(400).send({ status: false, msg: "Password is incorrect" })
        }

        const author = await authorModel.findOne({ email: emailId, password: password })
        if (!author) {
            return res.status(400).send({ status: false, msg: "email or password is not correct" })
        } else {
            const token = jwt.sign({
                authorId: author._id.toString(),
                batch: "Plutonium Group66",
                Organisation: "FunctionUp",
            }, "Group66-Project-Blog");
            res.setHeader("x-api-key", token);
            res.status(201).send({ status: true, data: token })
        }
    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }

}

module.exports = { createAuthor, loginUser }