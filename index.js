const Client = require('./structures/Client');
const client = new Client();

const options = {
  mainGuildID: (process.env.MI),
  inviteChannelID: (process.env.I),
  logsChannelID: (process.env.L),
  mainGuildName: 'Xenox Development', // Name Cannot Be In .env , It will throw erorr or Give msg Undefined
  testingGuildID: (process.env.TG),
}

client.run(options);
client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log('[Discord Bot] Ready!')
})