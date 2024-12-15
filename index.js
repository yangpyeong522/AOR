// 운영체제 관련 상수
const exp = require('constants');

// 포트는 3001
const port = process.env.PORT || 3001;
const express = require('express');
const app = express();
//외부 접속허용 설정
const cors = require('cors');
const corsOptions = { origin: 'http://localhost:3001', credentials: true };
app.use(cors(corsOptions));

// DB 선언 구간
//  sequelize 설정 불러오기
const sequelize = require('./sequelize');
// 해설(설명)을 저장하는 모델
const comments = require('./models/comments');
// 개념들 저장하는 모델
const concepts = require('./models/concepts');

// 읽어들이기
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

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
                attributes: ['_id'] 
              });
            trie = new Trie();
            findcomments.forEach(comment => {
                trie.insert(comment._id.toString());
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
        res.render("main.ejs", {one : randomData[0].dataValues._id, two :randomData[1].dataValues._id,three : randomData[2].dataValues._id});
      } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
      }
});
app.get('/write', function(req, res) {
    res.render("write.ejs");
});

const commentschema = Joi.object().keys({
    _id: Joi.number().required(),
    answer: Joi.string().required(),
    testcase: Joi.string().optional().allow('').allow(null)
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
app.post('/write', async function(req, res) {
    const reqid = parseInt(req.body._id);
    try {
        await commentschema.validateAsync(req.body);
        const existingComments = await comments.findOne({ where: { _id: reqid } });
        if (existingComments) {
            return res.status(400).render('error.ejs',{ errorcode: 400, error: '이미 해설이 존재합니다.' });
        } else {
            const options = {
                method: 'GET',
                url: 'https://solved.ac/api/v3/problem/show',
                qs: { problemId: reqid },
                headers: { 'Content-Type': 'application/json' }
            };
            request(options, async function(error, response, solvedac) {
                if (error) {
                    console.log(error);
                    return res.status(400).render('error.ejs',{ errorcode: 400, error: '올바른 값이 아닙니다.' });
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
                                tags.push(solvedac.tags[i].key);
                            }
                        }
                        try {
                            await comments.create({
                                _id: reqid,
                                name: solvedac.titleKo,
                                tearbig: tearbigtemp,
                                tearsmall: tearsmalltemp,
                                answer: req.body.answer,
                                testcase: req.body.testcase,
                                tags: tags
                            });
                            res.redirect('/comment/' + reqid);
                        } catch (e) {
                            console.log('해설 삽입중 오류 발생' + e);
                            return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
                        }
                    } else {
                        return res.status(400).render('error.ejs',{ errorcode: 400, error: '백준에 문제가 발견되지 않았습니다.' });
                    }
                }
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(400).render('error.ejs',{ errorcode: 400, error: '해설은 필수적인 입력상황입니다.' });
    }
});
app.get('/comment/:id', async function(req, res) {
    try {
        const reqid = parseInt(req.params.id);
        if (isNaN(reqid)) {
            //404.ejs작업
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        const result = await comments.findOne({ where: { _id: reqid } });
        if (!result) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        let answer = result.answer || '';
        answer = answer.replace(/\\r/g, "");
        answer = answer.replace(/\\n/g, "<br>");
        answer = answer.replace(/\r/g, "");
        answer = answer.replace(/\n/g, "<br>");
        result.answer = answer;

        let testcase = result.testcase || '';
        testcase = testcase.replace(/\\r/g, "");
        testcase = testcase.replace(/\\n/g, "<br>");
        testcase = testcase.replace(/\r/g, "");
        testcase = testcase.replace(/\n/g, "<br>");
        result.testcase = testcase;
        return res.render("comment.ejs", { comment: result });
    } catch (error) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    };
});
app.get('/edit/:id', async function(req, res) {
    try {
        const reqid = parseInt(req.params.id, 10);
        if (isNaN(reqid)) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        const result = await comments.findOne({ where: { _id: reqid } });
        if (!result) {
            return res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
        }
        return res.render("edit.ejs", { edits: result });
    } catch (e) {
        console.error(error);
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    }
});
const commentupdateschema = Joi.object().keys({
    _id: Joi.number().required(),
    tears: Joi.string().required(),
    name: Joi.string().required(),
    answer: Joi.string().required(),
    testcase: Joi.string().optional().allow('').allow(null)
});
app.put('/edit', async function(req, res) {
    try {
        const reqid = parseInt(req.body._id);
        await commentupdateschema.validateAsync(req.body);
        const options = {
            method: 'GET',
            url: 'https://solved.ac/api/v3/problem/show',
            qs: { problemId: reqid },
            headers: { 'Content-Type': 'application/json' }
        };
        request(options, async function(error, response, solvedac) {
            if (error) {
                console.log(error);
                return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
            }
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
                        tags.push(solvedac.tags[i].key);
                    }
                }

                const [updatedRowsCount] = await comments.update({
                    name: solvedac.titleKo,
                    tearbig: tearbigtemp,
                    tearsmall: tearsmalltemp,
                    answer: req.body.answer,
                    testcase: req.body.testcase,
                    tags: tags
                }, { where: { _id: reqid } });
                if (!updatedRowsCount) {
                    return res.status(400).render('error.ejs',{errorcode : 400, error : "변경된 값이 없습니다."});
                }
                console.log("업데이트 되었습니다");
                return res.redirect('/comment/' + reqid);
            } else {
                return res.status(400).render('error.ejs',{errorcode : 400, error : "그러한 문제는 없습니다."});
            }
        });
    } catch (e) {
        if (e.isJoi) {
            return res.status(400).render('error.ejs',{errorcode : 400, error : "올바른 값이 아닙니다."});
        }
        return res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
    }
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
            order: [['_id', 'ASC']]
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

app.use((req, res, next) => {
    res.status(404).render('error.ejs',{errorcode : 404, error : "요청한 페이지가 존재하지 않습니다."});
  });
  
  // 500 에러 핸들링 미들웨어
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error.ejs',{errorcode : 500, error : "서버 내부에 오류가 발생했습니다."});
  });