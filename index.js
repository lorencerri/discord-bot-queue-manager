const Client = require('./structures/Client');
const { config } = require('dotenv');
const client = new Client();

config();
const options = {
  mainGuildID: ',533978054272483358',
  inviteChannelID: '588638238508318720',
  logsChannelID:'588614255377514506',
  mainGuildName: 'POWER OFFICIAL',
  testingGuildID:'589006024938225665',
}

client.run(options);
client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log(`${client.user.tag.discriminator} Ready!`)
})