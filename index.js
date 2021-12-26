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
app.use(express.urlencoded({ extended: false }))

// view 경로 설정
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)

app.get('/', (req, res) => {
    const sql = `SELECT * FROM post`
    db.query(sql, function (err, result, fields) {
        if(err) throw err
        res.render("main", {
            data:'안녕하십니까?',
            result:result
        })
    })
})

app.get('/addIssue', (req, res) => {
    res.render("write")
})

app.post('/addIssue', (req, res) => {
    const topic = req.body.topic
    const content = req.body.content
    const sql = `INSERT INTO post (topic, content, date) VALUES ('${topic}', '${content}', now())`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        res.redirect("/")
    });
})

app.get('/LIST/:where', (req, res) => {
    const where = req.params.where
    const sql = `SELECT * FROM post WHERE id = ${where}`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        const content = result[0]
        res.render("content", {
            title : content.topic,
            content : content.content,
            views : content.views
        })
    });
})

app.listen(Port, () => {
    console.log(`server is started at ${Port}`)
})