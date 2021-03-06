/**
 * Created by chamod on 4/29/18.
 */
var express = require('express');
var router = express.Router();
var util = require("./util");
var request = require('request');

var PythonShell = require('python-shell');

const { check, validationResult } = require('express-validator/check');

const ASPECTS_HOST = '192.168.8.102';
const ASPECTS_PORT = 5000;

router.get('/scrape', function(req, res) {
    var example_restaurant_review = 'https://www.tripadvisor.com/Restaurant_Review-g304141-d9694624-Reviews-Rithu_Restaurant-Sigiriya_Central_Province.html';
    var example_hotel_review = 'https://www.tripadvisor.com/Hotel_Review-g304141-d613020-Reviews-Hotel_Sigiriya-Sigiriya_Central_Province.html';
    var example_attraction_review = 'https://www.tripadvisor.com/Hotel_Review-g304141-d613020-Reviews-Hotel_Sigiriya-Sigiriya_Central_Province.html';

    max_reviews = req.query.max_reviews || 20
    link = req.query.link || example_restaurant_review
    output_file = req.query.output_file // may or may note be undefined

    util.scrapeTripAdvisor(link, max_reviews, output_file).then(function(data) {
        res.send(data);
    }, function(err) {
        res.send(err)
    });
});

router.get('/', function(req, res) {
    util.readJsonFiles('./Data').then(function(json_files) {
        res.render('aspects', { files: json_files, req: req });
    });
});

router.post('/findPopularAspects', [
    check('message')
    .isLength({ min: 1 })
    .withMessage('Review is required'),
], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('aspects', {
            data: req.body,
            errors: errors.mapped(),
        })
    }

    request("http://127.0.0.1:5001/" + req.body.message, (err, response, body)=> {
        if (err){
            res.send("Please make sure the Aspect Extraction server is running in port 127.0.0.1:5001");
        }

        aspects = []
        aspect_terms = body.split(';');

        // put a random sentiment for now (aspect based sentiment part is not implemented yet)
        for(var i in aspect_terms){
            aspects.push({
                aspect : aspect_terms[i],
                sentiment: Math.floor(Math.random() * (2 - (-1))) + (-1)
            });
        }

        // send with sample data json
        util.readJsonFiles('./Data').then(function (json_files) {
            return res.render('aspects', {
                data: req.body,
                aspects: aspects,
                files: json_files,
                req: req
            })
        });
    });

})


router.post('/findReviewAspects', function(req, res) {
    util.extractAspects(req.body.review).then(function(aspects) {
        var obj = [];

        for (a in aspects) {
            obj.push({
                aspect: aspects[a][0],
                sentiment: aspects[a][1],
            });
        }
        return res.send(obj);
    }, function(err) {
        return res.send(err);
    });

    // fs.readFile('./tripadvisor-scraper/' + req.body.place + ".json", function (err, review_data) {
    //     if (err) {
    //         return res.send(err);
    //     }
    //     review_data = JSON.parse(review_data);
    //
    //     aspect_analyzer.findPopularAspects(review_data).then(function (data) {
    //         var obj = {
    //             aspects : data,
    //             reviews : review_data
    //         };
    //         return res.send(obj);
    //         console.log(data);
    //     }, function (err) {
    //         console.log(err);
    //         return res.send(err);
    //     });
    //     // console.log(temp);
    // })
});

router.post('/findAspects', [
    check('message')
        .isLength({min: 1})
        .withMessage('Review is required'),
], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('aspects', {
            data: req.body,
            errors: errors.mapped(),
        })
    }

    util.extractAspects(req.body.message).then(function(aspects) {
        var obj = [];

        for (a in aspects) {
            obj.push({
                aspect: aspects[a][0],
                sentiment: aspects[a][1],
            });
        }

        util.readJsonFiles('./Data').then(function (json_files) {
            return res.render('aspects', {
                data: req.body,
                aspects: obj,
                files: json_files, req: req
            })
        });

    }, function(err) {
        return res.render('aspects', {
            data: req.body,
            errors: err,
        })
    });
})


//export this router to use in our index.js
module.exports = router;