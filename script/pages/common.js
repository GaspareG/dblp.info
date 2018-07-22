// Dataset loading function
var baseUrl = "data/";

function loadAuthors(callback) {
  d3.csv(baseUrl + "/authors.csv")
    .then(data => callback(data));
}

function loadJournals(callback) {
  d3.csv(baseUrl + "/journals.csv")
    .then(data => callback(data));
}

function loadPapers(callback) {
  d3.csv(baseUrl + "/papers.csv", function(d) {
      d.id = parseInt(d.id)
      if (d.year == undefined) console.log(d);
      d.year = parseInt(d.year)
      return d;
    })
    .then(data => callback(data));
}

function loadCoauthorship(callback) {
  d3.csv(baseUrl + "/coauthorship.csv")
    .then(data => callback(data));
}

function loadPublish(callback) {
  d3.csv(baseUrl + "/publish.csv")
    .then(data => callback(data));
}

function loadWrote(callback) {
  d3.csv(baseUrl + "/wrote.csv")
    .then(data => callback(data));
}

function loadCitations(callback) {
  d3.csv(baseUrl + "/citations.csv")
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

function quickSort(arr, leftPos, rightPos, arrLength) {
  let initialLeftPos = leftPos;
  let initialRightPos = rightPos;
  let direction = true;
  let pivot = rightPos;
  while ((leftPos - rightPos) < 0) {
    if (direction) {
      if (arr[pivot] < arr[leftPos]) {
        quickSort.swap(arr, pivot, leftPos);
        pivot = leftPos;
        rightPos--;
        direction = !direction;
      } else
        leftPos++;
    } else {
      if (arr[pivot] <= arr[rightPos]) {
        rightPos--;
      } else {
        quickSort.swap(arr, pivot, rightPos);
        leftPos++;
        pivot = rightPos;
        direction = !direction;
      }
    }
  }
  if (pivot - 1 > initialLeftPos) {
    quickSort(arr, initialLeftPos, pivot - 1, arrLength);
  }
  if (pivot + 1 < initialRightPos) {
    quickSort(arr, pivot + 1, initialRightPos, arrLength);
  }
}

quickSort.swap = (arr, el1, el2) => {
  let swapedElem = arr[el1];
  arr[el1] = arr[el2];
  arr[el2] = swapedElem;
}


function addCollapse(){
  var el = $(".filter");
  $(el).each(function(e){
    e = $(this);
    e.css("position", "relative");
    $(".collapse-button", e).remove();
    e.append(
      $('<i class="collapse-button fas"></i>')
      .addClass( e.attr("collapsed") == undefined || e.attr("collapsed") == "false" ? "fa-minus-square" : "fa-plus-square")
      .css({
        "position": "absolute",
        "top": "8px",
        "right": "16px",
        "cursor": "pointer"
      })
      .click( (function(filter){
        return function(){
          if( $(filter).attr("collapsed") == undefined || $(filter).attr("collapsed") == "false"  )
          {
            $(filter).attr("collapsed", "true");
            $(this).removeClass("fa-minus-square").addClass("fa-plus-square");
            $(filter).css({
              "height": "36px",
              "overflow-y": "hidden"
            });
          }
          else
          {
            $(filter).attr("collapsed", "false");
            $(this).removeClass("fa-plus-square").addClass("fa-minus-square");
            $(filter).css({
              "height": "auto",
              "overflow-y": "auto"
            });
          }
        }
      })(e))
    );
  });
}
