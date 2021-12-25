"use strict"

const express = require("express")

const fs = require("fs")

const Port = 5000
const app = express()

app.use(express.json())

app.post('/addIssue', (req, res) => {
    const topic = req.query.topic
    const content = req.query.content
})

app.get('/LIST/:where', (req, res) => {
    const where = req.params.where
})

app.post('/Like/:where', (req, res) => {
    const where = req.params.where
})

app.listen(Port, () => {
    console.log(`server is started at ${Port}`)
})