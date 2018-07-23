var id = parseInt(getQueryVariable("id"));
var sort = 0;

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

function parseData(journals, publish, papers, wrote, authors, citations) {

  for (var i = 0; i < journals.length; i++) {
    dJournals[parseInt(journals[i]["id"])] = journals[i];
    dJournals[parseInt(journals[i]["id"])]["pubs"] = [];
  }
  for (var i = 0; i < papers.length; i++) {
    dPapers[parseInt(papers[i]["id"])] = papers[i];
    dPapers[parseInt(papers[i]["id"])]["journals"] = [];
    dPapers[parseInt(papers[i]["id"])]["authors"] = [];
    dCitations[ parseInt(papers[i]["id"]) ] = [];
  }

  for(var i = 0; i< citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    dCitations[idP1].push(idP2);
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

  loadControls();
  plot();
}

function loadControls() {
  loadSort();
  loadSliderYear();
  loadPapersList();
  loadAuthorsList();
}

function plot() {
  loadPapersList();
  loadAuthorsList();
  loadInfo();
}

var idPapers = [];
var auths = {};
var minYear = 1900;
var maxYear = 3000;

function loadSort() {
  var sortLabel = ["Year", "Name", "Citations"];
  $("#c_sort").html("");
  addCollapse();

  var label = $("<label for='sort'>Sort by: </label>");
  var fields = $("<form></form>");
  for (var i = 0; i < sortLabel.length; i++) {
    var id = "sort-" + i;
    var el = $("<input type='radio' name='sort' id='" + id + "' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function() {
      sort = parseInt(this.value);
      plot();
    });
    fields.append(el)
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + sortLabel[i] + "</label>");
    fields.append("<br>");
  }
  $("#c_sort").append('<b><i class="fas fa-sort-amount-up"></i> Sort by:</b>');
  $("#c_sort").append(fields);
}

function loadInfo() {
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<i class='fas fa-info-circle'></i> <b>[" + dJournals[id]["tag"].toUpperCase() + "] " + dJournals[id]["name"] + "</b><br>");
  $("#c_info").append("Found <b>" + idPapers.length + "</b> papers and <b>" + Object.keys(auths).length + "</b> authors between <b>" + minYear + "</b> and <b>" + maxYear + "</b>");
}

function loadSliderYear() {
  minYear = d3.min(dJournals[id]["pubs"], function(d) {
    return +dPapers[d]["year"];
  });
  maxYear = d3.max(dJournals[id]["pubs"], function(d) {
    return +dPapers[d]["year"];
  });

  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");

  sliderYearText.html("<b>Years: " + minYear + " - " + maxYear + "</b>");
  sliderYearSlider.slider({
    range: true,
    min: minYear,
    max: maxYear,
    values: [minYear, maxYear],
    slide: function(event, ui) {
      minYear = ui.values[0];
      maxYear = ui.values[1];
      sliderYearText.html("Years: <b>" + minYear + " - " + maxYear + "</b>");
      plot();
    }
  });

  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  addCollapse();
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);
}

function loadPapersList() {
  idPapers = [];
  for (var i = 0; i < dJournals[id]["pubs"].length; i++) {
    var dd = +dJournals[id]["pubs"][i];
    var year = +dPapers[dd]["year"];
    if (year < minYear) continue;
    if (year > maxYear) continue;
    idPapers.push(dd);
  }

  var sortF = [];
  sortF[0] = ((a, b) => dPapers[a]["year"] - dPapers[b]["year"]);
  sortF[1] = ((a, b) => dPapers[a]["title"] < dPapers[b]["title"] ? -1 : 1);
  sortF[2] = ((a, b) => dCitations[b].length - dCitations[a].length);
  idPapers.sort(sortF[sort]);

  var ul = $("<ol>");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");

  for (var i = 0; i < idPapers.length; i++) {
    var title = dPapers[idPapers[i]]["title"];
    var year = dPapers[idPapers[i]]["year"];
    var li = $("<li>" + year + " - <a href='paper?id=" + idPapers[i] + "'>"+ title + "</a> (cited "+dCitations[idPapers[i]].length+" times)</li>");
    ul.append(li);
  }

  $("#c_papers").html("");
  addCollapse();
  $("#c_papers").append('<b><i class="fas fa-file"></i> Papers:</b>');
  $("#c_papers").append(ul);
}

function loadAuthorsList() {
  auths = {};
  for (var i = 0; i < idPapers.length; i++) {
    for (var j = 0; j < dPapers[idPapers[i]]["authors"].length; j++) {
      var idA = dPapers[idPapers[i]]["authors"][j];
      if (auths[idA] == undefined) auths[idA] = 0;
      auths[idA]++;
    }
  }

  var points = [];
  for (var k in auths)
    points.push([k, auths[k]]);
  points.sort((a, b) => b[1] - a[1]);

  var ul = $("<ol>");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");

  for (var i = 0; i < points.length; i++) {
    var name = dAuthors[points[i][0]]["name"]
    var li = $("<li><a href='author?id='" + points[i][0] + "'>" + name + " (" + points[i][1] + " publications)</a></li>");
    ul.append(li);
  }

  $("#c_authors").html("");
  addCollapse();
  $("#c_authors").append('<b><i class="fas fa-user"></i> Authors:</b>');
  $("#c_authors").append(ul);

}
