'use strict';



class Website {
  constructor(client) {
    this.client = client;
  }

  async load() {
    console.log('[Website] Launching...');

    let client = this.client;
    let express = require('express');
    let app = express();
    let http = require('http').createServer(app);
    let url = require('url');
    let nodefetch = require('node-fetch');
    let passport = require('passport')
    let Strategy = require("passport-discord").Strategy;
    let session = require('express-session')
    client.io = require('socket.io')(http);
    
    app.use(express.static('public'))
    
    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((obj, done) => {
      done(null, obj);
    });

    app.get('/', function(req, res) {
      res.sendFile(__dirname + '/index.html');
    });

    let ops = {
      clientId: '583910433300152331', // This is what the input shoud look like, replace it with your own.
      clientSecret: 'MMeSUwv1JYCy1Jk0zGETdZbjvWRPm57r', // This is what the input shoud look like, replace it with your own.
      accessTokenUri: 'https://discordapp.com/api/oauth2/token',
      authorizationUri: 'https://discordapp.com/api/oauth2/authorize',
      redirectUri: 'https://xenox-dbm.glitch.me/callback', // This is what the input shoud look like, replace it with your own.
      scopes: ['identify']
    };
    const DStrategy = new Strategy({
        clientID: '583910433300152331',
        clientSecret: 'MMeSUwv1JYCy1Jk0zGETdZbjvWRPm57r',
        callbackURL: 'http://xenox-dbm.glitch.me/callback',
        redirectUri: 'https://xenox-dbm.glitch.me/callback',
        scope: ["identify"]
      },
      (accessToken, refreshToken, profile, done) => {
        profile.refreshToken = refreshToken
        return process.nextTick(() => done(null, profile));
      }
    )
    passport.use(DStrategy);
    app.use(session({
      secret: "BCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.",
      resave: false,
      saveUninitialized: false,
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    let bodyParser = require('body-parser');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));
    let baseApiUrl = 'https://discordapp.com/api/';

    app.get('/callback', passport.authenticate('discord', {
      failureRedirect: "/"
    }),
    function(request, response) {
      console.log("callback")
      if (request.originalUrl.includes('error=access_denied')) return response.redirect('/');
      let bearer = request.user.accessToken;
      let signature = "pid_";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.";
      for (var i = 0; i < 25; i++) signature += possible.charAt(Math.floor(Math.random() * possible.length));
      client.db.set(`signature_${signature}`, bearer)
      response.cookie("bearer", signature);
      response.redirect('/');
    });

    client.io.on('connection', function(socket) {
      console.log('[Website] Unknown User Connected');

     socket.on('getInfo', async function(bearer) {
        let tok = await client.db.fetch(`signature_` + bearer)
        await nodefetch(`${baseApiUrl}users/@me`, {
          method: "GET",
          headers: {
            'Authorization' : `Bearer ${tok}`
          }
        }).then(res => res.json()).then(async user => {
          console.log(`[Fetching Data] ${user.username}#${user.discriminator}`);
          socket.user = user
           
            let isuser = client.guilds.get(client.managerOptions.mainGuildID).members.get(user.id) ? true : false
            let hasPermission = isuser ? client.guilds.get(client.managerOptions.mainGuildID).members.get(user.id).hasPermission('MANAGE_NICKNAMES') : false
            
             //Fetch Queue
            let queue = [];
            let data = await client.db.fetch('queue') || [];
            for (let i in data) { // Update Queue
              
             let bot = await client.db.fetch(`bot_${data[i]}`)
             let apiInfo = await client.users.fetch(data[i]);
             queue.push(Object.assign({ bot: { id: data[i], name: apiInfo.username, avatar: apiInfo.displayAvatarURL() } }, bot, client.managerOptions));
             
            }
          
            // Fetch Leaderboard
            let lb = [];
            let leaderboard = await client.db.fetch('leaderboard') || {};
        
            for (let i in leaderboard) {
              
              let lbUser = await client.users.fetch(i);
              
              lb.push({ avatar: lbUser.displayAvatarURL(), username: lbUser.username, tested: leaderboard[i].tested });
            }
            lb = Object.values(lb).sort((a, b) => b.tested - a.tested);

            socket.emit('getInfoWeb', {
              id: user.id,
              username: user.username,
              guildName: client.managerOptions.mainGuildName,
              queue: queue,
              leaderboard: lb,
              hasPermission: hasPermission
            });
              
          }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
          });
      });

      socket.on('test', async function(data) {
        let tok = await client.db.fetch(`signature_` + data.bearer)
        await nodefetch(`${baseApiUrl}users/@me`, {
          method: "GET",
          headers: {
            'Authorization' : `Bearer ${tok}`
          }
        }).then(res => res.json()).then(async user => {
          console.log(`[Fetching Data] ${user.username}#${user.discriminator}`);
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user;
          let botID = data.botID;
          let bot = await client.db.fetch(`bot_${botID}`);
          
          console.log(bot)
          
          // Already Testing?
          if (bot.code >= 1) return;
          
          // Update Database
          await client.db.set(`bot_${botID}.code`, 2);
          await client.db.set(`bot_${botID}.tester`, { id: author.id, name: author.username });
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${await client.users.fetch(bot.authorID).tag}) **${await client.users.fetch(botID).tag}** is now being tested by **${author.username}#${author.discriminator}**.`);
    
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);
          
        }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
          });
      });
    
    socket.on('accept', async function(data) {
        let tok = await client.db.fetch(`signature_` + data.bearer)
        await nodefetch(`${baseApiUrl}users/@me`, {
          method: "GET",
          headers: {
            'Authorization' : `Bearer ${tok}`
          }
        }).then(res => res.json()).then(async user => {
          console.log(`[Fetching Data] ${user.username}#${user.discriminator}`);
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user;
          let botID = data.botID;
          let bot = await client.db.fetch(`bot_${botID}`);
          let uBot = await client.users.fetch(botID)
          
          // Already Approved?
          if (bot.code >= 4) return;
          
          // Update Database
          client.db.set(`bot_${botID}.code`, 3);
          
          // Update Leaderboard
          client.db.add(`leaderboard.${author.id}.tested`, 1);
          
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${await client.users.fetch(bot.authorID).tag}) **${uBot.username}#${uBot.discriminator}* has been approved by **${author.username}#${author.discriminator}**.`);
          
          // Kick From Testing Guild
          client.guilds.get(client.managerOptions.testingGuildID).members.get(botID).kick();
    
          
        }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
          });
      });
      
      socket.on('deny', async function(data) {
        let tok = await client.db.fetch(`signature_` + data.bearer)
        await nodefetch(`${baseApiUrl}users/@me`, {
          method: "GET",
          headers: {
            'Authorization' : `Bearer ${tok}`
          }
        }).then(res => res.json()).then(async user => {
          console.log(`[Fetching Data] ${user.username}#${user.discriminator}`);
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user;
          let botID = data.botID;
          let bot = await client.db.fetch(`bot_${botID}`);
          let uBot = await client.users.fetch(botID)
          
          console.log(author, botID, bot, data);
          
          // Remove From Queue
          let queue = await client.db.fetch('queue');
          if (typeof queue !== 'object') queue = [];
          let index = queue.indexOf(botID);
          if (index != -1) {
            queue.splice(index, 1);
            await client.db.set('queue', queue);
          }
          
          // Update Database
          client.db.delete(`bot_${botID}`);
          
          // Update Leaderboard
          client.db.add(`leaderboard.${author.id}.tested`, 1);
          
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);  
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${await client.users.fetch(bot.authorID)}) **${uBot.username}#${uBot.discriminator}** has been denied for **"${data.reason || 'No reason provided'}"**.`);
          
          // Kick From Testing Guild
          client.guilds.get(client.managerOptions.testingGuildID).members.get(botID).kick();
          
        }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
        });
      });
      
    });

    http.listen(process.env.PORT, function() {
      console.log(`[Website] Listening on *:${process.env.PORT}`);
    });

  }

}

module.exports = Website;
