const Client = require('./structures/Client');
const client = new Client();

const options = {
  reqID : (process.env.NRID),
  mainGuildID: (process.env.MGID),
  inviteChannelID: (process.env.INV),
  logsChannelID: (process.env.LCID),
  mainGuildName: 'Xenox Development',
  testingGuildID: (process.env.TGID),
}

client.run(options);
client.login(process.env.TOKEN);

client.on('ready', () => {
  //console.log('[Discord Bot] Ready!')
//client.user.SetActivity("3.0 Version Released ! | BY Ŕio ŁeX#0027")
// client.user.setUsername("Just9 3.0 ©");
 // console.log(process.env.EVALID)
  
})