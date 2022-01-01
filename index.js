"use strict"

const {secret} = require("./secret")

const express = require("express")
const mysql = require("mysql")
const bcrypt = require("bcrypt")
module.exports = {bcrypt}
const cookieParser = require("cookie-parser")
// const jwt = require("jsonwebtoken")
const googleNewsScraper = require('google-news-scraper')
const mongoose = require("mongoose")
const schedule = require("node-schedule")
const convert = require("xml-js")
const axios = require("axios")

const saltRounds = 10
const Port = 5000
const app = express()

const {News} = require("./models/news")
const {User} = require("./models/user")

const link = "mongodb+srv://admin:93109310@cluster0.ugvix.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    mongoose.connect(link, function(err) {
      if (err) {
        console.error('mongodb connection error', err);
      }
      console.log('mongodb connected');
    });

const db = mysql.createConnection({
    host: secret.url,
    user: "donghyeon",
    password : secret.password,
    database: secret.name
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

var job = schedule.scheduleJob('1 27 0 * * *', async () => {
    const link = "백신";
    const articles = await googleNewsScraper({
        searchTerm: link,
        prettyURLs: false,
        queryVars: {
            hl:"kr-KR",
            gl:"KR",
            ceid:"KR:kr"
          },
        timeframe: "1d",
        puppeteerArgs: []
    })
    for(let i=0; i<articles.length; i++) {
            const news = new News(articles[i])
            news.save((err, Info) => {
                if(err) throw err
            })
    }
})

const {auth} = require("./middleware/auth.js")

// function Auth(token, cb) {
//     const id = jwt.decode(token, "NOVACCINE")
//     console.log(id)
//     const sql2 = `SELECT * FROM USER WHERE id='${id}' AND token='${token}'`
//     db.query(sql2, (err, result, fields) => {
//         if (err) throw err
//         console.log(result)
//         if(result.length !== 0) {
//             cb(true, result[0]);
//         } else {
//             cb(false);
//         }
//     })
// }

app.get('/', (req, res) => {
    const key = req.cookies.auth;
    auth(key, (err, user)=> {
        if (err || !user) {
            res.render("main", {
                link:"/login",
                text:"로그인/가입",
                greeting : `간단하게 가입하기`
            })
        }
        else {
            res.render("main", {
                link:"/logout",
                text:"로그아웃",
                greeting : `${user.name}님 어서오세요`
            })
        }
    })
    // Auth(key, (is, user) => {
    //     if(is === true) {
    //         res.render("main", {
    //             link:"/logout",
    //             text:"로그아웃",
    //             greeting : `${user.userName}님 어서오세요`
    //         })
    //     } else {
    //         res.render("main", {
    //             link:"/login",
    //             text:"로그인/가입",
    //             greeting : `간단가입하셔서 여러 글을 쓰세요!`
    //         })
    //     }
    // })
})

app.get('/list', (req, res) => {
    const sql = `SELECT * FROM post`
    db.query(sql, function (err, result, fields) {
        if(err) throw err
        if(result.length !== 0) {
            res.render("list", {
                result:result,
                t : "전체"
            })
        } else {
            dontCare(res)
        }
    })
})

app.get('/logout', (req, res) => {
    const key = req.cookies.auth
    auth(key, (err, user)=> {
        if (err || !user) {
            return ;
        }
        else {
            User.findOneAndUpdate({token:key}, { token:""}, (err, user)=> {
                if(err) return ;
                res.redirect("/")
            })
        }
    })
})

app.get('/addIssue', (req, res) => {
    const key = req.cookies.auth;
    auth(key, (err, user)=> {
        if (err || !user) {
            res.redirect('/login')
        }
        else {
            res.render("write")
        }
    })
})

app.get('/login', (req, res) => {
    res.render("login")
})

app.get('/register' ,(req, res) => {
    res.render("register")
})

app.get("/test", async (req, res) => {
    const filter = {date : new Date().toLocaleDateString()};
    const all = await News.find(filter);
    console.log(all)
    res.render("gogo", {
        date: new Date(),
        data : all
    })
})

app.post('/addIssue', (req, res) => {
    const type = req.body.type
    const topic = req.body.topic
    const content = req.body.content
    const key = req.cookies.auth
    auth(key, (err, user)=> {
        if (err || !user) {
            res.redirect('/login')
        }
        else {
            const sql = `INSERT INTO post (topic, content, userName, date, type) VALUES ('${topic}', '${content}', '${user.name}', now(), ${type})`
            db.query(sql, function (err, result, fields) {
                if (err) throw err
                res.redirect(`/list/${result.insertId}`)
            })
        }
    })
})

app.post('/login', (req, res) => {
    const id = req.body.id;
    const password = req.body.password
    User.findOne({"id": id}, (err, user) => { 
        if(!user) {
            return res.redirect("/login")
        }
        user.comparePassword(password, (err, isMatch)=> {
            if(err) console.log("err")
            else if (!isMatch) return res.redirect("/login")
            else {
                user.generateToken((err, usr) => {
                if(err) return res.redirect("/login")
                res.cookie("auth", usr.token).redirect("/test")
                })
            }
        })
    })
    // const id = req.body.id
    // const ps = req.body.password
    // const sql = `SELECT password FROM USER WHERE id = '${id}'`
    // db.query(sql, function (err, result) {
    //     if (err) throw err
    //     const comparePs = result[0].password
    //     bcrypt.compare(ps, comparePs, (err, isMatch) => {
    //         if(err) throw err
    //         if(isMatch == true) {
    //             const token = jwt.sign(id, 'NOVACCINE')
    //             const sql2 = `UPDATE USER SET token='${token}' WHERE id = '${id}'`
    //             db.query(sql2)
    //             res.cookie("auth", token).redirect("/")
    //         } else {
    //             res.json({
    //                 isSuccess : false
    //             })
    //         }
    //     })
    // })
})

app.post('/register', (req, res) => {
    const user = new User(req.body)
    user.save((err, userInfo) => { 
        if(err) return  res.redirect("/register")
        res.redirect("/login")
    })

//below mysql logic
    // const id = req.body.id
    // const ps = req.body.password
    // const name = req.body.name
    // bcrypt.genSalt(saltRounds, (err, salt) => { //genSalt를 사용하여 saltRounds를 보내고, err와 salt를 받아 함수를 실행한다.
    //     if(err) throw err
    //     bcrypt.hash(ps, salt, (err, hash) => { //암호화해주는 핵심 부분 //hash를 통해 비밀번호를 보내고, 위의 함수에서 받은 salt를 보내고, err와 hash를 받아서 아래 로직을 실행하라. 
    //         if(err) throw err //만약 에러가 있따면 err을 주고 넘어가라
    //         const sql = `INSERT INTO USER (id, password, userName) VALUES ('${id}', '${hash}', '${name}')`
    //         db.query(sql)
    //         res.redirect("/")
    //     })
    // })
})

const t = ['전체', '화이자', '모더나', '얀센', '아스트라제네카', '기타백신']

app.get('/type/:d', (req, res) => {
    let sql = ""
    if(req.params.d === '0') {
        sql =`SELECT * FROM post`
    } else {
        sql =`SELECT * FROM post WHERE type = ${req.params.d}`
    }
    db.query(sql, function (err, result, fields) {
        if(err) console.log(err.message)
        res.render("list", {
            result:result,
            t : t[req.params.d]
        })
    });
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
                views : content.views,
                who : content.userName,
                type : t[content.type],
                date : content.date
            })
        } else {
            dontCare(res)
        }
    });
})

app.get("/corona", (req, res) => {
    let p;
    axios.get("https://nip.kdca.go.kr/irgd/cov19stats.do?list=all").then(value => {
        p = convert.xml2json(value.data, {compact:true, space:4})
        const obj = JSON.parse(p)
        axios.get("http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson?serviceKey=9FhgyEw%2BBWwF2TcObOl6PW6u3%2FyqOyJ3d7H8Ur%2FqhHVGDy668fgLWNWZZX7jntQMLYUqEQy%2B5hWxKm87zN4FaA%3D%3D&pageNo=1&numOfRows=10&startCreateDt=20200410&endCreateDt=20200410").then(value => {
            res.render("people", {
                item : obj.response.body.items.item,
                corona : value.data.response.body.items.item
            })
        })
    })
})


db.connect(err => {
    if (err) throw err;
    console.log("Mysql is connected")
})

app.listen(Port, () => {
    console.log(`server is started at ${Port}`)
})