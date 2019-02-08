const Discord = require('discord.js');
const Hook = require('quick.hook');
const db = require('quick.db');

class Base extends Discord.Client {
    constructor(...args) {
        super(...args);
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
        this.CommandHandler = new (require('./CommandHandler'))(this);
        this.EventHandler = new (require('./EventHandler'))(this);
        this.Website = new (require('./Website'))(this);
        this.hook = Hook;
        this.db = db;
        this.prefix = '++';
    }
    
    run(options) {
        this.managerOptions = options;
        this.CommandHandler.load();
        this.EventHandler.load();
        this.Website.load();
    }
    
}

module.exports = Base;