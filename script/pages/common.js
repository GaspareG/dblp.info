// Dataset loading function
var baseUrl = "data/";

function loadAuthors(callback)
{
  d3.csv(baseUrl+"/authors.csv")
    .then(data => callback(data));
}

function loadJournals(callback)
{
  d3.csv(baseUrl+"/journals.csv")
    .then(data => callback(data));
}

function loadPapers(callback)
{
  d3.csv(baseUrl+"/papers.csv", function(d){
    d.id = parseInt(d.id)
    if( d.year == undefined ) console.log(d);
    d.year = parseInt(d.year)
    return d;
  })
    .then(data => callback(data));
}

function loadCoauthorship(callback)
{
  d3.csv(baseUrl+"/coauthorship.csv")
    .then(data => callback(data));
}

function loadPublish(callback)
{
  d3.csv(baseUrl+"/publish.csv")
    .then(data => callback(data));
}

function loadWrote(callback)
{
  d3.csv(baseUrl+"/wrote.csv")
    .then(data => callback(data));
}

// Query string functions
function updateQueryStringParam(key, value) {
  baseUrl = [location.protocol, '//', location.host, location.pathname].join('');
  urlQueryString = document.location.search;
  var newParam = key + '=' + value,
      params = '?' + newParam;

  if (urlQueryString) {
    keyRegex = new RegExp('([\?&])' + key + '[^&]*');
    if (urlQueryString.match(keyRegex) !== null) {
      params = urlQueryString.replace(keyRegex, "$1" + newParam);
    } else { // Otherwise, add it to end of query string
      params = urlQueryString + '&' + newParam;
    }
  }
  window.history.replaceState({}, "", baseUrl + params);
}

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
     return decodeURIComponent(pair[1]);
    }
  }
  return undefined;
}
