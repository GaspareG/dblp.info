var id = +getQueryVariable("id");

$(function() {
  loadJournals(function(journals) {
    loadPublish(function(publish) {
      loadPapers(function(papers) {
        loadWrote(function(wrote) {
          loadAuthors(function(authors) {
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
var paper2id = {};

function parseData(journals, publish, papers, wrote, authors) {

  for (var i = 0; i < journals.length; i++) {
    dJournals[parseInt(journals[i]["id"])] = journals[i];
    dJournals[parseInt(journals[i]["id"])]["pubs"] = [];
  }
  for (var i = 0; i < papers.length; i++) {
    dPapers[parseInt(papers[i]["id"])] = papers[i];
    dPapers[parseInt(papers[i]["id"])]["journals"] = [];
    dPapers[parseInt(papers[i]["id"])]["authors"] = [];
    paper2id[papers[i]["title"]] = parseInt(papers[i]["id"]);
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
  loadSliderYear();
  loadCheckJournals();
  loadChart();
  loadDegree();
}

var minYear = 0;
var maxYear = 0;

function loadSliderYear() {

  minYear = d3.min(dAuthors[id]["pubs"], x => dPapers[x]["year"]);
  maxYear = d3.max(dAuthors[id]["pubs"], x => dPapers[x]["year"]);

  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");

  sliderYearText.html("<b>Years of publications: " + minYear + " - " + maxYear + "</b>");
  sliderYearSlider.slider({
    range: true,
    min: minYear,
    max: maxYear,
    values: [minYear, maxYear],
    slide: function(event, ui) {
      minYear = ui.values[0];
      maxYear = ui.values[1];
      sliderYearText.html("<b>Years of publications: " + minYear + " - " + maxYear + "</b>");
      plot();
    }
  });

  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);

}

var journalsBanned = {};

function loadCheckJournals() {
  var list = $("<div>");
  for (var i = 0; i < dJournals.length; i++) {
    journalsBanned[+dJournals[i]["id"]] = false;
    var j = $("<div></div>");
    j.append($("<input type=checkbox checked id='check-" + dJournals[i]["id"] + "' />"))
    j.append($("<label for='check-" + dJournals[i]["id"] + "'>").html(" " + dJournals[i]["name"]).css("cursor", "pointer").on("click", (function(id) {
      return function() {
        journalsBanned[+dJournals[id]["id"]] = !journalsBanned[+dJournals[id]["id"]];
        plot();
      };
    })(dJournals[i]["id"])));
    list.append(j);
  }
  $("#c_journals").html("");
  $("#c_journals").append('<b><i class="fas fa-book"></i> Journals: </b>');
  $("#c_journals").append(list);
}

var plotType = 0;

function loadChart() {
  var plotLabel = ["Career timeline per paper", "Career timeline per year"]; // TODO, "Bar graph", "Stream graph" ];
  $("#c_chart").html("");

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

function filterData() {
  return dAuthors[id]["pubs"].filter(function(id) {
    if (dPapers[id]["year"] < minYear) return false;
    if (dPapers[id]["year"] > maxYear) return false;
    if (journalsBanned[dPapers[id]["journals"][0]]) return false;
    return true;
  }).sort((a, b) => dPapers[b]["year"] - dPapers[a]["year"]);
}

function plot() {
  var filter = filterData();
  loadInfo(filter);
  loadFPapers(filter);
  loadCoauthors(filter);
  draw(filter);
}

function loadInfo(filter) {
  $("#c_info").html("");
  $("#c_info").append("<b><i class='fas fa-info-circle'></i> " + dAuthors[id]["name"] + "</b>");
  $("#c_info").append("<div>Found <b>" + filter.length + "</b> papers between <b>" + minYear + "</b> and <b>" + maxYear + "</b> in selected journals</div>");

  // <b>" +data.length+ "</b> total papers in dataset</div>");
  //  $("#c_info").append("<div>Selected <b>" +dataF.length+ "</b> authors with number of publications between <b>" +minPub+ "</b> and <b>" +maxPub+ "</b> in the years <b>" +minYear+ "</b> - <b>" +maxYear+ "</b>  </div>");
}

function loadFPapers(filter) {
  var ul = $("<ul>").append(filter.map(function(idP) {
    var li = $("<li>");
    var paper = dPapers[idP];
    li.append($("<a>").attr("href", "paper?id" + paper["id"]).text(
      paper["year"] + " [" + dJournals[paper["journals"][0]]["tag"].toUpperCase() + "] " + paper["title"]
    ));
    return li;
  })).css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });
  $("#c_papers").html("");
  $("#c_papers").append("<b><i class='fas fa-file'></i> Papers:</b>");
  $("#c_papers").append(ul);
}

var coauths = [];

function loadCoauthors(filter) {

  var coauth = {};
  filter.forEach(function(idP) {
    dPapers[idP]["authors"].forEach(function(idA) {
      if (coauth[idA] == undefined) coauth[idA] = [];
      coauth[idA].push(idP);
    });
  });
  delete coauth[id];

  var ul = $("<ul>");
  ul.css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });

  coauths = [];
  for (var k in coauth) coauths.push([+k, coauth[k]]);
  coauths.sort((a, b) => b[1].length - a[1].length);

  for (var k = 0; k < coauths.length; k++) {
    ul.append(
      $("<li></li>").append(
        $("<a>").attr("href", "author?id" + coauths[k][0]).text(
          dAuthors[coauths[k][0]]["name"] + " (" + coauths[k][1].length + " common papers)"
        )
      )
    );
  }

  $("#c_coauthors").html("");
  $("#c_coauthors").append("<b><i class='fas fa-share-alt'></i> Coauthors:</b>");
  $("#c_coauthors").append(ul);

}

function draw(filter) {
  $("#c_plot").html("").css({
    "max-height": "600px",
    "overflow-y": "scroll"
  });
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot</b>");

  var margin = {
    top: 50,
    right: 25,
    bottom: 25,
    left: 150
  };
  var width = (3 + filter.length) * 30 - margin.left - margin.right,
    height = ((2 + coauths.length) * 20) - margin.top - margin.bottom;

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var y = d3.scalePoint().domain([
    [id, filter.length]
  ].concat(coauths).map(function(d) {
    return dAuthors[d[0]]["name"]
  })).range([20, height]);

  var x = d3.scalePoint().domain(filter.map(function(d) {
    return d
  })).range([width, 20]);

  var yAxis = d3.axisLeft(y);
  var xAxis = d3.axisTop(x);

  svg.call(yAxis).selectAll("text")
    .attr("stroke", "#999")
    .style("cursor", "pointer")
    .style("font-size", "14px")

  svg.append("g").call(xAxis).selectAll("text")
    .attr("stroke", "#999")
    .style("cursor", "pointer")
    .style("font-size", "14px")
    .attr("transform", "rotate(45)")
    .attr("y", -20)
    .attr("x", -30)
    .attr("dy", "1em")

  coauths.push([id, dAuthors[id]["pubs"]]);

  for (var i = 0; i < coauths.length; i++) {
    var idA = dAuthors[coauths[i][0]]["name"];
    var minX = 100000;
    var maxX = 0;
    for (var j = 0; j < coauths[i][1].length; j++) {
      var idP = coauths[i][1][j];
      minX = Math.min(x(idP), minX);
      maxX = Math.max(x(idP), maxX);
      svg.append("g").append("circle")
        .attr("cx", x(idP))
        .attr("cy", y(idA))
        .attr("r", 5)
        .attr("stroke", d3.interpolateRdYlGn(1 - y(idA) / height))
        .attr("fill", d3.interpolateRdYlGn(1 - y(idA) / height))
        .attr("fill-opacity", ".5")
    }
    svg.append("g").append("line")
      .attr("x1", minX)
      .attr("x2", maxX)
      .attr("y1", y(idA))
      .attr("y2", y(idA))
      .attr("stroke", d3.interpolateRdYlGn(1 - y(idA) / height))
      .attr("fill", d3.interpolateRdYlGn(1 - y(idA) / height))
      .attr("fill-opacity", ".5")

  }
}


function loadDegree() {

  var seen = {};
  var degrees = [];
  degrees[0] = [id];

  for (var i = 1; i <= 6; i++) {
    degrees[i] = [];
    for (var j = 0; j < degrees[i - 1].length; j++) {
      for (var k = 0; k < dAuthors[degrees[i - 1][j]]["pubs"].length; k++) {
        var idPub = dAuthors[degrees[i - 1][j]]["pubs"][k];
        for (var l = 0; l < dPapers[idPub]["authors"].length; l++) {
          var idA = dPapers[idPub]["authors"][l];
          if (seen[idA] != undefined) continue;
          seen[idA] = true;
          degrees[i].push(idA);
        }
      }
    }
  }

  var ul = $("<ul>");
  var tot = 0;
  for (var i = 0; i <= 6; i++) {
    var per = (parseInt(10000 * degrees[i].length / dAuthors.length) / 100.);
    tot = parseInt(100 * (tot + per)) / 100;
    var li = $("<li>");
    li.html("<b>" + degrees[i].length + " authors</b> (" + per + "%) at distance <b>" + i + "</b> (" + tot + "% at distance <= " + i + ")");
    ul.append(li);
  }
  $("#c_degree").html();
  $("#c_degree").append("<b><i class='fas fa-code-branch'></i> Separations degree:</b>");
  $("#c_degree").append(ul);

}
