var express = require('express'), mysql = require('mysql'), bodyParser = require('body-parser');
var app = express();

var pool = mysql.createPool(require('./config.json'));

var server = app

    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .listen(8082, function () {
        var host = server.address().address
        var port = server.address().port

        console.log("Server listing at http://%s:%s", host, port)
    });

function returnAds(req, res) {

    var mysqlquery = 'SELECT r1.id, url, image, title, description from adverts as r1 JOIN (SELECT (RAND() * (SELECT MAX(id) FROM adverts)) AS id) as r2 WHERE r1.id >= r2.id ORDER BY r1.id ASC LIMIT 1 ';
    //profile available

    if (req.body.profile != null) {

        var profile = JSON.parse(req.body.profile);
        if (profile != null) {
            var gender = profile.userData.sex;
            mysqlquery = 'SELECT id, url, image, title, description, valid1key, valid1value, valid1Combination from adverts WHERE (valid0key="gender" AND valid0value="' + gender + '") OR (valid0key IS NULL OR valid0key = "")';
        }
    }

    function returnData(error, results, fields) {
        if (error) throw error;

        if (results.length > 0) {

            if (profile != null) {

                var attributes = profile.userData.attributes;

                var array = [];

                for (var i = 0; i < results.length; i++) {
                    if (results[i].valid1value != null && results[i].valid1Combination != null && results[i].valid1Combination.toLowerCase() != "or") {

                        if (results[i].valid1key == "attributes") {
                            var values = results[i].valid1value.split(",");

                            var contains = false;
                            for (var key in profile.userData.attributes) {
                                if (profile.userData.attributes[key]) {
                                    if (values.indexOf(key) >= 0) {
                                        contains = true;
                                        break;
                                    }
                                }
                            }

                            if (contains) {
                                array.push({
                                    id: results[i].id,
                                    url: results[i].url,
                                    image: results[i].image,
                                    title: results[i].title,
                                    description: results[i].description
                                });
                            }
                        }
                    } else {
                        array.push({
                            id: results[i].id,
                            url: results[i].url,
                            image: results[i].image,
                            title: results[i].title,
                            description: results[i].description
                        })
                    }
                    res.json(array[Math.floor(Math.random() * array.length)]);
                }
            } else {
                res.json({
                    id: results[0].id,
                    url: results[0].url,
                    image: results[0].image,
                    title: results[0].title,
                    description: results[0].description
                });
            }
        } else {
            res.json({});
        }
    }

    pool.query(mysqlquery, [], returnData);
}


app.post("/adverts", returnAds).get("/adverts", returnAds)