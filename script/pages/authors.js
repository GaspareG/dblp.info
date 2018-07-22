var plotFunctions = [];
var filterFunctions = [];
var plotDescr = [];
var sort = 0;
var minPub = 0;
var maxPub = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var selectedId = getQueryVariable("ids");
if( selectedId == undefined ) selectedId = [];
else selectedId = selectedId.split(",").map( x => +x);

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

function parseData(authors, wrote, papers, publish, journals, citations) {
  dJournals = journals;

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
  var pData = []
  for (var i = 0; i < papers.length; i++)
    pData[parseInt(papers[i]["id"])] = papers[i];

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
  loadSearch();
  loadSort();
  loadSliderPub();
  loadSliderYear();
  //  loadJournalsCheck();
  updateAuthors();
  loadPlotType();
  filterFunctions[plotType]();
}

function loadSearch() {
  $("#c_search").html("");
  addCollapse();
  var input = $("<input id='author'>");

  var names = [];
  for (var k in name2id) names.push(k);
  input.autocomplete({
    source: names,
    minLength: 3,
    autoFocus: true,
    select: function(event, ui) {
      var id = +name2id[ui.item.value];
      if( selectedId.indexOf(id) != -1 ) return;
      selectedId.push(id);
      updateAuthors();
      plot();
    }
  });

  $("#c_search").append('<b><i class="fas fa-search"></i> Search author:</b>');
  $("#c_search").append("<span> </span>");
  $("#c_search").append(input);
}

function updateAuthors()
{
  if( selectedId.length > 0 ) updateQueryStringParam("ids", selectedId.join(","));
  var ol = $("<ol>").css("padding-left", "50px");
  for(var i=0; i<selectedId.length; i++)
  {
    var li = $("<li>")
    li.append( $("<a>").text( data[selectedId[i]]["name"] ).attr("href", "author?id=" + selectedId[i]) )
      .append(" - ")
      .append( $("<i class='fas fa-times'></i>").css({"color":"red","cursor": "pointer"}).on("click", (function(id){
        return function(){
          var pos = selectedId.indexOf(id);
          selectedId = selectedId.slice(0, pos).concat(selectedId.slice(pos+1));
          updateAuthors();
        }
      })(selectedId[i])))
    ol.append(li);
  }
  $("#c_selected").html("");
  addCollapse();
  $("#c_selected").append('<b><i class="fas fa-user"></i> Selected authors:</b>');
  $("#c_selected").append(ol);
}

function loadSort() {
  var sortLabel = ["Name", "Year", "Number of publications"];
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

function loadSliderPub() {
  minPub = 1;
  maxPub = 0;
  for (var i = 0; i < data.length; i++)
    maxPub = Math.max(maxPub, data[i]["pubs"].length);
  var sliderPubText = $("<span></span>");
  var sliderPubSlider = $("<div id='slider_pub'></div>");

  sliderPubText.html("<b>Number of publications: 10 - 128</b>");
  sliderPubSlider.slider({
    range: true,
    min: minPub,
    max: maxPub,
    values: [minPub, maxPub],
    slide: function(event, ui) {
      minPub = ui.values[0];
      maxPub = ui.values[1];
      sliderPubText.html("<b>Number of publications: " + minPub + " - " + maxPub + "</b>");
      plot();
    }
  });

  addCollapse();
  $("#c_slider_pub").append('<i class="fas fa-list-ol"></i> ');
  $("#c_slider_pub").append(sliderPubText);
  $("#c_slider_pub").append("<div></div>");
  $("#c_slider_pub").append(sliderPubSlider);
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

  addCollapse();
  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);

}

function loadPlotType() {
  var plotLabel = ["Career timeline", "Papers/Citations scatterplot"]; // TODO, "Bar graph", "Stream graph" ];
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
    var optimalView = $("<span>(optimal filters)</span>");
    optimalView.css("color", "#007bff");
    optimalView.css("cursor", "pointer");
    optimalView.on("click", (function(i) {
      return function() {
        filterFunctions[i]();
      }
    })(i));
    fields.append(el);
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + plotLabel[i] + "</label>");
    fields.append("<span> </span>");
    fields.append(optimalView);
    fields.append("<br>");
  }
  $("#c_chart").append('<b><i class="fas fa-chart-bar"></i> Plot type: </b>');
  $("#c_chart").append(fields);

}

var journalsBanned = {};

function loadJournalsCheck() {
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
  addCollapse();
  $("#c_journals").append('<b><i class="fas fa-book"></i> Journals: </b>');
  $("#c_journals").append(list);
}

var sortF = [];
sortF[0] = (a, b) => (a["name"] < b["name"] ? -1 : 1);
sortF[1] = (a, b) => (a["minYear"] - b["minYear"]);
sortF[2] = (a, b) => (b["pubs"].length - a["pubs"].length);

function filter() {
  var ret = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i]["pubs"].length < minPub) continue;
    if (data[i]["pubs"].length > maxPub) continue;
    if (data[i]["minYear"] < minYear) continue;
    if (data[i]["maxYear"] > maxYear) continue;
    ret.push(data[i]);
    //    ret[ret.length-1]["pubs"] = data[i]["pubs"].filter(function(paper){
    //      return !journalsBanned[ wrotePJ[paper["id"]] ];
    //   });
  }
  ret.sort(sortF[sort]);
  return ret;
}

var filterData = [];

function plot() {
  filterData = filter();
  updateInfo(filterData);
  updateList(filterData);
  updateQuote(filterData);
  plotFunctions[plotType](filterData);
}

function updateInfo(dataF) {
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<div><i class='fas fa-info-circle'></i> <b>" + data.length + "</b> total authors in dataset</div>");
  $("#c_info").append("<div>Selected <b>" + dataF.length + "</b> authors with number of publications between <b>" + minPub + "</b> and <b>" + maxPub + "</b> in the years <b>" + minYear + "</b> - <b>" + maxYear + "</b>  </div>");
}

function updateList(data) {
  $("#c_authors").html("");
  addCollapse();
  var list = $("<ol></ol>");
  list.css("max-height", "376px");
  list.css("overflow-y", "scroll");
  list.css("padding-left", "50px");
  for (var i = 0; i < data.length; i++) {
    var el = $("<li><a href='author?id=" + data[i]["id"] + "'>" + data[i]["name"] + "</a> (" + data[i]["pubs"].length + " publications between " + data[i]["minYear"] + " and " + data[i]["maxYear"] + ")</li>");
    el.hover((function(i) {
      return function() {
        if( selectedId.indexOf(i) == -1 )
          selectedId.push(i);
        plotFunctions[plotType](filterData);
      }
    })(+data[i]["id"]), (function(i){ return function() {
      if( selectedId.indexOf(i) != -1 ){
      var pos = selectedId.indexOf(i);
      selectedId = selectedId.slice(0, pos).concat(selectedId.slice(pos+1));;
      plotFunctions[plotType](filterData);
      }
      }
    })(+data[i]["id"]));
    list.append(el);
  }
  $("#c_authors").html("<b><i class='fas fa-users'></i> Authors list:</b>");
  addCollapse();
  $("#c_authors").append(list);
}

filterFunctions[0] = function() {
  $("#sort-0").attr("checked", false);
  $("#sort-1").attr("checked", false);
  $("#sort-2").attr("checked", true);
  sort = 2;
  minPub = 10;
  maxPub = 127;
  $("#slider_pub").slider("values", 0, minPub);
  $("#slider_pub").slider("values", 1, maxPub);
  //$("#slider_pub").slider('option', 'slide')(null, { values: $("#slider_pub").slider('values') })
}

function updateQuote(data) {

  for(var i=0; i<data.length; i++)
  {
    data[i]["citations"] = 0;
    for(var j=0; j<data[i]["pubs"].length; j++)
    {
      var idP = +data[i]["pubs"][j]["id"];
      if( dCitations[idP] == undefined ) continue;
      data[i]["citations"] += dCitations[+idP].length;
    }
  }

  data.sort( (a,b) => b["citations"] - a["citations"] );
  $("#c_cited").html("");
  addCollapse();
  var list = $("<ol></ol>");
  list.css("max-height", "376px");
  list.css("overflow-y", "scroll");
  list.css("padding-left", "50px");
  for (var i = 0; i < data.length; i++) {
    var el = $("<li><a href='author?id=" + data[i]["id"] + "'>" + data[i]["name"] + "</a> (" + data[i]["citations"] + " citations)</li>");
    list.append(el);
  }
  $("#c_cited").html("<b><i class='fas fa-quote-right'></i> Most cited authors:</b>");
  addCollapse();
  $("#c_cited").append(list);
}

$(window).resize(plot);

plotDescr[0] = "In this plot we have in the x-axis the years of career (starting from the year of the first publication of each authors) ";
plotDescr[0] += "and in the y-axis we have the number of publications so far.<br>";
plotDescr[0] += "Each path is an author career, its point correspond to the years in which the author has made af least one publications<br>";
plotDescr[0] += "<b>Mouse over a dot to highlight its path!</b>";

plotDescr[1] = "In this plot we have in the x-axis the number of papers wrote ";
plotDescr[1] += "and in the y-axis the number of citations<br>";
plotDescr[1] += "Each author is represented by a single dot with coordinate (number of his papers, number of citations to his papers)";

plotFunctions[0] = function(data) {
  // Chart 1
  var margin = {
    top: 25,
    right: 40,
    bottom: 55,
    left: 55
  };
  var width = $("#c_plot").width() - margin.left - margin.right,
    height = $("#c_plot").width()*3/4 - margin.top - margin.bottom;

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  $("#c_plot").append("<div>" + plotDescr[plotType] + "</div>");


  var minX = 0;
  var minY = 0;
  var maxX = 0;
  var maxY = 0;

  for (var i = 0; i < data.length; i++) {
    maxX = Math.max(maxX, data[i]["maxYear"] - data[i]["minYear"]);
    maxY = Math.max(maxY, data[i]["pubs"].length);
  }

  // X AXIS - year
  var x = d3.scaleLinear().range([0, width]);
  x.domain([minX, maxX + 1]).nice();

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 25) + ")")
    .style("text-anchor", "middle")
    .text("years of career");

  // Y AXIS - n pub
  var y = d3.scaleLinear().range([height, 0]);
  y.domain([minY, maxY + 1]).nice();

  svg.append("g").call(d3.axisLeft(y).ticks(20));
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(16));


  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#publications");

  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", "1");

  // Data plot
  for (var i = 0; i < data.length; i++) {
    var years = [];
    for (var k = 0; k < data[i]["pubs"].length; k++)
      years.push(parseInt(data[i]["pubs"][k]["year"]));
    years.sort();

    for (var k = 1; k < years.length; k++)
      years[k] -= years[0];
    years[0] = 0;

    var contYear = {};
    for (var k = 0; k < years.length; k++)
      contYear[years[k]] = 0;
    for (var k = 0; k < years.length; k++)
      contYear[years[k]]++;

    var points = [];
    for (var k in contYear)
      points.push([k, contYear[k], data[i]["name"], data[i]["pubs"].length, data[i]["id"]]);
    points.sort((a, b) => a[0] - b[0]);

    for (var k = 1; k < points.length; k++)
      points[k][1] += points[k - 1][1];

    var line = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))

    svg.append("path")
      .attr("d", line(points))
      .attr("class", "path-" + data[i]["id"])
      .attr("stroke", selectedId.indexOf(+data[i]["id"]) != -1 ? "red" : "steelblue")
      .attr("stroke-width", selectedId.indexOf(+data[i]["id"]) != -1 ? 2 : 1)
      .attr("stroke-opacity", selectedId.indexOf(+data[i]["id"]) != -1 ? 1 : .25)
      .attr("fill", "none");

    svg.selectAll("dot")
      .data([points[points.length - 1]])
      .enter().append("circle")
      .attr("r", 4)
      .attr("cx", function(d) {
        return x(d[0]);
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("stroke", selectedId.indexOf(+data[i]["id"]) != -1 ? "red" : "steelblue")
      .style("z-index", selectedId.indexOf(+data[i]["id"]) != -1 ? "1000" : "1")
      .attr("fill", selectedId.indexOf(+data[i]["id"]) != -1 ? "red" : "steelblue")
      .attr("stroke-width", selectedId.indexOf(+data[i]["id"]) != -1 ? 2 : 1)
      .attr("stroke-opacity", selectedId.indexOf(+data[i]["id"]) != -1 ? 1 : .25)
      .attr("fill-opacity", .3)
      .style("cursor", "pointer")
      .on("click", function(d){ location.href = "author?id="+d[4]; })
      .on("mouseover", function(d) {
          d3.select(this).attr("fill", "red").attr("fill-opacity", 1);
          d3.select(".path-" + d[4]).attr("stroke", "red").attr("stroke-opacity", 1)
          tooltip.style("display", "block");
          tooltip.html(d[2] + "<br>" + d[3] + " papers in " + d[0] + " years"  )
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          console.log( selectedId.indexOf( +d[4] ), +d[4] );
          tooltip.style("display", "none");
          if( selectedId.indexOf( +d[4] ) != -1 ) return;
          d3.select(this).attr("fill", "steelblue").attr("fill-opacity", .3);
          d3.select(".path-" + d[4]).attr("stroke", "steelblue").attr("stroke-opacity", .25)
      });

  }

};

plotFunctions[1] = function(data) {
  // Chart 1
  var margin = {
    top: 25,
    right: 40,
    bottom: 55,
    left: 55
  };
  var width = $("#c_plot").width() - margin.left - margin.right,
    height = $("#c_plot").width()*3/4 - margin.top - margin.bottom;

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  $("#c_plot").append("<div>" + plotDescr[plotType] + "</div>");


  var minX = 0;
  var minY = 0;
  var maxX = 0;
  var maxY = 0;

  maxX = d3.max(data, a => a["pubs"].length);
  maxY = d3.max(data, a => a["citations"]);

  // X AXIS - year
  var x = d3.scaleLinear().range([0, width]).domain([minX, maxX]).nice()

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 25) + ")")
    .style("text-anchor", "middle")
    .text("#papers");

  // Y AXIS - n pub
  var y = d3.scaleLinear().range([height, 0]).domain([minY, maxY + 1]).nice();

  svg.append("g").call(d3.axisLeft(y).ticks(20));
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#citations");

  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1)
    .style("display", "none");

  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d){ return x(d["pubs"].length); })
      .attr("cy", function(d){ return y(d["citations"]); })
      .attr("stroke", function(d){ return selectedId.indexOf(+d["id"]) != -1 ? "red" : "steelblue"; })
      .attr("fill", function(d){ return selectedId.indexOf(+d["id"]) != -1 ? "red" : "steelblue"; })
      .attr("fill-opacity", .3)
      .style("cursor", "pointer")
      .on("click", function(d){ location.href = "author?id=" + d["id"];})
      .on("mouseover", function(d) {
          d3.select(this).attr("stroke", "red").attr("fill", "red").attr("fill-opacity", 1)
          tooltip.style("display", "block");
          tooltip.html(d["name"] + "<br>" + d["citations"] + " citations in " + d["pubs"].length + "papers")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.style("display", "none");
          if( selectedId.indexOf( +d["id"] ) != -1 ) return;
          d3.select(this).attr("stroke", "steelblue").attr("fill", "steelblue").attr("fill-opacity", .3)
      });
};

filterFunctions[1] = filterFunctions[0];
