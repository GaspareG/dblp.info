var plotFunctions = [];
var filterFunctions = [];
var plotDescr = [];
var sort = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var selectedId = -1;

$(function(){
  loadJournals(function(journals){
    loadPublish(function(publish){
      loadPapers(function(papers){
        parseData(journals, publish, papers);
      });
    });
  });
});

var data = [];
var name2id = {};
// [id, name, tag, pubs]

function parseData(journals, publish, papers)
{
  // Parse
  for(var i=0; i<journals.length; i++)
  {
    name2id[ journals[i]["name"] ] = parseInt(journals[i]["id"]);
    data[parseInt(journals[i]["id"])] = journals[i];
    data[parseInt(journals[i]["id"])]["pubs"] = [];
    data[parseInt(journals[i]["id"])]["minYear"] = 3000;
    data[parseInt(journals[i]["id"])]["maxYear"] = 1000;
  }

  var pData = []
  for(var i=0; i<papers.length; i++)
    pData[ parseInt(papers[i]["id"]) ] = papers[i];

  for(var i=0; i<publish.length; i++)
  {
    var idJ = parseInt(publish[i]["idJ"]);
    var idP = parseInt(publish[i]["idP"]);
    data[idJ]["pubs"].push(pData[idP]);
    data[idJ]["minYear"] = Math.min(data[idJ]["minYear"], parseInt(pData[idP]["year"]));
    data[idJ]["maxYear"] = Math.max(data[idJ]["maxYear"], parseInt(pData[idP]["year"]));
  }
  loadControls();
  plot();
}

function loadControls()
{
  loadSearch();
  loadSort();
  loadSliderYear();
  loadPlotType();
}

function loadSearch(){
  $("#c_search").html("");
  var label = $("<label for='authors'>Search journal: </label>");
  var input = $("<input id='author'>");

  var names = [];
  for(var k in name2id) names.push(k);
  input.autocomplete({
    source: names,
    minLength: 1,
    autoFocus: true,
    select: function( event, ui ) {
      var id = name2id[ui.item.value];
      location.href = "journal?id=" + id;
    }
  });

  $("#c_search").append('<i class="fas fa-search"></i> ');
  $("#c_search").append(label);
  $("#c_search").append("<span> </span>");
  $("#c_search").append(input);
}

function loadSort(){
  var sortLabel = ["Name", "N° of publications"];
  $("#c_sort").html("");

  var label = $("<label for='sort'>Sort by: </label>");
  var fields = $("<form></form>");
  for(var i = 0; i<sortLabel.length; i++)
  {
    var id = "sort-"+i;
    var el = $("<input type='radio' name='sort' id='"+id+"' value='"+i+"'>");
    el.attr("checked", i == 0 );
    el.on("change",function(){
      sort = parseInt(this.value);
      plot();
    });
    fields.append(el)
    fields.append("<span> </span>");
    fields.append("<label for='"+id+"'>"+sortLabel[i]+"</label>");
    fields.append("<br>");
  }
  $("#c_sort").append('<i class="fas fa-sort-amount-up"></i> ');
  $("#c_sort").append(label);
  $("#c_sort").append(fields);
}

function loadSliderYear(){
  minYear = 3000;
  maxYear = 1000;

  for(var i=0; i<data.length; i++)
    minYear = Math.min(minYear, data[i]["minYear"]);
  for(var i=0; i<data.length; i++)
    maxYear = Math.max(maxYear, data[i]["maxYear"]);

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

function loadPlotType(){
  var plotLabel = ["Stream graph", "Stacked bar"]; // TODO, "Bar graph", "Stream graph" ];
  $("#c_chart").html("");

  var label = $("<label for='plot'>Plot type: </label>");
  var fields = $("<form></form>");
  for(var i = 0; i<plotLabel.length; i++)
  {
    var id = "plot-"+i;
    var el = $("<input type='radio' id='"+id+"' name='plot' value='"+i+"'>");
    el.attr("checked", i == 0 );
    el.on("change",function(){
      plotType = parseInt(this.value);
      plot();
    });
    fields.append(el);
    fields.append("<span> </span>");
    fields.append("<label for='"+id+"'>"+plotLabel[i]+"</label>");
    fields.append("<span> </span>");
    fields.append("<br>");
  }
  $("#c_chart").append('<i class="fas fa-chart-bar"></i> ');
  $("#c_chart").append(label);
  $("#c_chart").append(fields);

}

var sortF = [];
sortF[0] = (a,b) => (a["name"]< b["name"] ? -1 : 1);
sortF[1] = (a,b) => (b["pubs"].length - a["pubs"].length);

function filter()
{
  var ret = data.slice();
  ret.sort(sortF[sort]);
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
  $("#c_info").append("<div><i class='far fa-question-circle'></i> <b>" +data.length+ "</b> total journals in dataset</div>");
}

function updateList(data)
{
  $("#c_journals").html("");
  var list = $("<ul></ul>");
  list.css("max-height", "512px");
  for(var i=0; i<data.length; i++)
  {
    var el = $("<li><a href='journal?id=" +data[i]["id"]+ "'>[" +data[i]["tag"].toUpperCase() + "] " +data[i]["name"]+" ("+data[i]["pubs"].length+" publications between "+data[i]["minYear"]+" and "+data[i]["maxYear"]+")</a></li>");
    $("a",el).attr("id","journal-" + data[i]["id"]);
    el.hover((function(i){
      return function(){
        selectedId = i;
        plotFunctions[plotType](filterData);
      }
    })(data[i]["id"]), function(){
      selectedId = -1;
      plotFunctions[plotType](filterData);
    });
    list.append(el);
  }
  $("#c_journals").html("<h4>Journals list:</h4>");
  $("#c_journals").append(list);
}

plotDescr[0] = "";
plotFunctions[0] = function(dataF)
{
  // Chart 1
  var margin = {top: 50, right: 50, bottom: 50, left: 50};
  var width = 810 - margin.left - margin.right, height = 600 - margin.top - margin.bottom;

  $("#c_plot").html("");
  $("#c_plot").append("<h3>Plot</h3>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  $("#c_plot").append("<div>" + plotDescr[plotType] + "</div>");

    svg.selectAll("*").remove();

    g = svg.append("g");

    var data = [];
    for(var i=minYear; i<=maxYear; i++)
    {
      var o = {};
      o["year"] = i;
      for(var j=0; j<dataF.length; j++)
        o[dataF[j]["tag"]] = 0;
      data.push(o);
    }

    for(var i=0; i<dataF.length; i++)
    {
      var tag = dataF[i]["tag"];
      for(var j=0; j<dataF[i]["pubs"].length; j++)
      {
        var pub = dataF[i]["pubs"][j];
        if( pub["year"] < minYear ) continue;
        if( pub["year"] > maxYear ) continue;
        data[ pub["year"]-minYear ][tag]++;
      }
    }

      var keys = [];
      for(var i=0; i<dataF.length; i++)
        keys.push(dataF[i]["tag"]);

      var stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);

      var series = stack(data);

      var x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, width]);

      var xAxis = d3.axisTop(x);

      var y = d3.scaleLinear()
        .domain([0, d3.max(series, function(layer) {
          return d3.max(layer, function(d) {
            return d[0]+d[1];
          });
        })])
        .range([0, height]);

      var z = d3.scaleOrdinal().range(d3.schemeCategory10);

      var area = d3.area()
        .x(function(d) {
          return x(d.data.year);
        })
        .y0(function(d) {
          return y(d[0])+height/2;
        })
        .y1(function(d) {
          return y(d[1])+height/2;
        })
        .curve(d3.curveBasis);


      g.selectAll("path")
       .data(series)
       .enter().append("path")
       .attr("d", area)
       .style("fill", function(d, i) {
         $("#journal-"+i).css("color", z(i));
         return z(i);
       })
       .style("fill-opacity", function(d, i){
        return selectedId == -1 ? 1 : ( selectedId == i ? 1 : 0.5 );
       })
       .style("cursor", "pointer")
       .on("click", function(d,i){
          location.href = "journal?id=" + i;
        })
       .append("svg:title")
       .text(function(d, i){ data[i]["name"] });

      g.append("g").call(xAxis.ticks(16));
      z.domain(keys);

};

plotDescr[1] = "";
plotFunctions[1] = function(data)
{
  // Chart 1
  var margin = {top: 10, right: 20, bottom: 70, left: 70};
  var width = 810 - margin.left - margin.right, height = 600 - margin.top - margin.bottom;

  $("#c_plot").html("");
  $("#c_plot").append("<h3>Plot</h3>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  $("#c_plot").append("<div>" + plotDescr[plotType] + "</div>");

  svg.selectAll("*").remove();

// set x scale
var x = d3.scaleBand()
    .rangeRound([0, width]);
//    .paddingInner(0.05)
//    .align(0.1);

// set y scale
var y = d3.scaleLinear()
    .rangeRound([height, 0]);

// set the colors
var z = d3.scaleOrdinal()
    .range(d3.schemeCategory10);


  keys = [];
  for(var i = 0; i < data.length; i++)
     keys.push(data[i]["tag"]);


  var g = svg;

  var dataP = [];
  for(var i=minYear; i<= maxYear; i++)
  {
    var o = {};
    o["year"] = i;
    for(var k in keys) o[keys[k]] = 0;
    dataP.push(o);
  }

  for(var i=0; i<data.length; i++)
  {
    for(var j=0; j<data[i]["pubs"].length; j++)
    {
      var yy = data[i]["pubs"][j]["year"];
      if( yy < minYear ) continue;
      if( yy > maxYear ) continue;
      dataP[yy-minYear][data[i]["tag"]]++;
    }
  }

  x.domain(d3.range(minYear, maxYear+1)); // d3.range(minYear, maxYear)).nice();
  y.domain([0, d3.max(dataP, function(d){
    var val = 0;
    for(var k in d)
      if( k != "year" )
        val += d[k]
    return val;
  })]).nice();

  z.domain(keys);

  for(var i=0; i<data.length; i++)
    $("#journal-" + data[i]["id"] ).css("color", z(data[i]["tag"]) );

  g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(keys)(dataP))
    .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return x(d.data["year"]); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
    .on("mouseover", function() { tooltip.style("display", "block"); })
    .on("mouseout", function() { tooltip.style("display", "none"); })
    .on("mousemove", function(d, i) {
      var xPosition = d3.mouse(this)[0] - 75;
      var yPosition = d3.mouse(this)[1] - 25;
      console.log(d);
      var dif = d[1]-d[0];
      var lab = "";
      for(var k in d.data)
        if( d.data[k] == dif )
          lab = k;
      tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
      tooltip.select("text").text(lab + " - " + dif);
    });

  // X AXIS
  g.append("g")
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
            "translate(" + (width/2) + " ," + (height + margin.top + 40) + ")")
      .style("text-anchor", "middle")
      .text("Year");

  // Y AXIS
  g.append("g")
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
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of publications");

  // Prep the tooltip bits, initial display is hidden
  tooltip = g.append("g")
    .style("display", "none")
    .style("opacity", 1)
    .style("z-index", 1000);

  tooltip.append("rect")
    .attr("width", 80)
    .attr("height", 20)
    .attr("fill", "white")
    .style("text-align", "center")
    .style("opacity", .5)
    .style("z-index", 1000);

  tooltip.append("text")
    .attr("x", 40)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .style("text-align", "center")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");



};
