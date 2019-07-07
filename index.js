const Client = require('./structures/Client');
const client = new Client();

const options = {
  mainGuildID: '343572980351107077',
  inviteChannelID: '456171707607154689',
  logsChannelID: '468944931529162752',
  mainGuildName: 'Plexi Development',
  testingGuildID: '398879191975723017',
}

client.run(options);
client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log('[Discord Bot] Ready!')
})