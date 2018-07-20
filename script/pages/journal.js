var id = parseInt(getQueryVariable("id"));

$(function(){
  loadJournals(function(journals){
    loadPublish(function(publish){
      loadPapers(function(papers){
        loadWrote(function(wrote){
          loadAuthors(function(authors){
            parseData(journals, publish, papers, wrote, authors);
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

function parseData(journals, publish, papers, wrote, authors)
{
  console.log(journals, publish, papers, wrote, authors)

  for(var i=0; i<journals.length; i++)
  {
    dJournals[ parseInt(journals[i]["id"]) ] = journals[i];
    dJournals[ parseInt(journals[i]["id"]) ]["pubs"] = [];
  }
  for(var i=0; i<papers.length; i++)
  {
    dPapers[ parseInt(papers[i]["id"]) ] = papers[i];
    dPapers[ parseInt(papers[i]["id"]) ]["journals"] = [];
    dPapers[ parseInt(papers[i]["id"]) ]["authors"] = [];
  }
  for(var i=0; i<authors.length; i++)
  {
    dAuthors[ parseInt(authors[i]["id"]) ] = authors[i];
    dAuthors[ parseInt(authors[i]["id"]) ]["pubs"] = [];
  }

  for(var i=0; i<wrote.length; i++)
  {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    dAuthors[idA]["pubs"].push(idP);
    dPapers[idP]["authors"].push(idA);
  }

  for(var i=0; i<publish.length; i++)
  {
    var idJ = parseInt(publish[i]["idJ"]);
    var idP = parseInt(publish[i]["idP"]);
    dJournals[idJ]["pubs"].push(idP);
    dPapers[idP]["journals"].push(idJ);
  }

  loadControls();
  plot();
}

function loadControls()
{
  loadSliderYear();
  loadPapersList();
  loadAuthorsList();
}

function plot(){
  loadPapersList();
  loadAuthorsList();
  loadInfo();
}

var idPapers = [];
var auths = {};
var minYear = 1900;
var maxYear = 3000;

function loadInfo(){
  $("#c_info").html("");
  $("#c_info").append("<h3>"+dJournals[id]["name"] + " (" +(dJournals[id]["tag"].toUpperCase())+ ")</h3>");
  $("#c_info").append("<i class='fas fa-info-circle'></i> Found <b>" +idPapers.length+ "</b> papers and <b>" +Object.keys(auths).length + "</b> authors between <b>" +minYear+ "</b> and <b>" +maxYear+ "</b>");
}

function loadSliderYear(){
  minYear = d3.min(dJournals[id]["pubs"], function(d){ return +dPapers[d]["year"]; });
  maxYear = d3.max(dJournals[id]["pubs"], function(d){ return +dPapers[d]["year"]; });

  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");

  sliderYearText.html("Years: <b>"+minYear+" - "+maxYear+"</b>");
  sliderYearSlider.slider({
   range: true,
   min: minYear,
   max: maxYear,
   values: [minYear, maxYear],
   slide: function( event, ui ) {
      minYear = ui.values[0];
      maxYear = ui.values[1];
      sliderYearText.html("Years: <b>"+minYear+" - "+maxYear+"</b>");
      plot();
    }
  });

  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);
}

function loadPapersList(){
  idPapers = [];
  for(var i=0; i<dJournals[id]["pubs"].length; i++)
  {
    var dd = +dJournals[id]["pubs"][i];
    var year = +dPapers[dd]["year"];
    if( year < minYear ) continue;
    if( year > maxYear ) continue;
    idPapers.push(dd);
  }

  idPapers.sort( (a,b) => dPapers[a]["year"] - dPapers[b]["year"]);

  var ul = $("<ul>");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");

  for(var i=0; i<idPapers.length; i++)
  {
    var title = dPapers[idPapers[i]]["title"];
    var year = dPapers[idPapers[i]]["year"];
    var li = $("<li><a href='paper?id=" +idPapers[i] + "'>"+year+" - "+title+"</a></li>");
    ul.append(li);
  }

  $("#c_papers").html("");
  $("#c_papers").append('<h5><i class="fas fa-file"></i> Papers:</h5>');
  $("#c_papers").append(ul);
}

function loadAuthorsList(){
  auths = {};
  for(var i=0; i<idPapers.length; i++)
  {
    for(var j=0; j<dPapers[idPapers[i]]["authors"].length; j++)
    {
      var idA = dPapers[idPapers[i]]["authors"][j];
      if( auths[idA] == undefined ) auths[idA] = 0 ;
      auths[idA]++;
    }
  }

  var points = [];
  for(var k in auths)
    points.push([ k, auths[k] ]);
  points.sort( (a,b) => b[1] - a[1] );

  var ul = $("<ul>");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");

  for(var i=0; i<points.length; i++)
  {
    var name = dAuthors[points[i][0]]["name"]
    var li = $("<li><a href='author?id='"+ points[i][0] + "'>"+name+" (" + points[i][1] +" publications)</a></li>");
    ul.append(li);
  }

  $("#c_authors").html("");
  $("#c_authors").append('<h5><i class="fas fa-user"></i> Authors:</h5>');
  $("#c_authors").append(ul);

}
