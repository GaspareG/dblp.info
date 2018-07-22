var id = +getQueryVariable("id");
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
var paper2id = {};
var dCitations = {};
var name2id = {};

function parseData(journals, publish, papers, wrote, authors, citations) {

  for (var i = 0; i < journals.length; i++) {
    dJournals[parseInt(journals[i]["id"])] = journals[i];
    dJournals[parseInt(journals[i]["id"])]["pubs"] = [];
  }
  for (var i = 0; i < papers.length; i++) {
    dPapers[parseInt(papers[i]["id"])] = papers[i];
    dPapers[parseInt(papers[i]["id"])]["journals"] = [];
    dPapers[parseInt(papers[i]["id"])]["authors"] = [];
    paper2id[papers[i]["title"]] = parseInt(papers[i]["id"]);
    dCitations[ +papers[i]["id"] ] = [];
  }
  for(var i=0; i<citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    dCitations[idP1].push(idP2);
  }

  for (var i = 0; i < authors.length; i++) {
    dAuthors[parseInt(authors[i]["id"])] = authors[i];
    dAuthors[parseInt(authors[i]["id"])]["pubs"] = [];
    name2id[ authors[i]["name"] ] = +authors[i]["id"];
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
  loadSort();
  loadChart();
  loadDegree();
  loadInfluences();
}

function loadInfluences()
{
  var authInfl = {};
  dAuthors[id]["pubs"].map( x => dCitations[x] )
  .forEach(function(pp){
    pp.map( p => dPapers[p]["authors"] ).forEach(function(as){
      as.forEach(function(aas){
        if( authInfl[aas] == undefined ) authInfl[aas] = 1;
        else authInfl[aas]++;
      });
    });
   });
  var auths = [];
  for(var ida in authInfl) auths.push( [+ida, authInfl[ida]] );
  auths.sort( (a,b) => b[1] - a[1] );

  console.log(auths);
  var ul = $("<ol>");
  ul.css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });
  for (var i = 0; i < Math.min(128, auths.length); i++) {
    var li = $("<li>");
    li.html( "<a href='author?id="+ auths[i][0] + "'>" + dAuthors[ +auths[i][0] ]["name"] + "</a> ("+auths[i][1]+" citations of "+dAuthors[id]["name"]+" papers)");
    ul.append(li);
  }
  $("#c_influenced").html("");
  addCollapse();
  $("#c_influenced").append("<b><i class='fas fa-users'></i> Top influenced authors:</b>");
  $("#c_influenced").append(ul);

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

  addCollapse();
  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);

}

function loadSort() {
  var sortLabel = ["Year", "Name", "Venue", "Citations"];
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

var journalsBanned = {};

function loadCheckJournals() {
  var list = $("<div>");
  for (var i = 0; i < dJournals.length; i++) {
    journalsBanned[+dJournals[i]["id"]] = false;
    var j = $("<div></div>");
    j.append($("<input type=checkbox checked id='check-" + dJournals[i]["id"] + "' />"))
    j.append(" ");
    j.append($("<label for='check-" + dJournals[i]["id"] + "'>").html(" [" + dJournals[i]["tag"].toUpperCase() + "] " + dJournals[i]["name"]).css("cursor", "pointer").on("click", (function(id) {
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

var plotType = 0;

function loadChart() {
  var plotLabel = ["Career timeline per paper", "Career timeline per year"]; // TODO, "Bar graph", "Stream graph" ];
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

var sortF = [];

function filterData() {
  sortF[0] = function(a,b){
    var res = dPapers[b]["year"] - dPapers[a]["year"];
    return res == 0 ? sortF[1](a,b) : res;
  };
  sortF[1] = (a, b) => dPapers[a]["title"] < dPapers[b]["title"] ? -1 : 1;
  sortF[2] = function(a,b){
    var venA = dJournals[dPapers[a]["journals"][0]]["tag"]
    var venB = dJournals[dPapers[b]["journals"][0]]["tag"]
    return venA == venB ? sortF[1](a,b) : ( venA < venB ? -1 : 1 );
  };
  sortF[3] = function(a,b){
    var res = dCitations[b].length - dCitations[a].length;
    return res == 0 ? sortF[1](a,b) : res;
  };

  return dAuthors[id]["pubs"].filter(function(id) {
    if (dPapers[id]["year"] < minYear) return false;
    if (dPapers[id]["year"] > maxYear) return false;
    if (journalsBanned[dPapers[id]["journals"][0]]) return false;
    return true;
  }).sort( sortF[sort] );

// ["name", "year", "venue", "citations"]

}

function plot() {
  var filter = filterData();
  loadInfo(filter);
  loadFPapers(filter);
  loadCoauthors(filter);
  draw(filter);
}

function loadInfo(filter) {
  var totCit = d3.sum( filterData().map(x => dCitations[x].length));
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<b><i class='fas fa-info-circle'></i> " + dAuthors[id]["name"] + "</b>");
  $("#c_info").append("<div>Found <b>" + filter.length + "</b> papers, citeted <b>"+totCit+"</b> times, between <b>" + minYear + "</b> and <b>" + maxYear + "</b> in selected journals</div>");
}

function loadFPapers(filter) {
  var ul = $("<ol>").css("padding-left","50px").append(filter.map(function(idP) {
    var li = $("<li>");
    var paper = dPapers[idP];
    li.append($("<a>").attr("href", "paper?id=" + paper["id"]).text(
      paper["year"] + " [" + dJournals[paper["journals"][0]]["tag"].toUpperCase() + "] " + paper["title"]
    )).append(" (" + dCitations[idP].length + " citations)");
    return li;
  })).css({
    "max-height": "300px",
    "overflow-y": "scroll"
  });
  $("#c_papers").html("");
  addCollapse();
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

  var ul = $("<ol>");
  ul.css({
    "max-height": "300px",
    "overflow-y": "scroll",
    "padding-left": "50px"
  });

  coauths = [];
  for (var k in coauth) coauths.push([+k, coauth[k]]);
  coauths.sort((a, b) => b[1].length - a[1].length);

  for (var k = 0; k < coauths.length; k++) {
    ul.append(
      $("<li></li>").append(
        $("<a>").attr("href", "author?id" + coauths[k][0]).text(
          dAuthors[coauths[k][0]]["name"])).append( " (" + coauths[k][1].length + " common papers)"
       )
    );
  }

  $("#c_coauthors").html("");
  addCollapse();
  $("#c_coauthors").append("<b><i class='fas fa-share-alt'></i> Coauthors:</b>");
  $("#c_coauthors").append(ul);

}

var drawFunctions = [];

function draw(filter) {
  drawFunctions[plotType](filter);
}

drawFunctions[0] = function(filter){
  $("#c_plot").html("").css({
    "max-height": "600px",
    "overflow-y": "scroll"
  });
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b><br/>");

  var margin = {
    top: 50,
    right: 25,
    bottom: 25,
    left: 150
  };
  var width = ((4 + filter.length) * 30) - margin.left - margin.right,
    height = ((4 + coauths.length) * 20) - margin.top - margin.bottom;

  filter = filter.slice().sort( sortF[0] );

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
    return d;
  })).range([width, 20]);

  var yAxis = d3.axisLeft(y);
  var xAxis = d3.axisTop(x);

  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("background", "#fff")
    .style("padding", "3px")
    .style("opacity", 1)
    .style("display", "none");

  svg.call(yAxis).selectAll("text")
    .attr("stroke", "#999")
    .style("cursor", "pointer")
    .style("font-size", "14px")
    .on("click", function(d){
       location.href = "author?id="+name2id[d];
    })
    .on("mouseover", function(d) {
      var id = name2id[d];
      var num = 0;
      for(var i=0; i<coauths.length; i++)
        if( coauths[i][0] == id )
          num = coauths[i][1].length;
       d3.select(this).attr("stroke", "red");
          tooltip.style("display", "block");
          tooltip.html( num + " common papers")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          d3.select(this).attr("stroke", "#999");
          tooltip.style("display", "none");
      })
      .on("mousemove", function(d){
        tooltip               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

      })


  svg.append("g").call(xAxis).selectAll("text")
    .attr("stroke", "#999")
    .style("cursor", "pointer")
    .style("font-size", "14px")
    .attr("transform", "rotate(45)")
    .attr("y", -20)
    .attr("x", -30)
    .attr("dy", "1em")
    .on("click", function(d){
       location.href = "paper?id="+d;
    })
    .on("mouseover", function(d) {
       d3.select(this).attr("stroke", "red");
          tooltip.style("display", "block");
          tooltip.html( dPapers[d]["title"] + "<br>["+dJournals[dPapers[d]["journals"][0]]["tag"].toUpperCase()+"] " + dPapers[d]["year"])
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mousemove", function(d){
        tooltip               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

      })
      .on("mouseout", function(d) {
          d3.select(this).attr("stroke", "#999");
          tooltip.style("display", "none");
      });


  coauths.push([id, dAuthors[id]["pubs"].filter(function(x){
    if( !(minYear <= dPapers[x]["year"] && dPapers[x]["year"] <= maxYear) ) return false;
    if( journalsBanned[ dPapers[x]["journals"] ] ) return false;
    return true;
  })])

  
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

drawFunctions[1] = function(filter){
  $("#c_plot").html("").css({
    "max-height": "600px",
    "overflow-y": "scroll"
  });
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b><br/>");

  var margin = {
    top: 50,
    right: 25,
    bottom: 25,
    left: 150
  };

  var authPubs = dAuthors[id]["pubs"].filter(function(x){
    if( !(minYear <= dPapers[x]["year"] && dPapers[x]["year"] <= maxYear) ) return false;
    if( journalsBanned[ dPapers[x]["journals"] ] ) return false;
    return true;
  });

  console.log("pubs", authPubs);
  var miny = d3.min(authPubs, x => dPapers[x]["year"]);
  var maxy = d3.max(authPubs, x => dPapers[x]["year"]);

  var width = ((4 + (maxy - miny+1)) * 30) - margin.left - margin.right,
    height = ((4 + coauths.length) * 30) - margin.top - margin.bottom;

  filter = filter.slice().sort( sortF[0] );

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

  var x = d3.scalePoint().domain(d3.range(miny, maxy+1).reverse()).range([width, 20]);

  var yAxis = d3.axisLeft(y);
  var xAxis = d3.axisTop(x);

  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("background", "#fff")
    .style("padding", "3px")
    .style("opacity", 1)
    .style("display", "none");

  svg.call(yAxis).selectAll("text")
    .attr("stroke", "#999")
    .style("cursor", "pointer")
    .style("font-size", "14px")
    .on("click", function(d){
       location.href = "author?id="+name2id[d];
    })
    .on("mouseover", function(d) {
      var id = name2id[d];
      var num = 0;
      for(var i=0; i<coauths.length; i++)
        if( coauths[i][0] == id )
          num = coauths[i][1].length;
       d3.select(this).attr("stroke", "red");
          tooltip.style("display", "block");
          tooltip.html( num + " common papers")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          d3.select(this).attr("stroke", "#999");
          tooltip.style("display", "none");
      })
      .on("mousemove", function(d){
        tooltip               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

      })


  svg.append("g").call(xAxis).selectAll("text")
    .attr("stroke", "#999")

    .style("cursor", "pointer")
    .style("font-size", "14px")
    .attr("transform", "rotate(45)")
    .attr("y", -20)
    .attr("x", -30)
    .attr("dy", "1em")
    .on("click", function(d){
       location.href = "paper?id="+d;
    })
    .on("mouseover", function(d) {
       d3.select(this).attr("stroke", "red");
          tooltip.style("display", "block");
          tooltip.html( dPapers[d]["title"] + "<br>["+dJournals[dPapers[d]["journals"][0]]["tag"].toUpperCase()+"] " + dPapers[d]["year"])
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mousemove", function(d){
        tooltip               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

      })
      .on("mouseout", function(d) {
          d3.select(this).attr("stroke", "#999");
          tooltip.style("display", "none");
      });


  coauths.push([id, dAuthors[id]["pubs"].filter(function(x){
    if( !(minYear <= dPapers[x]["year"] && dPapers[x]["year"] <= maxYear) ) return false;
    if( journalsBanned[ dPapers[x]["journals"] ] ) return false;
    return true;
  })])

  var cc = coauths[coauths.length-1][1].map(x => dPapers[x]["year"]);
  var fc = {};
  for(var i=0; i<cc.length; i++)
    if( fc[cc[i]] == undefined ) fc[cc[i]] = 1;
    else fc[cc[i]]++;
  var scaleX = 0;
  for(var yy in fc)
    scaleX = Math.max(scaleX, fc[yy]);

  for (var i = 0; i < coauths.length; i++) {
    var idA = dAuthors[coauths[i][0]]["name"];
    var minX = 100000;
    var maxX = 0;
    var collabs = {};
    for (var j = 0; j < coauths[i][1].length; j++) {
      var idP = coauths[i][1][j];
      if( collabs[ dPapers[idP]["year"] ] == undefined )
        collabs[ dPapers[idP]["year"] ] = []
      collabs[ dPapers[idP]["year"] ].push(idP);
    }

    for (var yy in collabs)
    {
      minX = Math.min(x(yy), minX);
      maxX = Math.max(x(yy), maxX);
      svg.append("g").append("circle")
        .attr("cx", x(yy))
        .attr("cy", y(idA))
        .attr("r", 5) // * ( collabs[yy].length / 10 ) ) // / scaleX ) )
        .attr("stroke", d3.interpolateRdYlGn(1 - y(idA) / height))
        .attr("fill", d3.interpolateRdYlGn(1 - y(idA) / height))
        .attr("fill-opacity", ".5")
        .on("mouseover", (function(idA, yy, collabs){ return function(d) {
          tooltip.style("display", "block");
          tooltip.html( yy + " " + collabs[yy].length + " collaborations")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
        }})(idA, yy, collabs))
        .on("mousemove", function(d){
            tooltip.style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

      })
      .on("mouseout", function(d) {
          tooltip.style("display", "none");
      });


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

  var nd = 8;

  for (var i = 1; i <= nd; i++) {
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
  for (var i = 0; i <= nd; i++) {
    var per = (parseInt(10000 * degrees[i].length / dAuthors.length) / 100.);
    tot += degrees[i].length;
    var pertot = (parseInt(10000 * tot / dAuthors.length) / 100.);
    var li = $("<li>");
    li.html("<b>" + degrees[i].length + " authors</b> (" + per + "%) at distance <b>" + i + "</b>, total of <b>"+tot+" authors</b> at distance &#8804; <b>" + i + "</b> ("+pertot+"%)");
    ul.append(li);
  }
  $("#c_degree").html();
  addCollapse();
  $("#c_degree").append("<b><i class='fas fa-code-branch'></i> Separations degree:</b>");
  $("#c_degree").append(ul);

}
