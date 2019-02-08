const Command = require('../../structures/Command');
const Discord = require('discord.js');

class Limits extends Command {
    constructor(client) {
        super({
            name: 'limits'
        });
        
        this.client = client;
    }
    
    async exec(message, args) {
      const embed = new Discord.MessageEmbed()
      .setDescription(['Limitations',
         '- No Spam Commands/Responses',
         '- Online For Testing',
         '- No DMing Users On Join',
         '- No Shortened URLs',
         '- English Language Support',

         '\nMinimum Bot Requirements',
         '- NSFW Commands only in NSFW Channels',
         '- 5 Working Commands',
         '- Viewable Help Menu',
         '- Working Prefix'].join('\n'))
      .setColor(0x7289DA)

      return message.channel.send({ embed: embed });
     
    }
    
}

module.exports = Limits;