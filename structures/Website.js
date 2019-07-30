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
    let http = require('http').Server(app);
    let ClientOauth = require('client-oauth2');
    let url = require('url');
    let snekfetch = require('snekfetch');
    client.io = require('socket.io')(http);
    
    app.use(express.static('public'))

    app.get('/', function(req, res) {
      res.sendFile(__dirname + '/index.html');
    });

    let ops = {
      clientId: '467875880794849282', // This is what the input shoud look like, replace it with your own.
      clientSecret: 'IS782kP-L8zBQCsNQCkNy2rpvN80QSZP', // This is what the input shoud look like, replace it with your own.
      accessTokenUri: 'https://discordapp.com/api/oauth2/token',
      authorizationUri: 'https://discordapp.com/api/oauth2/authorize',
      redirectUri: 'https://db-manager.glitch.me/callback', // This is what the input shoud look like, replace it with your own.
      scopes: ['identify']
    };

    let auth = new ClientOauth(ops),
      host = url.parse(ops.redirectUri).host,
      baseApiUrl = 'https://discordapp.com/api/';

    app.get('/callback', function(request, response) {
      if (request.originalUrl.includes('error=access_denied')) return response.redirect('/');
      auth.code.getToken(request.originalUrl).then(user => {
        let bearer = user.accessToken;
        let signature = "pid_";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.";
        for (var i = 0; i < 25; i++) signature += possible.charAt(Math.floor(Math.random() * possible.length));
        client.db.set(`signature_${signature}`, bearer)
        response.cookie("bearer", signature);
        response.redirect('/');
      }).catch(e => {
        console.log(e)
        response.status(401).send(e.stack);
      });
    });

    client.io.on('connection', function(socket) {
      console.log('[Website] Unknown User Connected');

      socket.on('getInfo', function(bearer) {
        snekfetch.get(`${baseApiUrl}users/@me`).set("Authorization", "Bearer " + client.db.get(`signature_${bearer}`)).then(async user => {
            
            console.log(`[Fetching Data] ${user.body.username}#${user.body.discriminator}`);
          
            let hasPermission = client.guilds.get(client.managerOptions.mainGuildID).members.get(user.body.id).hasPermission('MANAGE_NICKNAMES');
          
            // Fetch Queue
            let queue = [];
            let data = client.db.get('queue') || [];
            
            for (var i = 0; i < data.length; i++) { // Update Queue
              
              let bot = client.db.get(`bot_${data[i]}`)
              let apiInfo = await client.users.fetch(data[i]);
              queue.push(Object.assign({ bot: { id: data[i], name: apiInfo.username, avatar: apiInfo.displayAvatarURL() } }, bot, client.managerOptions));
             
            }
          
            // Fetch Leaderboard
            let lb = [];
            let leaderboard = client.db.get('leaderboard') || {};
            for (var i in leaderboard) {
              var lbUser = client.users.get(i);
              lb.push({ avatar: lbUser.displayAvatarURL(), username: lbUser.username, tested: leaderboard[i].tested });
            }
            lb = Object.values(lb).sort((a, b) => b.tested - a.tested);

            socket.emit('getInfo', {
              id: user.body.id,
              username: user.body.username,
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

      socket.on('test', function(data) {
        snekfetch.get(`${baseApiUrl}users/@me`).set("Authorization", "Bearer " + client.db.get(`signature_${data.bearer}`)).then(async user => {
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.body.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user.body;
          let botID = data.botID;
          let bot = client.db.get(`bot_${botID}`);
          
          // Already Testing?
          if (bot.code >= 2) return;
          
          // Update Database
          client.db.set(`bot_${botID}.code`, 2);
          client.db.set(`bot_${botID}.tester`, { id: author.id, name: author.username });
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${client.users.get(bot.authorID).tag}) **${client.users.get(botID).tag}** is now being tested by **${author.username}#${author.discriminator}**.`);
    
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);
          
        }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
          });
      });
    
    socket.on('accept', function(data) {
        snekfetch.get(`${baseApiUrl}users/@me`).set("Authorization", "Bearer " + client.db.get(`signature_${data.bearer}`)).then(async user => {
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.body.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user.body;
          let botID = data.botID;
          let bot = client.db.get(`bot_${botID}`);
          
          // Already Approved?
          if (bot.code >= 4) return;
          
          // Update Database
          client.db.set(`bot_${botID}.code`, 3);
          
          // Update Leaderboard
          client.db.add(`leaderboard.${author.id}.tested`, 1);
          
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${client.users.get(bot.authorID).tag}) **${client.users.get(botID).tag}** has been approved by **${author.username}#${author.discriminator}**.`);
          
          // Kick From Testing Guild
          client.guilds.get(client.managerOptions.testingGuildID).members.get(botID).kick();
    
          
        }).catch(err => {
            console.log(err);
            socket.emit('getInfo', false);
          });
      });
      
      socket.on('deny', function(data) {
        snekfetch.get(`${baseApiUrl}users/@me`).set("Authorization", "Bearer " + client.db.get(`signature_${data.bearer}`)).then(async user => {
          if (!client.guilds.get(client.managerOptions.mainGuildID).members.get(user.body.id).hasPermission('MANAGE_NICKNAMES')) return socket.emit('getInfo', 403);
          
          // Variables
          let author = user.body;
          let botID = data.botID;
          let bot = client.db.get(`bot_${botID}`);
          
          console.log(author, botID, bot, data);
          
          // Remove From Queue
          let queue = client.db.get('queue');
          if (typeof queue !== 'object') queue = [];
          let index = queue.indexOf(botID);
          if (index != -1) {
            queue.splice(index, 1);
            client.db.set('queue', queue);
          }
          
          // Update Database
          client.db.delete(`bot_${botID}`);
          
          // Update Leaderboard
          client.db.add(`leaderboard.${author.id}.tested`, 1);
          
          // Emit getNewInfo
          client.io.emit('getNewInfo', true);  
          
          // Send Notification
          client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${client.users.get(bot.authorID)}) **${client.users.get(botID).tag}** has been denied for **"${data.reason || 'No reason provided'}"**.`);
          
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
