"use strict"

const {secret} = require("./secret")

const express = require("express")
const mysql = require("mysql")
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")
// const fs = require("fs")

const saltRounds = 10
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
app.use(cookieParser())

// view 경로 설정
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)


function dontCare(res) {
    res.render("wrong_access")
}


app.get('/', (req, res) => {
    res.render("main")
})

app.get('/list', (req, res) => {
    const sql = `SELECT * FROM post`
    db.query(sql, function (err, result, fields) {
        if(err) throw err
        res.render("list", {
            result:result
        })
    })
})

app.get('/addIssue', (req, res) => {
    res.render("write")
})

app.get('/login', (req, res) => {
    res.render("login")
})

app.post('/addIssue', (req, res) => {
    const topic = req.body.topic
    const content = req.body.content
    const sql = `INSERT INTO post (topic, content, date) VALUES ('${topic}', '${content}', now())`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        res.redirect(`/list/${result.insertId}`)
    });
})

app.post('/login', (req, res) => {
    const id = req.body.id
    const ps = req.body.password
    const sql = `SELECT password FROM USER WHERE id = '${id}'`
    db.query(sql, function (err, result) {
        if (err) throw err
        const comparePs = result[0].password
        bcrypt.compare(ps, comparePs, (err, isMatch) => {
            if(err) throw err
            if(isMatch == true) {
                res.json({
                    isSuccess : true
                }).cookie("auth", "dd")
            } else {
                res.json({
                    isSuccess : false
                })
            }
        })
    })
})

app.post('/register', (req, res) => {
    const id = req.body.id
    const ps = req.body.password
    const name = req.body.name
    bcrypt.genSalt(saltRounds, (err, salt) => { //genSalt를 사용하여 saltRounds를 보내고, err와 salt를 받아 함수를 실행한다.
        if(err) throw err
        bcrypt.hash(ps, salt, (err, hash) => { //암호화해주는 핵심 부분 //hash를 통해 비밀번호를 보내고, 위의 함수에서 받은 salt를 보내고, err와 hash를 받아서 아래 로직을 실행하라. 
            if(err) throw err //만약 에러가 있따면 err을 주고 넘어가라
            const sql = `INSERT INTO USER (id, password, userName) VALUES ('${id}', '${hash}', '${name}')`
            db.query(sql)
            res.json({
                isSuccess : true
            })
        })
    })
})

app.get('/list/:where', (req, res) => {
    const where = req.params.where
    const sql = `SELECT * FROM post WHERE id = ${where}`
    db.query(sql, function (err, result, fields) {
        if (err) throw err
        if(result.length !== 0) {
            const sql2 = `UPDATE post SET views = views + 1 WHERE id = ${where}`
            db.query(sql2)
            const content = result[0]
            res.render("content", {
                title : content.topic,
                content : content.content,
                views : content.views
            })
        } else {
            dontCare(res)
        }
    });
})

app.listen(Port, () => {
    console.log(`server is started at ${Port}`)
})