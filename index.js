"use strict"

const {secret} = require("./secret")

const express = require("express")
const mysql = require("mysql")
// const fs = require("fs")

const Port = 5000
const app = express()
const db = mysql.createConnection({
    host: secret.url,
    user: "admin",
    password : secret.password,
    database: "sys"
})

db.connect(err => {
    if (err) throw err;
    console.log("DB is connected")
})

app.use(express.json())

app.post('/addIssue', (req, res) => {
    const topic = req.query.topic
    const content = req.query.content
    const sql = `INSERT INTO post (topic, content, date) VALUES ('${topic}', '${content}', now())`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        res.json({
            isAdded: true
        })
    });
})

app.get('/LIST/:where', (req, res) => {
    const where = req.params.where
    const sql = `SELECT * FROM post WHERE id = '${where}'`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        const content = result[0]
        res.json({
            content : content
        })
    });
})

app.listen(Port, () => {
    console.log(`server is started at ${Port}`)
})