exports.run = (client, member) => {

  // Testing Guild?
  if (member.guild.id === client.managerOptions.testingGuildID) {
   
    // Invited Bot?
    let bot = client.db.get(`bot_${member.id}`);
    if (!bot) return;
    
    // Update Code
    client.db.set(`bot_${member.id}.code`, 1); 
    
    // Send Notification
    client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${client.users.get(bot.authorID).tag}) **${member.user.tag}** has been added to the verification center.`);
    
    // Update Username
    member.setNickname(`[ ${bot.prefix} ] ${member.user.username}`);
    
    // Emit getNewInfo
    client.io.emit('getNewInfo', true);
    
  }

  // Main Guild?
  if (member.guild.id === client.managerOptions.mainGuildID) {
   
    // Invited Bot?
    let bot = client.db.get(`bot_${member.id}`);
    if (!bot) return;
    
    // Update Code
    client.db.set(`bot_${member.id}.code`, 4); 
    
    // Remove From Queue
    let queue = client.db.get('queue') || [];
    let index = queue.indexOf(member.id);
    if (index != -1) queue.splice(index, 1);
    client.db.set('queue', queue);
    
    // Update Username
    member.setNickname(`[ ${bot.prefix} ] ${member.user.username}`);
    
    // Add Bot Role
    member.roles.add(member.guild.roles.find(r => r.name === 'Bot'));
    
    // Add Developer Role
    let owner = member.guild.members.get(bot.authorID);
    owner.roles.add(member.guild.roles.find(r => r.name === 'Developer'));
    
    // Send Notification
    client.channels.get(client.managerOptions.logsChannelID).send(`(Owner: ${owner}) **${member.user.tag}** has been added to **${client.managerOptions.mainGuildName}**.`);
    
    // Emit getNewInfo
    client.io.emit('getNewInfo', true);
    
  }
    
}