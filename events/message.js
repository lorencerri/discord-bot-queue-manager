const { MessageEmbed } = require('discord.js');

exports.run = async (client, message) => {
    
    // Invite Channel
    if (message.channel.id === client.managerOptions.inviteChannelID && !message.author.bot) {
      
      message.delete({timeout: 1000});
      
      // Create Embed
      const embed = new MessageEmbed()
        .setColor(0x7289DA)
        .setTitle(`Hello, ${message.author.tag}`)
      
      // Variables
      let args = message.content.split(/ +/g);
      let id = args.shift();
      let prefix = args.join(' ');
      let alreadyInQueue = (!!client.db.get(`bot_${id}`));
      let bot = await client.users.fetch(id).catch(err => { /* Ignore Invalid IDs */ });
      let now = new Date();

      // Error Messages
      let error;
      if (!bot) error = 'Sorry, a bot with that ID couldn\'t be found.';
      else if (!prefix) error = 'Please send the prefix following the bot\'s ID.';
      else if (!bot.bot) error = 'Sorry, that isn\'t a bot.';
      else if (alreadyInQueue || message.guild.members.get(id)) error = 'Sorry, this bot is already in the queue or server.';
      if (error) return message.channel.send(embed.setFooter(error)).then(i => i.delete({ timeout: 10000 })); // Send Error
      
      // Update Database
      client.db.set(`bot_${id}`, {
        code: 0,
        prefix: prefix,
        authorID: message.author.id,
        invitedTimestamp: `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()} @ ${now.getHours()}:${now.getMinutes()}`
      });
      
      // Update Queue
      let queue = client.db.get('queue') || [];
      queue.push(id);
      client.db.set('queue', queue);
      
      // Modify Embed & Send
      embed.setDescription(`Thank you for inviting **${bot.username}**! It will be added to ${client.managerOptions.mainGuildName} after it is tested.\n\nIn the meantime, please read the rules for bots by typing **\`++limits\` in #bot-testing.**`).setThumbnail(bot.displayAvatarURL());
      message.channel.send(embed);
      
      // Emit getNewInfo
      client.io.emit('getNewInfo', true);
      
      // Send Notification
      return client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${message.author}) **${bot.tag}** has been added to the queue. You will receive updates in this channel.`);
      
    }
  
    // Check for prefix
    if (!message.content.startsWith(client.prefix)) return;
    
    // Declare & Initialize Variables
    const args = message.content.slice(client.prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Return Statements
    if (message.author.bot || !message.channel.guild || !message.guild) return;
    if (!client.commands.has(cmd)) return;
    
    // Run Command
    const command = client.commands.get(cmd);
    command.exec(message, args);
    
}
