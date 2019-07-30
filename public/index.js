/*globals io, getCookie, updateLoadingHTML*/

// Login & Fetch Data
var socket = io();
var bearer = getCookie("bearer");
if (!bearer) updateLoadingHTML('<a href="https://discordapp.com/api/oauth2/authorize?client_id=467875880794849282&redirect_uri=https%3A%2F%2Fdb-manager.glitch.me%2Fcallback&response_type=code&scope=identify"><button type="button" class="btn btn-dark">Login With Discord</button></a>')
else socket.emit('getInfo', bearer);

function updateLoadingHTML(html) {
  $("#loading").fadeOut(function() {
    $(this).html(html).fadeIn();
  });  
}

function emitEvent(botID, event, requireReason) {
  var reason;
  if (requireReason) {
    reason = prompt('State why this bot is being denied:');
    if (!reason) return;
  }
  socket.emit(event, {
    botID: botID,
    bearer: bearer,
    reason: reason
  });
}

socket.on('getNewInfo', function() {
  socket.emit('getInfo', bearer); 
})

socket.on('getInfo', function(info) {

  // Verify Login & Access
  if (!info) updateLoadingHTML('<a href="https://discordapp.com/api/oauth2/authorize?client_id=467875880794849282&redirect_uri=https%3A%2F%2Fdb-manager.glitch.me%2Fcallback&response_type=code&scope=identify"><button type="button" class="btn btn-dark">Login With Discord</button></a>')
  else if (info === 403) updateLoadingHTML('Sorry, you don\'t have access to this page...');
  else window.loading_screen.finish();
  
  // Clear Data
  $('#testing').html('');
  $('#actions').html('');
  $('#leaderboard').html('');

  // Update Text Screens
  var queue = info.queue;
  var leaderboard = info.leaderboard;
  $('.username').text(` ${info.username}`);
  if (queue.length === 1) $('#header').text(`There is currently 1 bot in the queue for ${info.guildName}`);
  else $('#header').text(`There are currently ${queue.length} bots in the queue for ${info.guildName}`);
  if (!info.hasPermission) $('#guest').css('display', 'block')

  // Loop Through Bots
  for (var i = 0; i < queue.length; i++) {
    
    // Variables
    var row = $("<tr>");
    var text = '', buttonHTML = '';
    var code = queue[i].code;
 
    // Text & Buttons
    if (code === 0) {
      buttonHTML = `<a target="__blank" href="https://discordapp.com/oauth2/authorize?client_id=${queue[i].bot.id}&scope=bot&permissions=0&guild_id=${queue[i].testingGuildID}"><button type="button" style="margin-right: 10px;" class="btn btn-info btn-sm">Invite (Testing)</button></a> <button onclick="emitEvent('${queue[i].bot.id}', 'deny', true)" type="button" style="margin-right: 10px;" class="btn btn-danger btn-sm">Deny</button>`;
      text = 'Awaiting Invite (Testing)';
    } else if (code === 1) {
      buttonHTML = `<button onclick="emitEvent('${queue[i].bot.id}', 'test')" type="button" style="margin-right: 10px;" class="btn btn-warning btn-sm">Start Testing</button>`
      text = 'Awaiting Testing';
    } else if (code === 2) {
      if (info.id === queue[i].tester.id) buttonHTML = `<button onclick="emitEvent('${queue[i].bot.id}', 'accept')" type="button" style="margin-right: 10px;" class="btn btn-success btn-sm">Accept</button> <button onclick="emitEvent('${queue[i].bot.id}', 'deny', true)" type="button" style="margin-right: 10px;" class="btn btn-danger btn-sm">Deny</button>` 
      text = `Being Tested By ${queue[i].tester.name}`;
    } else if (code === 3) {
      buttonHTML = `<a target="__blank" href="https://discordapp.com/oauth2/authorize?client_id=${queue[i].bot.id}&scope=bot&permissions=0&guild_id=${queue[i].mainGuildID}"><button type="button" style="margin-right: 10px;" class="btn btn-info btn-sm">Invite (Plexi)</button></a> <button onclick="emitEvent('${queue[i].bot.id}', 'deny', true)" type="button" style="margin-right: 10px;" class="btn btn-danger btn-sm">Deny</button>`;
      text = 'Awaiting Invite (Plexi)';
    }
    
    // Update Row
    row.append($(`<th class="align-middle" scope="row">${i+1}</th>`));
    row.append($(`<td class="align-middle">${queue[i].prefix}</td>`));
    row.append($(`<td class="align-middle"><img src="${queue[i].bot.avatar}" height="32" width="32">&nbsp${queue[i].bot.name}</td>`));
    row.append($(`<td class="align-middle">${text}</td>`));
    if (!info.hasPermission) row.append($(`<td>None (Guest)</td>`));
    else if (buttonHTML) row.append($(`<td>${buttonHTML}</td>`));
    else row.append($(`<td>None</td>`));

    // Append Row
    if (code === 2) $('#testing').append(row);
    else $('#actions').append(row);

  }

  // Loop Through Leaderboard
  for (var i = 0; i < leaderboard.length; i++) {

    var row = $("<tr>");
    row.append($(`<th class="align-middle" scope="row"><img src="${leaderboard[i].avatar}" height="32" width="32">&nbsp${leaderboard[i].username}</th>`));
    row.append($(`<th class="align-middle" scope="row">${leaderboard[i].tested}</th>`));
    $('#leaderboard').append(row);
    
  }

});