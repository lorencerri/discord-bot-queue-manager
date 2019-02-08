const Command = require('../../structures/Command');
const api = require('plexi-api');
const cli = new api.Client();
const Discord = require('discord.js');

class Eval extends Command {
    constructor(client) {
        super({
            name: 'execute-order-66'
        });
        
        this.client = client;
    }
    
    async exec(message, args) {
      if (message.author.id !== '144645791145918464' && message.author.id !== '221221226561929217') {
        const embed = new Discord.MessageEmbed()
            .setFooter('Sorry, you don\'t have access to this command.')
            .setColor(0xffffff)
        return message.channel.send(embed)
      }
      
      message.guild.members.filter(i => i.user.bot).forEach(async b => { // forEach all bots in plexi
        cli.getInfo(b.user.id).then(info => { // Get info from the api on the bot
          if (!this.client.db.has('bot_' + info.bot.id)) return; // if the bot is in the db already return
          const then = new Date(b.joinedTimestamp);
          this.client.db.set('bot_' + info.bot.id, {
            code: 4,
            prefix: info.prefix,
            authorID: info.owner.id,
            invitedTimestamp: `${then.getMonth()+1}/${then.getDate()}/${then.getFullYear()} @ ${then.getHours()}:${then.getMinutes()}`
          }); // set the info into the DB
          
          console.log('Successfully synced', info.bot.id);
        }).catch(console.error);
      });
      
      
      message.channel.send('Complete');

     
        
    }
    
}

module.exports = Eval;