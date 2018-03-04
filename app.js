var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var compression = require('compression');
var fs = require('fs');

// Database Stuff
var db;
if ((!(fileExists(__dirname + '/database/store.db'))))
{
    db = require('./database/createDB.js');
    db.createDB(__dirname + '/database/store.db');
}
var sqlite3 = require('sqlite3');
db = new sqlite3.Database(__dirname + '/database/store.db');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Local variables - these will be available to all the templates rendered within the application
app.locals.title = 'Story Outliner';

// Use statements
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(compression()); // compress all requests

// output pretty html
app.locals.pretty = true;

// separating routes
var workRouter = require('./routes/workRouter');
app.use('/work', workRouter);

// Helpers
function errorHandler(response, error) {
    if (app.get('env') === 'development') {
        response.status(500).send(error.stack);
    }
    else
    {
        response.status(500).send("Please see that you have the proper database structure!")
    }
}

function fileExists(filePath) // used to check if the database file exists
{
    try
    {
        return fs.statSync(filePath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

function initNav() {
    // start adding works to navigation
    function worksToNavigation(callback){
        db.all("SELECT * FROM works ORDER BY updated_at DESC LIMIT 4", function(err, all)
        {
            callback(err, all);
        });
    }

    worksToNavigation(function(err, all){
        if(!err)
            app.locals.works_for_nav = all;
        else
            app.locals.works_for_nav = {};
    });
    // end adding works to navigation
}

initNav() // initialize navigation

// routing
app.get('/', function(req, res) {
    // TODO needs to be in every GET route : find solution
    initNav() // refresh navigation

    db.all("SELECT * FROM works ORDER BY updated_at DESC", function(err, works) {
        if (err != null)
            errorHandler(res, err);
        else
            res.render('index',
                { works }
            );
    });
});

app.listen(3530);