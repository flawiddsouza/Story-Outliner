var express = require('express');

var router = express.Router();

var app = express();

// Database Stuff
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('database/store.db');
db.run("PRAGMA foreign_keys = ON"); // enable foreign key support


// -------------------------
// Helpers
// -------------------------

function errorHandler(response, error) {
    if (app.get('env') === 'development')
        response.status(500).send(error.stack);
    else
        response.status(500).send("Datebase Error");
}

function removeEmptyProps(fields)
{
    for (var key in fields) {
        if (fields[key] == "" || fields[key] === null || fields[key] === undefined) {
            delete fields[key];
        }
    }
}

function insertQuery(fields, table_name) {
    removeEmptyProps(fields);

    var keys = Object.keys(fields).join(', ');

    var keys_qmarks = [];
    Object.keys(fields).forEach(function(key) {
        keys_qmarks.push("?");
    });
    keys_qmarks = keys_qmarks.join(', ');

    Object.values = obj => Object.keys(obj).map(key => obj[key]);
    var values = Object.values(fields);

    if(keys.length > 0)
        db.run(`INSERT into ${table_name}(${keys}) VALUES (${keys_qmarks})`, values);
}

function updateQuery(fields, field_id, table_name) {
    removeEmptyProps(fields);

    var keys = [];
    Object.keys(fields).forEach(function(key) {
        keys.push(key+"=?");
    });
    keys.push('updated_at=CURRENT_TIMESTAMP');
    keys = keys.join(', ');

    Object.values = obj => Object.keys(obj).map(key => obj[key]);
    var values = Object.values(fields);
    values.push(field_id); // add field_id to the end of the array

    if(keys.length > 0)
    {
        db.run(`UPDATE ${table_name} SET ${keys} WHERE id=?`, values);
        // console.log(`db.run("UPDATE ${table_name} SET ${keys} WHERE id=?", ${values})`); // uncomment if you want to see the formed query
    }
}


// -------------------------
// Work routes
// -------------------------

// GET Work
router.get('/:workid', function(req, res) {
    db.get("SELECT * FROM works WHERE id="+ req.params.workid, function(err, work) {
        if (err != null)
            errorHandler(res, err);
        else
            db.all("SELECT * FROM chapters WHERE work_id=? ORDER BY chapter_number", req.params.workid, function(err, chapters) {
                if(err != null)
                    errorHandler(res, err);
                else
                    db.all("SELECT * FROM characters WHERE work_id=? ORDER BY (character_index IS NULL), character_index", req.params.workid, function(err, characters) {
                        if(err != null)
                            errorHandler(res, err);
                        else
                            db.all("SELECT * FROM settings WHERE work_id=?", req.params.workid, function(err, settings) {
                                if(err != null)
                                    errorHandler(res, err);
                                else
                                    res.render('work',
                                        { page_title : work['work_name'], work, chapters, characters, settings }
                                    );
                            });
                    });
            });
    });
});

// POST Work
router.post('/add', function (req, res) {
    var fields = {
        work_name : req.body.title,
        work_description : req.body.description
    };
    insertQuery(fields, 'works');
    res.redirect('/');
});

// PUT Work - express is causing trouble when i use put instead of post
router.post('/:workid/update', function (req, res) {
    var fields = {
        work_name : req.body.work_name,
        work_description : req.body.work_description,
        work_outline : req.body.work_outline
    };
    updateQuery(fields, req.params.workid, 'works');
    res.redirect('/work/'+ req.params.workid);
});

// DELETE Chapter for a selected Work
router.post('/:workid/delete', function (req, res) {
    db.run("DELETE FROM works WHERE id=?", req.params.workid);
    res.redirect('/');
});


// -------------------------
// Chapter routes
// -------------------------

// GET Chapter for a selected Work
router.get('/:workid/chapter/:chapterid', function(req, res) {
    db.all("SELECT * FROM scenes WHERE chapter_id=? ORDER BY scene_number", req.params.chapterid, function(err, scenes) {
        if(err != null)
            errorHandler(res, err);
        else
            db.get("SELECT chapters.id, chapter_number, chapter_name, chapter_description, chapter_outline, work_id, work_name FROM chapters, works WHERE chapters.work_id = works.id AND chapters.id=?", req.params.chapterid, function(err, chapter) {
                if(err != null)
                {
                    errorHandler(res, err);
                }
                else
                {
                    var page_title = "Chapter " + chapter['chapter_number'] +": "+ chapter['chapter_name'] +" - "+ chapter['work_name'];
                    res.render('chapter',
                        { page_title, chapter, scenes }
                    );
                }
            });
    });
});

// POST Chapter for a selected Work
router.post('/:workid/chapter/add', function (req, res) {
    var fields = {
        chapter_number : req.body.chapter_number,
        chapter_name : req.body.chapter_name,
        chapter_description : req.body.chapter_description,
        work_id : req.params.workid
    };
    insertQuery(fields, 'chapters');
    res.redirect('/work/'+ req.params.workid);
});

// PUT Chapter for a selected Work (the if code makes me cry tears of blood)
router.post('/:workid/chapter/:chapterid/update', function (req, res) {
    var fields = { 
        chapter_number : req.body.chapter_number, 
        chapter_name : req.body.chapter_name, 
        chapter_description : req.body.chapter_description, 
        chapter_outline : req.body.chapter_outline 
    };
    updateQuery(fields, req.params.chapterid, 'chapters');
    res.redirect('/work/'+ req.params.workid);
});

// DELETE Chapter for a selected Work
router.post('/:workid/chapter/:chapterid/delete', function (req, res) {
    db.run("DELETE FROM chapters WHERE id=?", req.params.chapterid);
    res.redirect('/work/'+ req.params.workid);
});


// -------------------------
// Scene routes
// -------------------------

// GET Scene for a selected Chapter
router.get('/:workid/chapter/:chapterid/scene/:sceneid', function(req, res) {
    db.get("SELECT scenes.id, scene_number, scene_description, scene_outline, chapter_id, chapter_number, chapter_name, chapters.work_id, works.work_name FROM scenes, chapters, works WHERE scenes.chapter_id = chapters.id AND chapters.work_id = works.id AND scenes.id=?", req.params.sceneid, function(err, scene) {
        if(err != null)
            errorHandler(res, err);
        else
            db.all("SELECT scene_characters.id, character_id, characters.character_name FROM scene_characters, characters WHERE scene_characters.character_id = characters.id AND scene_id=? ORDER BY (character_index IS NULL), character_index", req.params.sceneid, function(err, scene_characters) {
                if(err != null)
                    errorHandler(res, err);
                else
                    db.all("SELECT scene_settings.id, setting_id, settings.setting_name FROM scene_settings, settings WHERE scene_settings.setting_id = settings.id AND scene_id=?", req.params.sceneid, function(err, scene_settings) {
                        if(err != null)
                            errorHandler(res, err);
                        else
                            db.all("SELECT id, character_name FROM characters WHERE work_id=? AND not exists (SELECT character_id FROM scene_characters WHERE scene_characters.character_id = characters.id) ORDER BY (character_index IS NULL), character_index", req.params.workid, function(err, characters) {
                                if(err != null)
                                    errorHandler(res, err);
                                else
                                    db.all("SELECT id, setting_name FROM settings WHERE work_id=? AND not exists (SELECT setting_id FROM scene_settings WHERE scene_settings.setting_id = settings.id)", req.params.workid, function(err, settings) {
                                        if(err != null)
                                        {
                                            errorHandler(res, err);
                                        }
                                        else
                                        {
                                            var page_title = "Chapter "+ scene['chapter_number'] +": "+ scene['chapter_name'] +" - "+ "Scene "+ scene['scene_number'] +" – "+ scene['work_name'];
                                            res.render('scene',
                                                { page_title, scene, scene_characters, scene_settings, characters, settings }
                                            );
                                        }
                                    });
                            });
                    });
            });
    });
});

// POST Scene for a selected Chapter
router.post('/:workid/chapter/:chapterid/scene/add', function (req, res) {
    var fields = {
        scene_number : req.body.scene_number,
        scene_description : req.body.scene_description,
        chapter_id : req.params.chapterid
    };
    insertQuery(fields, 'scenes');
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid);
});

// PUT Scene for a selected Chapter
router.post('/:workid/chapter/:chapterid/scene/:sceneid/update', function (req, res) {
    var fields = {
        scene_number : req.body.scene_number,
        scene_description : req.body.scene_description,
        scene_outline : req.body.scene_outline
    };
    updateQuery(fields, req.params.sceneid, 'scenes');
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid);
});

// DELETE Scene for a selected Chapter
router.post('/:workid/chapter/:chapterid/scene/:sceneid/delete', function (req, res) {
    db.run("DELETE FROM scenes WHERE id=?", req.params.sceneid);
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid);
});

// Scene_characters & scene_settings related //

// POST Character for a selected Scene
router.post('/:workid/chapter/:chapterid/scene/:sceneid/character/add', function (req, res) {
    var fields = {
        scene_id : req.params.sceneid,
        character_id : req.body.character_id
    };
    insertQuery(fields, 'scene_characters');
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid +'/scene/'+ req.params.sceneid);
});

// DELETE Character for a selected Scene
router.post('/:workid/chapter/:chapterid/scene/:sceneid/character/delete', function (req, res) {
    db.run("DELETE FROM scene_characters WHERE id=?", req.body.character_id);
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid +'/scene/'+ req.params.sceneid);
});

// POST Setting for a selected Scene
router.post('/:workid/chapter/:chapterid/scene/:sceneid/setting/add', function (req, res) {
    var fields = {
        scene_id : req.params.sceneid,
        setting_id : req.body.setting_id
    };
    insertQuery(fields, 'scene_settings');
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid +'/scene/'+ req.params.sceneid);
});

// DELETE Setting for a selected Scene
router.post('/:workid/chapter/:chapterid/scene/:sceneid/setting/delete', function (req, res) {
    db.run("DELETE FROM scene_settings WHERE id=?", req.body.setting_id);
    res.redirect('/work/'+ req.params.workid +'/chapter/'+ req.params.chapterid +'/scene/'+ req.params.sceneid);
});


// -------------------------
// Character routes
// -------------------------

// GET Character for a selected Work
router.get('/:workid/character/:characterid', function(req, res) {
    db.get("SELECT characters.id, character_name, character_description, character_outline, work_id, work_name FROM characters, works WHERE characters.work_id = works.id AND characters.id=?", req.params.characterid, function(err, character) {
        if(err != null)
            errorHandler(res, err);
        else
            db.all("SELECT * FROM character_fields WHERE character_id=?", req.params.characterid, function(err, character_fields) {
                if(err != null)
                {
                    errorHandler(res, err);
                }
                else
                {
                    var page_title = character['character_name'] +" - "+ character['work_name'];
                    res.render('character',
                        { page_title, character, character_fields }
                    );
                }
            });
    });
});

// POST Character for a selected Work
router.post('/:workid/character/add', function (req, res) {
    var fields = {
        character_name : req.body.character_name,
        character_description : req.body.character_description,
        character_index: req.body.character_index,
        work_id : req.params.workid
    };
    insertQuery(fields, 'characters');
    res.redirect('/work/'+ req.params.workid);
});

// PUT Character for a selected Work
router.post('/:workid/character/:characterid/update', function (req, res) {
    var fields = {
        character_name : req.body.character_name,
        character_description : req.body.character_description,
        character_outline : req.body.character_outline,
        character_index: req.body.character_index
    };
    updateQuery(fields, req.params.characterid, 'characters');
    res.redirect('/work/'+ req.params.workid);
});

// DELETE Character for a selected Work
router.post('/:workid/character/:characterid/delete', function (req, res) {
    db.run("DELETE FROM characters WHERE id=?", req.params.characterid);
    res.redirect('/work/'+ req.params.workid);
});

// POST Character Field for a selected Character
router.post('/:workid/character/:characterid/field/add', function (req, res) {
    var fields = {
        field_name : req.body.field_name,
        field_value : req.body.field_value,
        character_id : req.params.characterid
    };
    insertQuery(fields, 'character_fields')
    res.redirect('/work/'+ req.params.workid +'/character/'+ req.params.characterid);
});

// PUT Character Field for a selected Character
router.post('/:workid/character/:characterid/field/:characterfieldid/update', function (req, res) {
    var fields = {
        field_name : req.body.field_name,
        field_value : req.body.field_value
    }
    updateQuery(fields, req.params.characterfieldid, 'character_fields');
    res.redirect('/work/'+ req.params.workid +'/character/'+ req.params.characterid);
});

// DELETE Character Field for a selected Character
router.post('/:workid/character/:characterid/field/:characterfieldid/delete', function (req, res) {
    db.run("DELETE FROM character_fields WHERE id=?", req.params.characterfieldid);
    res.redirect('/work/'+ req.params.workid +'/character/'+ req.params.characterid);
});


// -------------------------
// Setting routes
// -------------------------

// GET Setting for a selected Work
router.get('/:workid/setting/:settingid', function(req, res) {
    db.get("SELECT settings.id, setting_name, setting_description, setting_outline, work_id, work_name FROM settings, works WHERE settings.work_id = works.id AND settings.id=?", req.params.settingid, function(err, setting) {
        if(err != null)
        {
            errorHandler(res, err);
        }
        else
        {
            var page_title = setting['setting_name']+ " - "+ setting['work_name'];
            res.render('setting',
                { page_title, setting }
            );
        }
    });
});

// POST Setting for a selected Work
router.post('/:workid/setting/add', function (req, res) {
    var fields = {
        setting_name : req.body.setting_name,
        setting_description : req.body.setting_description,
        work_id : req.params.workid
    };
    insertQuery(fields, 'settings');
    res.redirect('/work/'+ req.params.workid);
});

// PUT Setting for a selected Work
router.post('/:workid/setting/:settingid/update', function (req, res) {
    var fields = {
        setting_name : req.body.setting_name,
        setting_description : req.body.setting_description,
        setting_outline : req.body.setting_outline
    };
    updateQuery(fields, req.params.settingid, 'settings');
    res.redirect('/work/'+ req.params.workid);
});

// DELETE Setting for a selected Work
router.post('/:workid/setting/:settingid/delete', function (req, res) {
    db.run("DELETE FROM settings WHERE id=?", req.params.settingid);
    res.redirect('/work/'+ req.params.workid);
});

module.exports = router;