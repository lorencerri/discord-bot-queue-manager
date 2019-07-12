const Client = require('./structures/Client');
const client = new Client();

const options = {
  mainGuildID: '533978054272483358',
  inviteChannelID: '588638238508318720',
  logsChannelID: '588614255377514506',
  mainGuildName: 'XenoX',
  testingGuildID: '589006024938225665',
}

client.run(options);
client.login(process.env.TOKEN);

client.on('ready', () => {
  client.user.SetActivity(`Playing With Bots`);
  console.log('[Discord Bot] Ready!')
})