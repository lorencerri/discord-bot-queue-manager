/*globals io*/
window.loading_screen = window.pleaseWait({
  logo: "https://fontmeme.com/.png",
  backgroundColor: '#7289DA',
  loadingHtml: "<p id='loading' class='loading-message'>Please wait...</p>"
});

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}