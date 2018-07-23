var plotFunctions = [];
var sort = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var journalsBanned = {};
var plotTypeChart = 0;

$(function() {
  loadAuthors(function(authors) {
    loadWrote(function(wrote) {
      loadPapers(function(papers) {
        loadPublish(function(publish) {
          loadJournals(function(journals) {
            loadCitations(function(citations) {
              parseData(authors, wrote, papers, publish, journals, citations);
            });
          });
        });
      });
    });
  });
});

var data = [];
var name2id = {};

var dJournals = [];
var wrotePJ = {};

var dCitations = {};
var pData = []

function parseData(authors, wrote, papers, publish, journals, citations) {
  dJournals = journals;

  for(var i=0; i<journals.length; i++)
    journalsBanned[+journals[i]["id"]] = false;

  for(var i=0; i<citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    if( dCitations[idP1] == undefined ) dCitations[idP1] = [];
    dCitations[idP1].push(idP2);
  }

  for (var i = 0; i < authors.length; i++) {
    name2id[authors[i]["name"]] = parseInt(authors[i]["id"]);
    data[parseInt(authors[i]["id"])] = authors[i];
    data[parseInt(authors[i]["id"])]["pubs"] = [];
    data[parseInt(authors[i]["id"])]["minYear"] = 3000;
    data[parseInt(authors[i]["id"])]["maxYear"] = 1000;
  }
  for (var i = 0; i < papers.length; i++)
    pData[parseInt(papers[i]["id"])] = papers[i];

  for(var i=0; i<publish.length; i++)
    pData[ +publish[i]["idP"] ]["journals"] = [+publish[i]["idJ"]];

  for (var i = 0; i < wrote.length; i++) {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    data[idA]["pubs"].push(pData[idP]);
    data[idA]["minYear"] = Math.min(data[idA]["minYear"], parseInt(pData[idP]["year"]));
    data[idA]["maxYear"] = Math.max(data[idA]["maxYear"], parseInt(pData[idP]["year"]));
  }

  for (var i = 0; i < publish.length; i++) {
    var idP = +publish[i]["idP"];
    var idJ = +publish[i]["idJ"];
    wrotePJ[idP] = idJ;
  }
  loadControls();
  plot();
}

function loadControls() {
  loadSort();
  loadSliderYear();
  loadPlotType();
  loadScaleType();
}

function loadSort() {
  var sortLabel = ["Year", "Name", "Number of citations"];
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

function loadScaleType() {
  var plotLabel = ["x: Log - y: Log", "x: Lin - y: Log", "x: Log - y: Lin", "x: Lin - y: Lin"];
  $("#c_plot_type").html("");
  addCollapse();

  var fields = $("<form></form>");
  for (var i = 0; i < plotLabel.length; i++) {
    var id = "axis-" + i;
    var el = $("<input type='radio' name='axis' id='" + id + "' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function() {
      plotType = parseInt(this.value);
      drawDegree(filterData); // plot();
    });
    fields.append(el)
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + plotLabel[i] + "</label>");
    fields.append("<br>");
  }
  $("#c_plot_type").append('<b><i class="fas fa-sort-amount-up"></i> Axis scales:</b>');
  $("#c_plot_type").append(fields);
}

function loadSliderYear() {
  minYear = 3000;
  maxYear = 1000;
  for (var i = 0; i < data.length; i++)
    minYear = Math.min(minYear, data[i]["minYear"]);
  for (var i = 0; i < data.length; i++)
    maxYear = Math.max(maxYear, data[i]["maxYear"]);
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

  $("#c_slider_years").html("");
  addCollapse();
  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);

}

function loadPlotType() {
  var plotLabel = ["Stacked bars", "Streamgraph paper/year", "Citations timeline", "Papers timeline"]; // TODO, "Bar graph", "Stream graph" ];
  $("#c_chart").html("");
  addCollapse();

  var fields = $("<form></form>");
  for (var i = 0; i < plotLabel.length; i++) {
    var id = "plot-" + i;
    var el = $("<input type='radio' id='" + id + "' name='plot' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function() {
      plotTypeChart = parseInt(this.value);
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


function filter() {
  var ret = pData.filter(function(pp){
    if( pp["year"] < minYear ) return false;
    if( pp["year"] > maxYear ) return false;
    if( journalsBanned[ pp["journals"][0] ] ) return false;
    return true;
  });

  for (var i = 0; i < dJournals.length; i++)
    dJournals[i]["pubs"] = [];

  for(var i=0; i<ret.length; i++)
  {
    dJournals[ ret[i]["journals"][0] ]["pubs"].push(ret[i]["id"]);
  }

  for (var i = 0; i < dJournals.length; i++)
  {
    dJournals[i]["citations"] = d3.sum(dJournals[i]["pubs"], x => (dCitations[x]||[]).length ) || 0 ;
    dJournals[i]["minYear"] = d3.min(dJournals[i]["pubs"], x => +pData[x]["year"] ) || 0 ;
    dJournals[i]["maxYear"] = d3.max(dJournals[i]["pubs"], x => +pData[x]["year"] ) || 0;
  }
  return ret;
}

var filterData = [];

function plot() {
  filterData = filter();
  updateInfo(filterData);
  updateList(filterData);
  plotFunctions[plotTypeChart](filterData);
  drawDegree(filterData);
  updatePapers(filterData);
}

function updateInfo(dataF) {
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<div><i class='fas fa-info-circle'></i> <b>" + pData.length + "</b> total papers in dataset</div>");
  $("#c_info").append("<div>Selected <b>" + dataF.length + "</b> papers published in the years <b>" + minYear + "</b> - <b>" + maxYear + "</b></div>");
}

function updateList(dataF) {

  var sortF = [];
  sortF[0] = (a,b) => a["tag"] < b["tag"] ? -1 : 1;

  var dJournalsC = dJournals.slice().sort( sortF[0] );

  var list = $("<div>");
  for (var i = 0; i < dJournalsC.length; i++)
  {
    var j = $("<div></div>");
    j.append($("<input type=checkbox "+ (journalsBanned[dJournalsC[i]["id"]] == true ? "" : "checked") + " />").on("change", (function(id){
       return function(){
        journalsBanned[ +dJournals[id]["id"] ] = !journalsBanned[+dJournals[id]["id"]];
        plot();
      }
    })(dJournalsC[i]["id"])));
    j.append(" ");
    j.append("<a href='journal?id=" + dJournalsC[i]["id"] + "'>[" +dJournalsC[i]["tag"].toUpperCase()+ "] " +dJournalsC[i]["name"]+ "</a>");
    j.append(" <b>" + dJournalsC[i]["pubs"].length + "</b> papers between "+dJournalsC[i]["minYear"]+" and "+dJournalsC[i]["maxYear"]);
    list.append(j);
  }

  $("#c_journals").html("");
  addCollapse();
  $("#c_journals").append('<b><i class="fas fa-book"></i> Journals: </b>');
  $("#c_journals").append(list);
}

$(window).resize(plot);
function updatePapers(dataF) {

  var sortF = [];

  sortF[0] = function(a,b){
    var diff = a["year"] - b["year"];
    return diff == 0 ? sortF[1](a,b) : diff;
  };
  sortF[1] = (a,b) => a["title"] < b["title"] ? -1 : 1;
  sortF[2] = ((a,b) => (dCitations[b["id"]]||[]).length - (dCitations[a["id"]]||[]).length);

  dataF = dataF.slice().sort( sortF[ sort ] );

  var list = $("<ol>");
  list.css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });

  for (var i = 0; i < dataF.length; i++)
  {
    var li = $("<li>");
    li.append(dataF[i]["year"]);
    li.append(" ");
    li.append( "<a href='journal?id="+dJournals[ dataF[i]["journals"][0] ]["id"]+"'>[" + dJournals[ dataF[i]["journals"][0] ]["tag"].toUpperCase() + "]</a>");
    li.append(" ");
    li.append("<a href='paper?id="+dataF[i]["id"]+"'>" + dataF[i]["title"] + "</a>");
    li.append(" ");
    li.append( (dCitations[dataF[i]["id"]]||[]).length + " citations");
    list.append(li);
  }

  $("#c_papers").html("");
  addCollapse();
  $("#c_papers").append('<b><i class="fas fa-file"></i> Papers: </b>');
  $("#c_papers").append(list);
}


function drawDegree(dataP) {
  var margin = {
    top: 20,
    right: 20,
    bottom: 60,
    left: 60
  };
  var width = $("#c_plot_degree").width() - margin.left - margin.right,
    height = $("#c_plot_degree").width()*3/4 - margin.top - margin.bottom;

  $("#c_plot_degree").html("");
  addCollapse();
  $("#c_plot_degree").append('<b><i class="fas fa-chart-line"></i> Network degree distribution:</b>');

  var svg = d3.select("#c_plot_degree")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.selectAll("*").remove();
  g = svg.append("g");

  degreeCount = {};
  for (var i=0; i<dataP.length; i++)
  {
    var count = (dCitations[ dataP[i]["id"] ]||[]).length;
    if (degreeCount[count] == undefined)
      degreeCount[count] = 0;
    degreeCount[count]++;
  }

  if( plotType == 0 || plotType == 2 ) delete degreeCount[0];

  var points = [];
  for (var deg in degreeCount)
    points.push([parseInt(deg), degreeCount[deg]]);

  points.sort((a, b) => a[0] - b[0]);

  var x, y;

  if (plotType == 0 || plotType == 2) x = d3.scaleLog().range([0, width]).nice();
  else x = d3.scaleLinear().range([0, width]).nice();

  if (plotType == 0 || plotType == 1)
    y = d3.scaleLog().range([height, 0]).nice();
  else
    y = d3.scaleLinear().range([height, 0]).nice();

  x.domain(d3.extent(points, function(d) {
    return d[0];
  }));
  y.domain(d3.extent(points, function(d) {
    return d[1];
  }));

  var line = d3.line()
    .x(function(d) {
      return x(d[0]);
    })
    .y(function(d) {
      return y(d[1]);
    });

  // Add the valueline path.
  svg.append("path")
    .datum(points)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("d", line);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0f")))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".0f")));

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#papers");

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 30) + ")")
    .style("text-anchor", "middle")
    .text("#citations");

  // Prep the tooltip bits, initial display is hidden
  tooltip = g.append("g")
    .style("display", "none")
    .style("opacity", 1)
    .style("z-index", 1000);

  tooltip.append("rect")
    .attr("width", 160)
    .attr("height", 20)
    .attr("fill", "white")
    .style("text-align", "center")
    .style("opacity", .5)
    .style("z-index", 1000);

  tooltip.append("text")
    .attr("x", 80)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .style("text-align", "center")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");

}


plotFunctions[0] = function(){

}
plotFunctions[1] = function(){

}
plotFunctions[2] = function(){

}
plotFunctions[3] = function(){

}
