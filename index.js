// 운영체제 관련 상수
const exp = require('constants');

// 포트는 3001
const port = process.env.PORT || 3001;
const express = require('express');
const app = express();
const dayjs = require('dayjs');
//외부 접속허용 설정
const cors = require('cors');
const corsOptions = { origin: 'http://localhost:3001', credentials: true };
// const favicon = require('serve-favicon');
app.use(cors(corsOptions));
app.set('trust proxy', true);
app.locals.formatDate = date =>
    dayjs(date).format('YYYY-MM-DD HH:mm:ss');

// DB 선언 구간
//  sequelize 설정 불러오기
const sequelize = require('./sequelize');
// 해설(설명)을 저장하는 모델
const version = require('./models/version');
// 유저들 저장하는 모델
const yangpyeong_user = require('./models/yangpyeong_user');
// 대표 문제 저장하는 모델
const comments = require('./models/comments');

version.belongsTo(comments, {
    foreignKey: 'problem_id',    // version 테이블의 FK
    targetKey: 'problem_id',     // comments 테이블의 PK
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
  
// version -> yangpyeong_user (user)
version.belongsTo(yangpyeong_user, {
    foreignKey: 'user',          // version 테이블의 FK
    targetKey: 'username',       // yangpyeong_user 테이블의 PK
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

comments.hasMany(version, {
  foreignKey: 'problem_id',
  sourceKey: 'problem_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

yangpyeong_user.hasMany(version, {
  foreignKey: 'user',
  sourceKey: 'username',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// 읽어들이기
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
// app.use(favicon(__dirname + '/public/images/favicon.ico'));

const Joi = require('joi');

// API 요청함수
const request = require('request');

// 기타 관리 함수
const { isNull } = require('util');
const { resourceLimits } = require('worker_threads');
const { type } = require('os');

// method(매소드) put delete 사용가능 설정
const methodOverride = require('method-override');
const { create } = require('domain');
app.use(methodOverride('_method'));

class TireNode {
    constructor () {
        this.children = {};
        this.endOfWord = false;
        this.problems = [];
    }
}
class Trie {
    constructor () {
        this.root = new TireNode();
    }
    insert(number){
        let current = this.root;
        for (let digit of number){
            if(!current.children[digit]){
                current.children[digit] = new TireNode();
            }
            current = current.children[digit];
            current.problems.push(number);
        }
        current.endOfWord = true;
    }
    searchPrefix(prefix){
        let current = this.root;
        for(let digit of prefix){
            if(!current.children[digit]){
                return [];
            }
            current = current.children[digit];
        }
        return current.problems.slice(0,5);
    }
}
let trie;
// DB 실제 연결 후 서버 열기
const dbconn = async() => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false });
        console.log('모델이 데이터베이스와 동기화되었습니다.');
        app.listen(port, async function() {
            console.log('서버가 가동되었습니다. 포트는 ' + port + '입니다.');
            const findcomments = await comments.findAll({
                attributes: ['problem_id'] 
              });
            trie = new Trie();
            findcomments.forEach(comment => {
                trie.insert(comment.problem_id.toString());
            });
        });
    } catch (e) {
        console.log('데이터베이스 연결 실패(' + e + ')');
    }
}
dbconn();

app.get('/', async function(req, res) {
    try {
        const randomData = await comments.findAll({
          order: [
            sequelize.literal('RAND()') // MySQL 랜덤 정렬
          ],
          limit: 3 // 필요한 개수만큼 가져오기
        });
        res.render("main.ejs", {one : randomData[0].dataValues.problem_id, two :randomData[1].dataValues.problem_id,three : randomData[2].dataValues.problem_id});
      } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
      }
});
app.get('/write', function(req, res) {
    res.render("write.ejs");
});

const levelMap = [
    { big: "Unrated", small: "0" },
    { big: "Bronze", small: "Ⅴ" }, { big: "Bronze", small: "Ⅳ" }, { big: "Bronze", small: "Ⅲ" },
    { big: "Bronze", small: "Ⅱ" }, { big: "Bronze", small: "Ⅰ" },
    { big: "Silver", small: "Ⅴ" }, { big: "Silver", small: "Ⅳ" }, { big: "Silver", small: "Ⅲ" },
    { big: "Silver", small: "Ⅱ" }, { big: "Silver", small: "Ⅰ" },
    { big: "Gold", small: "Ⅴ" }, { big: "Gold", small: "Ⅳ" }, { big: "Gold", small: "Ⅲ" },
    { big: "Gold", small: "Ⅱ" }, { big: "Gold", small: "Ⅰ" },
    { big: "Platinum", small: "Ⅴ" }, { big: "Platinum", small: "Ⅳ" }, { big: "Platinum", small: "Ⅲ" },
    { big: "Platinum", small: "Ⅱ" }, { big: "Platinum", small: "Ⅰ" },
    { big: "Diamond", small: "Ⅴ" }, { big: "Diamond", small: "Ⅳ" }, { big: "Diamond", small: "Ⅲ" },
    { big: "Diamond", small: "Ⅱ" }, { big: "Diamond", small: "Ⅰ" },
    { big: "Ruby", small: "Ⅴ" }, { big: "Ruby", small: "Ⅳ" }, { big: "Ruby", small: "Ⅲ" },
    { big: "Ruby", small: "Ⅱ" }, { big: "Ruby", small: "Ⅰ" }
];

app.get('/comment/version/:id/:verId', async (req, res) => {
    const commentId = parseInt(req.params.id);
    const versionId = parseInt(req.params.verId);
    try {
        const latest = await version.findOne({
            where: { problem_id: commentId , version : versionId },
            order: [['version', 'DESC']],
            include: [ comments ]    // 자동으로 problem_id 로 JOIN
          });
        if (!latest) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        latest.isversion = true;
        return res.render("comment.ejs", { version : latest ,comments : latest.comment.dataValues});
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});

app.get('/comment/:id', async function(req, res) {
    try {
        const reqid = parseInt(req.params.id);
        const latest = await version.findOne({
            where: { problem_id: reqid },
            order: [['version', 'DESC']],
            include: [ comments ]    // 자동으로 problem_id 로 JOIN
          });
        if (!latest) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }

        return res.render("comment.ejs", { version : latest ,comments : latest.comment.dataValues});
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});

app.get('/edit/version/:id/:verId', async (req, res) => {
    const commentId = parseInt(req.params.id);
    const versionId = parseInt(req.params.verId);
    try {
        const latest = await version.findOne({
            where: { problem_id: commentId , version : versionId },
            order: [['version', 'DESC']],
            include: [ comments ]    // 자동으로 problem_id 로 JOIN
          });
        if (!latest) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        latest.isversion = true;
        return res.render("edit.ejs", { version : latest ,comments : latest.comment.dataValues});
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});

app.get('/finder', function(req, res) {
    const prefix = req.query.prefix || '';
    if (!prefix) {
        return res.json([]);
    } 
    return res.json(trie.searchPrefix(req.query.prefix));
});

app.get('/api/comments', async function(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // 필요한가?
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await comments.findAndCountAll({
            offset: offset,
            limit: limit,
            order: [['problem_id', 'ASC']]
          });
        const totalPages = Math.ceil(count / limit);
        res.send({ currentPage : page , totalPages : totalPages , totalItems : count , items : rows});
    } catch (err) {
        console.error(err);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 오류가 발생했습니다."});
    }
});

app.get('/comments', async function(req, res) {
    res.render("comments.ejs");
});

app.post('/search', function(req,res){
    res.redirect("/comment/"+req.body.searcher);
});

var bojCheck = (probleminputer) => {
    const options = {
        method: 'GET',
        url: 'https://solved.ac/api/v3/problem/show',
        qs: { problemId: parseInt(probleminputer) },
        headers: { 'Content-Type': 'application/json' }
    };
    return new Promise((resolve, reject) => {
    request(options, async function(error, response, solvedac) {
        if (error) {
            console.log(error);
            return reject({ status: 400, message: '올바른 문제번호를 입력하세요.' });
        } else {
            if (solvedac != "Not Found") {
                let tearbigtemp = "Unknown";
                let tearsmalltemp = "Unknown";
                solvedac = JSON.parse(solvedac);
                if (levelMap[solvedac.level]) {
                    ({ big: tearbigtemp, small: tearsmalltemp } = levelMap[solvedac.level]);
                }
                let tags = [];
                if (solvedac.tags) {
                    for (var i = 0; i < solvedac.tags.length; i++) {
                        tags.push(solvedac.tags[i].displayNames[0].name);
                    }
                }
                resolve({
                    _id: parseInt(probleminputer),
                    name: solvedac.titleKo,
                    tearbig: tearbigtemp,
                    tearsmall: tearsmalltemp,
                    tags
                });
            } else {
                return reject({ status: 404, message: '백준에 문제가 발견되지 않았습니다.' });
            }
        }
    });
    });
}

app.post('/api/rightproblem',async (req,res)=>{
    const {probleminputer} = req.body;
    try {
        const existingComments = await comments.findOne({ where: { problem_id : parseInt(probleminputer) } });

        let checked = await bojCheck(probleminputer);
        checked.existingComments = existingComments;
        return res.json(checked);
    } 
    catch (e) {
        console.log(e);
        return res.status(e.status || 500).json({  error: e.message ||'서버에 내부적인 오류가 발생했습니다.' });
    }
});

app.post('/api/version', async (req, res) => {
    const { problem_id, doc } = req.body;

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip.includes(',')) {
        ip = ip.split(',')[0];
    }
    ip = ip.trim();
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    console.log(ip ,problem_id,doc);
    // 유효성 검사
    if(!doc){
        return res.status(400).json({  error: '해설이 비어져있습니다.' });
    }
    // 다시 조회
    // version으로 새로 작성
    // 존재하지 않으면 version을 새로 작성하고 comments의 값을 새로 작성함
    // 존재하면 version을 새로 작성하고 comments의 값을 업데이트함
    try {
        const checked = await bojCheck(problem_id);
        const [instance, created] = await comments.upsert({
            problem_id : checked._id,
            title : checked.name,
            tearsmall : checked.tearsmall,
            tearbig : checked.tearbig,
            tags : checked.tags.toString(),
        });
        const versionInstance = await version.create({
          problem_id : checked._id,
          ip,
          user : null,
          doc
        });
        // 생성된 PK 값
        if(created){
            trie.insert(problem_id.toString());
        }
        console.log(versionInstance.version);
        return res.status(201).json({ version: versionInstance.problem_id });
      } catch (e) {
        console.log(e);
        return res.status(e.status || 500).json({  error: e.message ||'서버에 내부적인 오류가 발생했습니다.' });
      }
});

app.get('/history/:id', async (req,res) => {
    try {
        const reqid = parseInt(req.params.id);
        const commenta = await comments.findOne({
            where: { problem_id: reqid }
          });
          if (!commenta) {
            return res.status(404).send('댓글이 없습니다.');
          }
          
          const latestVersion = await commenta.getVersions({
            order: [['when', 'DESC']]
          });
          const comment = commenta.get({ plain: true });
          const versions = latestVersion.map(v => v.get({ plain: true }));
          return res.render("history.ejs",{
            comments : comment ,
            version : versions
          });
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});

app.get('/user/:id', async function(req, res) {
    try {
        const reqid = req.params.id;
        const alluserDoc = await version.findAll({
            where: { ip : reqid },
            order: [['when', 'DESC']],
            include: [ comments ]    // 자동으로 problem_id 로 JOIN
          });
        if (!alluserDoc) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        console.log(alluserDoc)
        return res.render("user.ejs", { myip:reqid,version : alluserDoc });
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});

app.use((req, res, next) => {
    res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
});