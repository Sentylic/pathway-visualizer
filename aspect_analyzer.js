/**
 * Created by chamod on 4/29/18.
 */
var express = require('express');
var util = require("./util");

module.exports = {

    findPopularAspects: function (reviews) {
        return new Promise(function (resolve, reject) {
            var obj = [];
            var aspect_obj = {};
            var promises = [];

            for (j in reviews) {
                promises.push(util.extractAspects(reviews[j].text).then(function (aspects) {
                    for (i in aspects) {
                        var aspect = aspects[i]; //.trim(" ").trim(".").trim(",").trim("'").toLowerCase();
                        if (aspect[0] != '') {
                            if (aspect[0] in aspect_obj == false) {
                                aspect_obj[aspect[0]] = 1;
                            } else {
                                aspect_obj[aspect[0]] += 1;
                            }
                        }
                    }
                }, function (err) {
                    console.log(err)
                }));
            }

            Promise.all(promises).then(function () {
                for (i in aspect_obj) {
                    obj.push({
                        aspect : i,
                        count : aspect_obj[i],
                        percentage: Math.floor(Math.random() * 100), // replace
                    });
                }

                obj.sort(function (a, b) {
                    return b.count - a.count;
                });
                // console.log(aspect_obj);
                resolve(obj.slice(0, Math.min(10, obj.length)));
            }).catch(function (err) {
                reject(err);
            });
        });
    },

};