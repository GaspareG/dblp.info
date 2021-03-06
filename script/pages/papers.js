var sort = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var journalsBanned = {};
var plotTypeChart = 0;
var selectedId = getQueryVariable("ids");
var selectedColor = d3.schemeDark2.slice().concat(d3.schemeCategory10);
if (selectedId == undefined) selectedId = [];
else selectedId = selectedId.split(",").map(x => +x);
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
var title2id = {};

function parseData(authors, wrote, papers, publish, journals, citations)
{
  dJournals = journals;
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
  {
    pData[parseInt(papers[i]["id"])] = papers[i];
    title2id[papers[i]["title"]] = papers[i]["id"];
  }
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
  loadSearch();
  updatePapers();
  loadSort();
  loadSliderYear();
  loadPlotType();
  loadScaleType();
}

function loadSearch()
{
  $("#c_search").html("");
  addCollapse();
  var input = $("<input style='width: 100%' id='papers'>");
  var names = [];
  for (var k in title2id) names.push(k);
  input.autocomplete(
  {
    source: names,
    minLength: 3,
    autoFocus: true,
    select: function(event, ui)
    {
      var id = +title2id[ui.item.value];
      if (selectedId.indexOf(id) != -1) return;
      selectedId.push(id);
      updatePapers();
      plot();
    }
  });
  $("#c_search").append('<b><i class="fas fa-search"></i> Search paper:</b><br>');
  $("#c_search").append("<span> </span>");
  $("#c_search").append($("<div>").css("width", "100%").append(input));
}

function updatePapers()
{
  if (selectedId.length > 0) updateQueryStringParam("ids", selectedId.join(","));
  var ol = $("<ol>").css("padding-left", "50px");
  for (var i = 0; i < selectedId.length; i++)
  {
    var li = $("<li>");
    li.append($("<a>").text(pData[selectedId[i]]["title"]).attr("href", "paper?id=" + selectedId[i]).css("color", selectedColor[i] + " !important"))
      .append(" - ")
      .append($("<i class='fas fa-times'></i>").css(
      {
        "color": "red",
        "cursor": "pointer"
      }).on("click", (function(id)
      {
        return function()
        {
          var pos = selectedId.indexOf(id);
          selectedId = selectedId.slice(0, pos).concat(selectedId.slice(pos + 1));
          updateAuthors();
          plot();
        }
      })(selectedId[i])))
    ol.append(li);
  }
  $("#c_selected").html("");
  addCollapse();
  $("#c_selected").append('<b><i class="fas fa-file"></i> Selected papers:</b>');
  $("#c_selected").append($("<div>").css("width", "100%").append(ol));
}

function loadSort()
{
  var sortLabel = ["Year", "Name", "Number of citations"];
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

function loadScaleType()
{
  var plotLabel = ["x: Log - y: Log", "x: Lin - y: Log", "x: Log - y: Lin", "x: Lin - y: Lin"];
  $("#c_plot_type").html("");
  addCollapse();
  var fields = $("<form></form>");
  for (var i = 0; i < plotLabel.length; i++)
  {
    var id = "axis-" + i;
    var el = $("<input type='radio' name='axis' id='" + id + "' value='" + i + "'>");
    el.attr("checked", i == 0);
    el.on("change", function()
    {
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

function loadSliderYear()
{
  minYear = 3000;
  maxYear = 1000;
  for (var i = 0; i < data.length; i++)
    minYear = Math.min(minYear, data[i]["minYear"]);
  for (var i = 0; i < data.length; i++)
    maxYear = Math.max(maxYear, data[i]["maxYear"]);
  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");
  sliderYearText.html("<b>Years of publications: " + minYear + " - " + maxYear + "</b>");
  sliderYearSlider.slider(
  {
    range: true,
    min: minYear,
    max: maxYear,
    values: [minYear, maxYear],
    slide: function(event, ui)
    {
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

function filter()
{
  var ret = pData.filter(function(pp)
  {
    if (pp["year"] < minYear) return false;
    if (pp["year"] > maxYear) return false;
    if (journalsBanned[pp["journals"][0]]) return false;
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

function async (your_function, callback, argument)
{
  setTimeout(function()
  {
    your_function(argument);
    if (callback)
    {
      callback();
    }
  }, 0);
}

function plot()
{
  filterData = filter();
  updateInfo(filterData);
  updateList(filterData);
  //  plotFunctions[plotTypeChart](filterData);
  drawDegree(filterData);
  //  console.log("UPDATE PAPERS 0", (new Date()));
  //  async(function(filterData){ updatePapers(filterData); }, null, filterData);
  //  console.log("UPDATE PAPERS 1", (new Date()));
}

function updateInfo(dataF)
{
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<div><i class='fas fa-info-circle'></i> <b>" + pData.length + "</b> total papers in dataset</div>");
  $("#c_info").append("<div>Selected <b>" + dataF.length + "</b> papers published in the years <b>" + minYear + "</b> - <b>" + maxYear + "</b></div>");
}

function updateList(dataF)
{
  var sortF = [];
  sortF[0] = (a, b) => a["tag"] < b["tag"] ? -1 : 1;
  console.log("DJOURNAL SORT 0 ", (new Date()));
  var dJournalsC = dJournals.slice().sort(sortF[0]);
  console.log("DJOURNAL SORT 1", (new Date()));
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
    j.append(" <br><b>" + dJournalsC[i]["pubs"].length + "</b> papers between " + dJournalsC[i]["minYear"] + " and " + dJournalsC[i]["maxYear"]);
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

function drawDegree(dataP)
{
  var margin = {
    top: 20,
    right: 20,
    bottom: 60,
    left: 60
  };
  var wH = window.innerHeight;
  var innerH = getOffset($("#c_plot_degree")[0]).top;
  var width = $("#c_plot_degree").width() - margin.left - margin.right;
  var height1 = (wH - innerH - 100) - margin.top - margin.bottom;
  var height2 = $("#c_plot_degree").width() * 3 / 4 - margin.top - margin.bottom;
  var height = Math.min(height1, height2);
  $("#c_plot_degree").html("");
  addCollapse();
  $("#c_plot_degree").append('<b><i class="fas fa-chart-line"></i> Plot:</b>');
  var svg = d3.select("#c_plot_degree")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  svg.selectAll("*").remove();
  g = svg.append("g");
  degreeCount = {};
  for (var i = 0; i < dataP.length; i++)
  {
    var count = (dCitations[dataP[i]["id"]] || []).length;
    if (degreeCount[count] == undefined)
      degreeCount[count] = 0;
    degreeCount[count]++;
  }
  if (plotType == 0 || plotType == 2) delete degreeCount[0];
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
  x.domain(d3.extent(points, function(d)
  {
    return d[0];
  }));
  y.domain(d3.extent(points, function(d)
  {
    return d[1];
  }));
  var line = d3.line()
    .x(function(d)
    {
      return x(d[0]);
    })
    .y(function(d)
    {
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
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", "1");
  svg.selectAll("dot")
    .data(selectedId)
    .enter().append("circle")
    .attr("r", 5)
    .attr("cx", function(d)
    {
      if ((dCitations[d] || []).length == 0) return -10000;
      console.log("X", d, (dCitations[d] || []).length, x((dCitations[d] || []).length));
      return x((dCitations[d] || []).length);
    })
    .attr("cy", function(d)
    {
      if ((dCitations[d] || []).length == 0) return -10000;
      return y(degreeCount[(dCitations[d] || []).length]);
    })
    .attr("fill", x => selectedColor[selectedId.indexOf(x)])
    .attr("stroke", x => selectedColor[selectedId.indexOf(x)])
    .attr("fill-opacity", "0.5")
    .style("cursor", "pointer")
    .on("click", function(d)
    {
      location.href = "paper?id=" + d;
    })
  d3.select("body").selectAll("div.tooltip")
    .data(selectedId)
    .enter().append("div")
    .attr("class", "tooltip")
    .style("display", "block")
    .style("opacity", 1)
    .style("text-size", "10px")
    .html(id => pData[id]["title"])
    .style("left", function(d)
    {
      if ((dCitations[d] || []).length == 0) return -10000;
      console.log("X", d, (dCitations[d] || []).length, x((dCitations[d] || []).length));
      return (25 + margin.left + getOffset($("#c_plot_degree")[0]).left + x((dCitations[d] || []).length)) + "px";
    })
    .style("top", function(d)
    {
      if ((dCitations[d] || []).length == 0) return -10000;
      return (-3 + margin.top + getOffset($("#c_plot_degree")[0]).top + y(degreeCount[(dCitations[d] || []).length])) + "px";
    })
}
