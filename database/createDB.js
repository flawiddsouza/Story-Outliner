exports.createDB = function(db_name)
{
    // Database Stuff
    var sqlite3 = require('sqlite3');
    var db = new sqlite3.Database(db_name);

    db.run(`
        CREATE TABLE works(
            id INTEGER,
            work_name TEXT NOT NULL,
            work_description TEXT DEFAULT 'No Description',
            work_outline TEXT DEFAULT 'No Outline',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )
    `);

    db.run(`
        CREATE TABLE chapters(
            id INTEGER,
            chapter_number INTEGER NOT NULL,
            chapter_name TEXT DEFAULT 'Untitled',
            chapter_description TEXT DEFAULT 'No Description',
            chapter_outline TEXT DEFAULT 'No Outline',
            work_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(work_id) REFERENCES works(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE scenes(
            id INTEGER,
            scene_number INTEGER NOT NULL,
            scene_description TEXT DEFAULT 'No Description',
            scene_outline TEXT DEFAULT 'No Outline',
            chapter_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE scene_characters(
            id INTEGER,
            character_id INTEGER NOT NULL,
            scene_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(character_id) REFERENCES characters(id) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(scene_id) REFERENCES scenes(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE scene_settings(
            id INTEGER,
            setting_id INTEGER NOT NULL,
            scene_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(setting_id) REFERENCES settings(id) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(scene_id) REFERENCES scenes(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE settings(
            id INTEGER,
            setting_name TEXT NOT NULL,
            setting_description TEXT DEFAULT 'No Description',
            setting_outline TEXT DEFAULT 'No Outline',
            work_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(work_id) REFERENCES works(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE characters(
            id INTEGER,
            character_name TEXT NOT NULL,
            character_description TEXT DEFAULT 'No Description',
            character_outline TEXT DEFAULT 'No Outline',
            character_index INTEGER,
            work_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(work_id) REFERENCES works(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE character_fields(
            id INTEGER,
            field_name TEXT NOT NULL,
            field_value TEXT NOT NULL,
            character_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            FOREIGN KEY(character_id) REFERENCES characters(id) ON UPDATE CASCADE ON DELETE CASCADE
        )
    `);

    db.close();
};