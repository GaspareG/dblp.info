var id = getQueryVariable("id");
var sort = 0;
var plotType = 0;

$(function() {
  loadJournals(function(journals) {
    loadPublish(function(publish) {
      loadPapers(function(papers) {
        loadWrote(function(wrote) {
          loadAuthors(function(authors) {
            loadCitations(function(citations) {
              parseData(journals, publish, papers, wrote, authors, citations);
            });
          });
        });
      });
    });
  });
});

var dJournals = [];
var dPublish = [];
var dPapers = [];
var dWrote = [];
var dAuthors = [];
var dCitations = [];
var dCited = [];
var name2id = {};

function parseData(journals, publish, papers, wrote, authors, citations) {

  for (var i = 0; i < journals.length; i++) {
    dJournals[parseInt(journals[i]["id"])] = journals[i];
    dJournals[parseInt(journals[i]["id"])]["pubs"] = [];
  }
  for (var i = 0; i < papers.length; i++) {
    name2id[ papers[i]["title"] ] = papers[i]["id"];
    dPapers[parseInt(papers[i]["id"])] = papers[i];
    dPapers[parseInt(papers[i]["id"])]["journals"] = [];
    dPapers[parseInt(papers[i]["id"])]["authors"] = [];
    dCitations[ parseInt(papers[i]["id"]) ] = [];
    dCited[ parseInt(papers[i]["id"]) ] = [];
  }

  for(var i = 0; i< citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    dCitations[idP1].push(idP2);
    dCited[idP2].push(idP1);
  }

  for (var i = 0; i < authors.length; i++) {
    dAuthors[parseInt(authors[i]["id"])] = authors[i];
    dAuthors[parseInt(authors[i]["id"])]["pubs"] = [];
  }

  for (var i = 0; i < wrote.length; i++) {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    dAuthors[idA]["pubs"].push(idP);
    dPapers[idP]["authors"].push(idA);
  }

  for (var i = 0; i < publish.length; i++) {
    var idJ = parseInt(publish[i]["idJ"]);
    var idP = parseInt(publish[i]["idP"]);
    dJournals[idJ]["pubs"].push(idP);
    dPapers[idP]["journals"].push(idJ);
  }

  id = parseInt(id);
  if( !isFinite(id) || id < 0 || id > dAuthors.length )
  {
    $("#no").css("display", "block");
    $("#yes").css("display", "none");
    loadSearch();
  }
  else
  {
    $("#no").css("display", "none");
    $("#yes").css("display", "block");
    loadControls();
    plot();
  }
}

function loadSearch() {
  $("#c_search").html("");
  addCollapse();
  var input = $("<input style='width: 100%' id='author'>");

  var names = [];
  for (var k in name2id) names.push(k);
  input.autocomplete({
    source: names,
    minLength: 3,
    autoFocus: true,
    select: function(event, ui) {
      var id = +name2id[ui.item.value];
      location.href = "paper?id="+id;
    }
  });

  $("#c_search").append('<b><i class="fas fa-search"></i> Search paper:</b><br>');
  $("#c_search").append("<span> </span>");
  $("#c_search").append($("<div>").css("width", "100%").append(input));
}

function loadControls() {

  loadInfo();
  loadAuthorsList();
  loadCiteOut();
  loadCiteIn();
  loadCiteOutDegree();
  loadCiteInDegree();
  loadPlotType();
}

var draw = [];
function plot() {
  draw[plotType]();
}

function loadInfo() {
  var pap = dPapers[id];
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<i class='fas fa-info-circle'></i> "+pap["year"]+" [" + dJournals[pap["journals"][0]]["tag"].toUpperCase() + "] <b>" + pap["title"] + "</b><br>");
  $("#c_info").append( "<b>" + pap["authors"].length + "</b> authors, <b>"+dCited[id].length+"</b> citations and cited <b>"+dCitations[id].length+"</b> times");
}

function loadAuthorsList() {
  var ul = $("<ol>");
  dPapers[id]["authors"].forEach(function(x){
    var li = $("<li>");
    li.append("<a href='author?id="+x+"'>" +dAuthors[x]["name"]+"</a>");
    ul.append(li);
  });
  $("#c_coauthors").html("");
  addCollapse();
  $("#c_coauthors").append('<b><i class="fas fa-user"></i> Authors:</b>');
  $("#c_coauthors").append(ul);
}

function loadCiteOut(){
  var ul = $("<ol>");
  ul.css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });
  dCited[id].forEach(function(x){
    var li = $("<li>");
    li.append( dPapers[x]["year"] );
    li.append( " [" + dJournals[ dPapers[x]["journals"][0] ]["tag"].toUpperCase() + "]");
    li.append(" - ");
    li.append("<a href='paper?id="+x+"'>" +dPapers[x]["title"]+"</a>");
    ul.append(li);
  });
  $("#c_cited").html("");
  addCollapse();
  $("#c_cited").append('<b><i class="fas fa-sign-out-alt"></i> Out-Citations:</b>');
  $("#c_cited").append(ul);
}

function loadCiteIn(){
  var ul = $("<ol>");
  ul.css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });
  dCitations[id].forEach(function(x){
    var li = $("<li>");
    li.append( dPapers[x]["year"] );
    li.append( " [" + dJournals[ dPapers[x]["journals"][0] ]["tag"].toUpperCase() + "]");
    li.append(" - ");
    li.append("<a href='paper?id="+x+"'>" +dPapers[x]["title"]+"</a>");
    ul.append(li);
  });
  $("#c_citations").html("");
  addCollapse();
  $("#c_citations").append('<b><i class="fas fa-sign-in-alt"></i> In-Citations:</b>');
  $("#c_citations").append(ul);

}

function loadPlotType() {
  var plotLabel = ["Citations "]; // TODO, "Bar graph", "Stream graph" ];
  $("#c_chart").html("");
  addCollapse();

  var fields = $("<form></form>");
  for (var i = 0; i < plotLabel.length; i++) {
    var id = "plot-" + i;
    var el = $("<input type='radio' id='" + id + "' name='plot' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function() {
      plotType = parseInt(this.value);
      plot();
    });
    fields.append(el);
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + plotLabel[i] + "</label>");
    fields.append("<span> </span>");
    fields.append("<br>");
  }
  $("#c_chart").append('<b><i class="fas fa-chart-bar"></i> Plot type: </b>');
  $("#c_chart").append(fields);

}

function loadCiteOutDegree(){

  var seen = {};
  var degrees = [];
  degrees[0] = [id];

  seen[id] = true;

  var nd = 6;

  for (var i = 1; i <= nd; i++) {
    degrees[i] = [];
    for (var j = 0; j < degrees[i - 1].length; j++) {
      var idP = degrees[i-1][j];
      for(var k=0; k<dCitations[idP].length; k++)
      { 
        var idP2 = dCitations[idP][k]
        if( seen[idP2] ) continue;
       seen[idP2] = true;
        degrees[i].push(idP2);
      }
    }
  }

  var ul = $("<ul>");
  var tot = 0;
  for (var i = 0; i <= nd; i++) {
    var per = (parseInt(10000 * degrees[i].length / dAuthors.length) / 100.);
    tot += degrees[i].length;
    var pertot = (parseInt(10000 * tot / dAuthors.length) / 100.);
    var li = $("<li>");
    li.html("<b>" + degrees[i].length + " papers</b> (" + per + "%) at distance <b>" + i + "</b>, total of <b>"+tot+" papers</b> at distance &#8804; <b>" + i + "</b> ("+pertot+"%)");
    ul.append(li);
  }
  $("#c_citations_degree").html("");
  addCollapse();
  $("#c_citations_degree").append("<b><i class='fas fa-arrow-up'></i> In-Citations degree:</b>");
  $("#c_citations_degree").append(ul);

}

function loadCiteInDegree(){
  var seen = {};
  var degrees = [];
  degrees[0] = [id];

  seen[id] = true;

  var nd = 6;

  for (var i = 1; i <= nd; i++) {
    degrees[i] = [];
    for (var j = 0; j < degrees[i - 1].length; j++) {
      var idP = degrees[i-1][j];
      for(var k=0; k<dCited[idP].length; k++)
      { 
        var idP2 = dCited[idP][k]
        if( seen[idP2] ) continue;
       seen[idP2] = true;
        degrees[i].push(idP2);
      }
    }
  }

  var ul = $("<ul>");
  var tot = 0;
  for (var i = 0; i <= nd; i++) {
    var per = (parseInt(10000 * degrees[i].length / dAuthors.length) / 100.);
    tot += degrees[i].length;
    var pertot = (parseInt(10000 * tot / dAuthors.length) / 100.);
    var li = $("<li>");
    li.html("<b>" + degrees[i].length + " papers</b> (" + per + "%) at distance <b>" + i + "</b>, total of <b>"+tot+" papers</b> at distance &#8804; <b>" + i + "</b> ("+pertot+"%)");
    ul.append(li);
  }
  $("#c_cited_degree").html("");
  addCollapse();
  $("#c_cited_degree").append("<b><i class='fas fa-arrow-down'></i> Out-Citations degree:</b>");
  $("#c_cited_degree").append(ul);

}

draw[0] = function(){

}
