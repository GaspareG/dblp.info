var plotFunctions = [];
var sort = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var journalsBanned = {};
var proceedingBanned = false;
var proceedingsIds = {};

$(function()
{
  loadAuthors(function(authors)
  {
    loadWrote(function(wrote)
    {
      loadPapers(function(papers)
      {
        loadPublish(function(publish)
        {
          loadJournals(function(journals)
          {
            loadCitations(function(citations)
            {
              loadProceedings(function(proceedings)
              {
                parseData(authors, wrote, papers, publish, journals, citations, proceedings);
              });
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

function parseData(authors, wrote, papers, publish, journals, citations, proceedings)
{
  dJournals = journals;

  for (var i = 0; i < proceedings.length; i++)
    proceedingsIds[+proceedings[i]["idP"]] = +proceedings[i]["idC"];

  for (var i = 0; i < journals.length; i++)
    journalsBanned[+journals[i]["id"]] = false;

  for (var i = 0; i < citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    if (dCitations[idP1] == undefined) dCitations[idP1] = [];
    dCitations[idP1].push(idP2);
  }

  for (var i = 0; i < authors.length; i++)
  {
    name2id[authors[i]["name"]] = parseInt(authors[i]["id"]);
    data[parseInt(authors[i]["id"])] = authors[i];
    data[parseInt(authors[i]["id"])]["pubs"] = [];
    data[parseInt(authors[i]["id"])]["minYear"] = 3000;
    data[parseInt(authors[i]["id"])]["maxYear"] = 1000;
  }
  for (var i = 0; i < papers.length; i++)
    pData[parseInt(papers[i]["id"])] = papers[i];

  for (var i = 0; i < publish.length; i++)
    pData[+publish[i]["idP"]]["journals"] = [+publish[i]["idJ"]];

  for (var i = 0; i < wrote.length; i++)
  {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    data[idA]["pubs"].push(pData[idP]);
    data[idA]["minYear"] = Math.min(data[idA]["minYear"], parseInt(pData[idP]["year"]));
    data[idA]["maxYear"] = Math.max(data[idA]["maxYear"], parseInt(pData[idP]["year"]));
  }

  for (var i = 0; i < publish.length; i++)
  {
    var idP = +publish[i]["idP"];
    var idJ = +publish[i]["idJ"];
    wrotePJ[idP] = idJ;
  }
  loadControls();
  plot();
}

function loadControls()
{
  loadSort();
  loadSliderYear();
  loadPlotType();
}

function loadSort()
{
  var sortLabel = ["Name", "Number of publications", "Number of citations"];
  $("#c_sort").html("");
  addCollapse();

  var label = $("<label for='sort'>Sort by: </label>");
  var fields = $("<form></form>");
  for (var i = 0; i < sortLabel.length; i++)
  {
    var id = "sort-" + i;
    var el = $("<input type='radio' name='sort' id='" + id + "' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function()
    {
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

function loadSliderYear()
{
  minYear = 1985;
  maxYear = 2018;

  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");

  sliderYearText.html("<b>Years of publications: " + minYear + " - " + maxYear + "</b>");
  sliderYearSlider.slider(
  {
    range: true,
    min: d3.min(data, x => x["minYear"]),
    max: d3.max(data, x => x["maxYear"]),
    values: [minYear, maxYear],
    slide: function(event, ui)
    {
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

function loadPlotType()
{
  var plotLabel = ["Stacked bars", "Streamgraph paper/year", "Citations timeline", "Papers timeline"]; // TODO, "Bar graph", "Stream graph" ];
  $("#c_chart").html("");
  addCollapse();

  var fields = $("<form></form>");
  for (var i = 0; i < plotLabel.length; i++)
  {
    var id = "plot-" + i;
    var el = $("<input type='radio' id='" + id + "' name='plot' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function()
    {
      plotType = parseInt(this.value);
      plot();
    });
    fields.append(el);
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + plotLabel[i] + "</label>");
    fields.append("<span> </span>");
    fields.append("<br>");
  }

  var checkbox = $("<div></div>");

  checkbox.append($("<input type='checkbox' id='check-conf' checked/>").on("change", function()
  {
    proceedingBanned = !this.checked;
    plot();
    console.log(this.checked);
  }));
  checkbox.append("<span> </span>");
  checkbox.append($("<label for='check-conf'> <b>Count conference proceedings</b></label>"));

  $("#c_chart").append('<b><i class="fas fa-chart-bar"></i> Plot type: </b>');
  $("#c_chart").append(fields);
  $("#c_chart").append(checkbox);

}

function filter()
{
  var ret = pData.filter(function(pp)
  {
    if (pp["year"] < minYear) return false;
    if (pp["year"] > maxYear) return false;
    if (journalsBanned[pp["journals"][0]]) return false;
    if (proceedingBanned && proceedingsIds[+pp["id"]] != undefined) return false;
    return true;
  });

  for (var i = 0; i < dJournals.length; i++)
    dJournals[i]["pubs"] = [];

  for (var i = 0; i < ret.length; i++)
  {
    dJournals[ret[i]["journals"][0]]["pubs"].push(ret[i]["id"]);
  }

  for (var i = 0; i < dJournals.length; i++)
  {
    dJournals[i]["citations"] = d3.sum(dJournals[i]["pubs"], x => (dCitations[x] || []).length) || 0;
    dJournals[i]["minYear"] = d3.min(dJournals[i]["pubs"], x => +pData[x]["year"]) || 0;
    dJournals[i]["maxYear"] = d3.max(dJournals[i]["pubs"], x => +pData[x]["year"]) || 0;
  }
  return ret;
}

var filterData = [];

function plot()
{
  filterData = filter();
  updateInfo(filterData);
  updateList(filterData);
  plotFunctions[plotType](filterData);
}

function updateInfo(dataF)
{
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<div><i class='fas fa-info-circle'></i> <b>" + dJournals.length + "</b> total journals in dataset</div>");
  $("#c_info").append("<div>Selected <b>" + dataF.length + "</b> papers published in the years <b>" + minYear + "</b> - <b>" + maxYear + "</b></div>");
}

function updateList(dataF)
{

  var sortF = [];
  sortF[0] = (a, b) => a["tag"] < b["tag"] ? -1 : 1;
  sortF[1] = (a, b) => b["pubs"].length - a["pubs"].length;
  sortF[2] = (a, b) => b["citations"] - a["citations"];

  var dJournalsC = dJournals.slice().sort(sortF[sort]);

  var list = $("<div>");
  for (var i = 0; i < dJournalsC.length; i++)
  {
    var j = $("<div></div>");
    j.append($("<input type=checkbox " + (journalsBanned[dJournalsC[i]["id"]] == true ? "" : "checked") + " />").on("change", (function(id)
    {
      return function()
      {
        journalsBanned[+dJournals[id]["id"]] = !journalsBanned[+dJournals[id]["id"]];
        plot();
      }
    })(dJournalsC[i]["id"])));
    j.append(" ");
    j.append("<a href='journal?id=" + dJournalsC[i]["id"] + "'>[" + dJournalsC[i]["tag"].toUpperCase() + "] " + dJournalsC[i]["name"] + "</a>");
    j.append(" <br/><b>" + dJournalsC[i]["pubs"].length + "</b> papers cited <b>" + dJournalsC[i]["citations"] + "</b> times");
    list.append(j);
  }

  $("#c_journals").html("");
  addCollapse();
  $("#c_journals").append('<b><i class="fas fa-book"></i> Journals: </b>');
  $("#c_journals").append(list);
}

$(window).resize(plot);

function getOffset(el)
{
  var _x = 0;
  var _y = 0;
  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop))
  {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return {
    top: _y,
    left: _x
  };
}

plotFunctions[0] = function(data)
{
  var margin = {
    top: 25,
    right: 25,
    bottom: 80,
    left: 55
  };

  var wH = window.innerHeight;
  var innerH = getOffset($("#c_plot")[0]).top;
  var width = $("#c_plot").width() - margin.left - margin.right;
  var height1 = (wH - innerH - 100) - margin.top - margin.bottom;
  var height2 = $("#c_plot").width() * 3 / 4 - margin.top - margin.bottom;
  var height = Math.min(height1, height2);

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X Axis
  var minY = d3.min(data, x => +x["year"]);
  var maxY = d3.max(data, x => +x["year"]);
  var x = d3.scaleBand().rangeRound([0, width]).domain(d3.range(minY, maxY + 1));
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");
  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 40) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // Y Axis
  var keys = dJournals.map(x => x["tag"]);

  var dataP = [];
  for (var i = minYear; i <= maxYear; i++)
  {
    var o = {};
    o["year"] = i;
    keys.forEach(t => o[t] = 0);
    dataP.push(o);
  }

  for (var i = 0; i < data.length; i++)
    dataP[data[i]["year"] - minYear][dJournals[data[i]["journals"][0]]["tag"]]++

  var y = d3.scaleLinear().rangeRound([height, 0]).domain([0, d3.max(dataP, function(e)
  {
    var s = 0;
    keys.forEach(t => s += e[t]);
    return s;
  })]).nice();

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("x", 2)
    .attr("y", y(y.ticks().pop()) + 0.5)
    .attr("dy", "0.32em")
    .attr("fill", "#000")
    .attr("font-weight", "bold")
    .attr("text-anchor", "start");
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#publications");

  var z = d3.scaleOrdinal().range(d3.schemeCategory10).domain(keys);

  // Plot
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("z-index", "1000")
    .style("opacity", "1");

  //D3 Vertical Legend//////////////////////////
  var legend3 = svg.selectAll('.legend3')
    .data(z.domain())
    .enter().append('g')
    .attr("class", "legends3")
    .attr("transform", function(d, i)
    {
      {
        return "translate(5," + i * 20 + ")"
      }
    })

  legend3.append('rect')
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .style("fill", function(d, i)
    {
      return z(d)
    })

  legend3.append('text')
    .attr("x", 20)
    .attr("y", 13)
    .text(function(d, i)
    {
      return "[" + d.toUpperCase() + "]";
    })
    .attr("class", "textselected")
    .style("text-anchor", "start")
    .style("font-size", 15)
  //////////////////////////////

  svg.append("g")
    .selectAll("g")
    .data(d3.stack().keys(keys)(dataP))
    .enter().append("g")
    .attr("fill", function(d)
    {
      return z(d.key);
    })
    .selectAll("rect")
    .data(function(d)
    {
      return d;
    })
    .enter().append("rect")
    .attr("x", function(d)
    {
      return x(d.data["year"]);
    })
    .attr("y", function(d)
    {
      return y(d[1]);
    })
    .attr("height", function(d)
    {
      return y(d[0]) - y(d[1]);
    })
    .attr("width", x.bandwidth())
    .style("cursor", "pointer")
    .on("click", function(d, i)
    {
      var dif = d[1] - d[0];
      var lab = "";
      for (var k in d.data)
        if (d.data[k] == dif)
          lab = k;
      var id = -1;
      for (var i = 0; i < dJournals.length; i++)
        if (lab == dJournals[i]["tag"]) id = i;
      location.href = "journal?id=" + id;
    })
    .on("mouseover", function(d, i)
    {
      tooltip.style("display", "block");
      var dif = d[1] - d[0];
      var lab = "";
      for (var k in d.data)
        if (d.data[k] == dif)
          lab = k;
      tooltip.html("[" + lab.toUpperCase() + "] " + dif + " papers in " + d.data["year"]);
      tooltip.style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function()
    {
      tooltip.style("display", "none");
    })
    .on("mousemove", function(d, i)
    {
      tooltip.style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    });

};

/************************************************/
plotFunctions[1] = function(data)
{
  var margin = {
    top: 80,
    right: 25,
    bottom: 80,
    left: 55
  };

  var wH = window.innerHeight;
  var innerH = getOffset($("#c_plot")[0]).top;
  var width = $("#c_plot").width() - margin.left - margin.right;
  var height1 = (wH - innerH - 100) - margin.top - margin.bottom;
  var height2 = $("#c_plot").width() * 3 / 4 - margin.top - margin.bottom;
  var height = Math.min(height1, height2);

  console.log(data);
  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X Axis
  var minY = d3.min(data, x => +x["year"]);
  var maxY = d3.max(data, x => +x["year"]);
  var x = d3.scaleBand().rangeRound([0, width]).domain(d3.range(minY, maxY + 1));
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");
  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 40) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // Y Axis
  var keys = dJournals.map(x => x["tag"]);

  var dataP = [];
  for (var i = minY; i <= maxY; i++)
  {
    var o = {};
    o["year"] = i;
    keys.forEach(t => o[t] = 0);
    dataP.push(o);
  }

  for (var i = 0; i < data.length; i++)
    dataP[data[i]["year"] - minY][dJournals[data[i]["journals"][0]]["tag"]]++

  var y = d3.scaleLinear().rangeRound([height, 0]).domain([0, d3.max(dataP, function(e)
  {
    var s = 0;
    keys.forEach(t => s += e[t]);
    return s;
  })]).nice();

  var z = d3.scaleOrdinal().range(d3.schemeCategory10).domain(keys);

  // Plot
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("z-index", "1000")
    .style("opacity", "1");
  //D3 Vertical Legend//////////////////////////
  var legend3 = svg.selectAll('.legend3')
    .data(z.domain())
    .enter().append('g')
    .attr("class", "legends3")
    .attr("transform", function(d, i)
    {
      {
        return "translate(5," + i * 20 + ")"
      }
    })

  legend3.append('rect')
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .style("fill", function(d, i)
    {
      return z(d)
    })

  legend3.append('text')
    .attr("x", 20)
    .attr("y", 13)
    .text(function(d, i)
    {
      return "[" + d.toUpperCase() + "]";
    })
    .attr("class", "textselected")
    .style("text-anchor", "start")
    .style("font-size", 15)
  //////////////////////////////

  var stack = d3.stack().keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetWiggle);
  var series = stack(dataP);

  var y = d3.scaleLinear()
    .domain([0, d3.max(series, function(layer)
    {
      return d3.max(layer, function(d)
      {
        return d[0] + d[1];
      });
    })])
    .range([0, height]);

  var area = d3.area()
    .x(function(d)
    {
      return x(d.data["year"]);
    })
    .y0(function(d)
    {
      return y(d[0]) + height / 2 - 80;
    })
    .y1(function(d)
    {
      return y(d[1]) + height / 2 - 80;
    })
    .curve(d3.curveBasis);

  svg.selectAll("path")
    .data(series)
    .enter().append("path")
    .attr("d", area)
    .style("cursor", "pointer")
    .style("fill", function(d, i)
    {
      return z(d.key);
    })
    .on('mouseover', function(d)
    {
      d3.select(this).style('fill', d3.rgb(d3.select(this).style("fill")).brighter());
      tooltip.style("display", "block");
      tooltip.html("[" + d.key.toUpperCase() + "] ");
      tooltip.style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on('mouseout', function(d)
    {
      tooltip.style("display", "none");
      d3.select(this).style('fill',
        d3.rgb(d3.select(this).style("fill")).darker());
    })
    .on("mousemove", function(d, i)
    {
      tooltip.style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("click", function(d, i)
    {
      var id = -1;
      dJournals.forEach(function(e)
      {
        if (e["tag"] == d.key) id = e["id"];
      });
      location.href = "journal?id=" + id;
    });

};

/************************************************/
plotFunctions[2] = function(data)
{
  var margin = {
    top: 20,
    right: 25,
    bottom: 80,
    left: 80
  };

  var wH = window.innerHeight;
  var innerH = getOffset($("#c_plot")[0]).top;
  var width = $("#c_plot").width() - margin.left - margin.right;
  var height1 = (wH - innerH - 100) - margin.top - margin.bottom;
  var height2 = $("#c_plot").width() * 3 / 4 - margin.top - margin.bottom;
  var height = Math.min(height1, height2);

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var minY = d3.min(data, x => +x["year"]);
  var maxY = d3.max(data, x => +x["year"]);
  var maxV = 0;
  var dataP = []
  for (var i = 0; i < data.length; i++)
  {
    var y = +data[i]["year"];
    var j = +data[i]["journals"][0];
    if (dataP[j] == undefined)
    {
      dataP[j] = [];
      for (var k = minY; k <= maxY; k++)
        dataP[j][k - minY] = [k, 0];
    }
    dataP[j][y - minY][1] += (dCitations[data[i]["id"]] || []).length;
  }

  for (var i = 0; i < dataP.length; i++)
    for (var j = 1; j < dataP[i].length; j++)
    {
      dataP[i][j][1] += dataP[i][j - 1][1];
      maxV = Math.max(maxV, dataP[i][j][1]);
    }
  console.log(dataP);

  // X Axis
  var x = d3.scaleLinear().rangeRound([0, width]).domain([minY, maxY + 1]).nice();
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#citations");

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 40) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // Y Axis
  var y = d3.scaleLinear().rangeRound([height, 0]).domain([0, maxV]).nice();

  var keys = dJournals.map(x => x["tag"]);
  var z = d3.scaleOrdinal().range(d3.schemeCategory10).domain(keys);

  // Plot
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("z-index", "1000")
    .style("opacity", "1");

  //D3 Vertical Legend//////////////////////////
  var legend3 = svg.selectAll('.legend3')
    .data(z.domain())
    .enter().append('g')
    .attr("class", "legends3")
    .attr("transform", function(d, i)
    {
      {
        return "translate(5," + i * 20 + ")"
      }
    })

  legend3.append('rect')
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .style("fill", function(d, i)
    {
      return z(d)
    })

  legend3.append('text')
    .attr("x", 20)
    .attr("y", 13)
    .text(function(d, i)
    {
      return "[" + d.toUpperCase() + "]";
    })
    .attr("class", "textselected")
    .style("text-anchor", "start")
    .style("font-size", 15)
  //////////////////////////////

  // Add the Y Axis
  svg.append("g")
    .call(d3.axisLeft(y));

  var line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))

  for (var i = 0; i < dataP.length; i++)
  {
    svg.append("path")
      .attr("d", line(dataP[i]))
      .attr("stroke", z(keys[i]))
      .attr("stroke-width", 2)
      .attr("fill", "none");

    svg.selectAll("dot")
      .data(dataP[i])
      .enter().append("circle")
      .attr("stroke", z(keys[i]))
      .attr("fill", z(keys[i]))
      .attr("fill-opacity", 0.5)
      .attr("r", 4)
      .attr("cx", function(d)
      {
        return x(d[0]);
      })
      .attr("cy", function(d)
      {
        return y(d[1]);
      })
      .style("cursor", "pointer")
      .on("click", (function(id)
      {
        return _ => location.href = "journal?id=" + id;
      })(i))
      .on('mouseover', (function(tag, num)
      {
        return function(d, i)
        {
          tooltip.style("display", "block");
          tooltip.html("[" + tag.toUpperCase() + "] " + d[1] + " citations");
          tooltip.style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }
      })(keys[i], dataP[i]))
      .on('mouseout', function(d)
      {
        tooltip.style("display", "none");
      })
      .on("mousemove", function(d, i)
      {
        tooltip.style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })

  }
};

/************************************************/
plotFunctions[3] = function(data)
{
  var margin = {
    top: 20,
    right: 25,
    bottom: 80,
    left: 80
  };

  var wH = window.innerHeight;
  var innerH = getOffset($("#c_plot")[0]).top;
  var width = $("#c_plot").width() - margin.left - margin.right;
  var height1 = (wH - innerH - 100) - margin.top - margin.bottom;
  var height2 = $("#c_plot").width() * 3 / 4 - margin.top - margin.bottom;
  var height = Math.min(height1, height2);

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<b><i class='fas fa-chart-line'></i> Plot:</b>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var minY = d3.min(data, x => +x["year"]);
  var maxY = d3.max(data, x => +x["year"]);
  var maxV = 0;
  var dataP = []
  for (var i = 0; i < data.length; i++)
  {
    var y = +data[i]["year"];
    var j = +data[i]["journals"][0];
    if (dataP[j] == undefined)
    {
      dataP[j] = [];
      for (var k = minY; k <= maxY; k++)
        dataP[j][k - minY] = [k, 0];
    }
    dataP[j][y - minY][1]++;
  }

  for (var i = 0; i < dataP.length; i++)
    for (var j = 1; j < dataP[i].length; j++)
    {
      dataP[i][j][1] += dataP[i][j - 1][1];
      maxV = Math.max(maxV, dataP[i][j][1]);
    }
  console.log(dataP);

  // X Axis
  var x = d3.scaleLinear().rangeRound([0, width]).domain([minY, maxY + 1]).nice();
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("#papers");

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 40) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // Y Axis
  var y = d3.scaleLinear().rangeRound([height, 0]).domain([0, maxV]).nice();

  var keys = dJournals.map(x => x["tag"]);
  var z = d3.scaleOrdinal().range(d3.schemeCategory10).domain(keys);

  // Plot
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("z-index", "1000")
    .style("opacity", "1");

  //D3 Vertical Legend//////////////////////////
  var legend3 = svg.selectAll('.legend3')
    .data(z.domain())
    .enter().append('g')
    .attr("class", "legends3")
    .attr("transform", function(d, i)
    {
      {
        return "translate(5," + i * 20 + ")"
      }
    })

  legend3.append('rect')
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .style("fill", function(d, i)
    {
      return z(d)
    })

  legend3.append('text')
    .attr("x", 20)
    .attr("y", 13)
    .text(function(d, i)
    {
      return "[" + d.toUpperCase() + "]";
    })
    .attr("class", "textselected")
    .style("text-anchor", "start")
    .style("font-size", 15)
  //////////////////////////////

  // Add the Y Axis
  svg.append("g")
    .call(d3.axisLeft(y));

  var line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))

  for (var i = 0; i < dataP.length; i++)
  {
    svg.append("path")
      .attr("d", line(dataP[i]))
      .attr("stroke", z(keys[i]))
      .attr("stroke-width", 2)
      .attr("fill", "none");

    svg.selectAll("dot")
      .data(dataP[i])
      .enter().append("circle")
      .attr("stroke", z(keys[i]))
      .attr("fill", z(keys[i]))
      .attr("fill-opacity", 0.5)
      .attr("r", 4)
      .attr("cx", function(d)
      {
        return x(d[0]);
      })
      .attr("cy", function(d)
      {
        return y(d[1]);
      })
      .style("cursor", "pointer")
      .on("click", (function(id)
      {
        return _ => location.href = "journal?id=" + id;
      })(i))
      .on('mouseover', (function(tag, num)
      {
        return function(d, i)
        {
          tooltip.style("display", "block");
          tooltip.html("[" + tag.toUpperCase() + "] " + d[0] + "<br>" + d[1] + " papers");
          tooltip.style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }
      })(keys[i], dataP[i]))
      .on('mouseout', function(d)
      {
        tooltip.style("display", "none");
      })
      .on("mousemove", function(d, i)
      {
        tooltip.style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })

  }
};
