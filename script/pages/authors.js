var plotFunctions = [];
var filterFunctions = [];
var plotDescr = [];
var sort = 0;
var minPub = 0;
var maxPub = 0;
var minYear = 0;
var maxYear = 0;
var plotType = 0;
var selectedId = -1;

$(function(){
  loadAuthors(function(authors){
    loadWrote(function(wrote){
      loadPapers(function(papers){
        parseData(authors, wrote, papers);
      });
    });
  });
});

var data = [];
var name2id = {};
// [id, name, minYear, maxYear, n° pub]

function parseData(authors, wrote, papers)
{
  // Parse
  for(var i=0; i<authors.length; i++)
  {
    name2id[ authors[i]["name"] ] = parseInt(authors[i]["id"]);
    data[parseInt(authors[i]["id"])] = authors[i];
    data[parseInt(authors[i]["id"])]["pubs"] = [];
    data[parseInt(authors[i]["id"])]["minYear"] = 3000;
    data[parseInt(authors[i]["id"])]["maxYear"] = 1000;
  }
  var pData = []
  for(var i=0; i<papers.length; i++)
    pData[ parseInt(papers[i]["id"]) ] = papers[i];

  for(var i=0; i<wrote.length; i++)
  {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    data[idA]["pubs"].push(pData[idP]);
    data[idA]["minYear"] = Math.min(data[idA]["minYear"], parseInt(pData[idP]["year"]));
    data[idA]["maxYear"] = Math.max(data[idA]["maxYear"], parseInt(pData[idP]["year"]));
  }
  loadControls();
  plot();
}

function loadControls()
{
  loadSearch();
  loadSort();
  loadSliderPub();
  loadSliderYear();
  loadPlotType();
  filterFunctions[plotType]();

}

function loadSearch(){
  $("#c_search").html("");
  var label = $("<label for='authors'>Search author: </label>");
  var input = $("<input id='author'>");

  var names = [];
  for(var k in name2id) names.push(k);
  input.autocomplete({
    source: names,
    minLength: 3,
    autoFocus: true,
    select: function( event, ui ) {
      var id = name2id[ui.item.value];
      location.href = "author?id=" + id;
    }
  });

  $("#c_search").append('<i class="fas fa-search"></i> ');
  $("#c_search").append(label);
  $("#c_search").append("<span> </span>");
  $("#c_search").append(input);
}

function loadSort(){
  var sortLabel = ["Name", "Year", "N° of publications"];
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

function loadSliderPub(){
  minPub = 1;
  maxPub = 0;
  for(var i=0; i<data.length; i++)
    maxPub = Math.max(maxPub, data[i]["pubs"].length);
  var sliderPubText = $("<span></span>");
  var sliderPubSlider = $("<div id='slider_pub'></div>");

  sliderPubText.html("Number of publications: <b>"+minPub+" - "+maxPub+"</b>");
  sliderPubSlider.slider({
   range: true,
   min: minPub,
   max: maxPub,
   values: [minPub, maxPub],
   slide: function( event, ui ) {
      minPub = ui.values[0];
      maxPub = ui.values[1];
      sliderPubText.html("Number of publications: <b>"+minPub+" - "+maxPub+"</b>");
      plot();
    }
  });

  $("#c_slider_pub").append('<i class="fas fa-list-ol"></i> ');
  $("#c_slider_pub").append(sliderPubText);
  $("#c_slider_pub").append("<div></div>");
  $("#c_slider_pub").append(sliderPubSlider);
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

  sliderYearText.html("Years of publications: <b>"+minYear+" - "+maxYear+"</b>");
  sliderYearSlider.slider({
   range: true,
   min: minYear,
   max: maxYear,
   values: [minYear, maxYear],
   slide: function( event, ui ) {
      minYear = ui.values[0];
      maxYear = ui.values[1];
      sliderYearText.html("Years of publications: <b>"+minYear+" - "+maxYear+"</b>");
      plot();
    }
  });

  $("#c_slider_years").append('<i class="fas fa-calendar-alt"></i> ');
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append(sliderYearSlider);

}

function loadPlotType(){
  var plotLabel = ["Career timeline"]; // TODO, "Bar graph", "Stream graph" ];
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
    var optimalView = $("<span>(optimal filters)</span>");
    optimalView.css("color", "#007bff");
    optimalView.css("cursor", "pointer");
    optimalView.on("click", (function(i){return function(){filterFunctions[i]();}})(i) );
    fields.append(el);
    fields.append("<span> </span>");
    fields.append("<label for='"+id+"'>"+plotLabel[i]+"</label>");
    fields.append("<span> </span>");
    fields.append(optimalView);
    fields.append("<br>");
  }
  $("#c_chart").append('<i class="fas fa-chart-bar"></i> ');
  $("#c_chart").append(label);
  $("#c_chart").append(fields);

}

var sortF = [];
sortF[0] = (a,b) => (a["name"]< b["name"] ? -1 : 1);
sortF[1] = (a,b) => (a["minYear"] - b["minYear"]);
sortF[2] = (a,b) => (b["pubs"].length - a["pubs"].length);

function filter()
{
  var ret = [];
  for(var i=0; i<data.length; i++)
  {
    if( data[i]["pubs"].length < minPub ) continue;
    if( data[i]["pubs"].length > maxPub ) continue;
    if( data[i]["minYear"] < minYear ) continue;
    if( data[i]["maxYear"] > maxYear ) continue;

    ret.push(data[i]);
  }
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
  $("#c_info").append("<div><b>" +data.length+ "</b> total authors in dataset</div>");
  $("#c_info").append("<div>Selected <b>" +dataF.length+ "</b> authors with number of publications between <b>" +minPub+ "</b> and <b>" +maxPub+ "</b> in the years <b>" +minYear+ "</b> - <b>" +maxYear+ "</b>  </div>");
}

function updateList(data)
{
  $("#c_authors").html("");
  var list = $("<ul></ul>");
  list.css("max-height", "376px");
  list.css("overflow-y", "scroll");
  for(var i=0; i<data.length; i++)
  {
    var el = $("<li><a href='author?id="+data[i]["id"]+"'>"+data[i]["name"]+" ("+data[i]["pubs"].length+" publications between "+data[i]["minYear"]+" and "+data[i]["maxYear"]+")</a></li>");
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
  $("#c_authors").html("<h4>Authors list:</h4>");
  $("#c_authors").append(list);
}

filterFunctions[0] = function()
{
  $("#sort-0").attr("checked", false);
  $("#sort-1").attr("checked", false);
  $("#sort-2").attr("checked", true);
  sort = 2;
  minPub = 10;
  maxPub = 127;
  $("#slider_pub").slider( "values", 0, minPub );
  $("#slider_pub").slider( "values", 1, maxPub );
  //$("#slider_pub").slider('option', 'slide')(null, { values: $("#slider_pub").slider('values') })
}

plotDescr[0] = "In this plot we have in the x-axis the years of career (starting from the year of the first publication of each authors) ";
plotDescr[0] += "and in the y-axis we have the number of publications so far.<br>";
plotDescr[0] += "Each path is an author career, its point correspond to the years in which the author has made af least one publications<br>";
plotDescr[0] += "Mouse over an author in the list to highlight its corrisponding career in the plot!";

plotFunctions[0] = function(data)
{
  // Chart 1
  var margin = {top: 10, right: 10, bottom: 55, left: 55};
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

  var minX = 0;
  var minY = 0;
  var maxX = 0;
  var maxY = 0;

  for(var i=0; i<data.length; i++)
  {
    maxX = Math.max(maxX, data[i]["maxYear"]-data[i]["minYear"]);
    maxY = Math.max(maxY, data[i]["pubs"].length);
  }

  // X AXIS - year
  var x = d3.scalePoint().range([0, width]);
  x.domain(d3.range(minX, maxX+1));

  svg.append("text")
      .attr("transform",
            "translate(" + (width/2) + " ," +
                           (height + margin.top + 25) + ")")
      .style("text-anchor", "middle")
      .text("years of career");

  // Y AXIS - n pub
  var y = d3.scaleLinear().range([height, 0]);
  y.domain([minY, maxY+1]);

  svg.append("g").call(d3.axisLeft(y).ticks(20));
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));


  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("number of publications");

  // Data plot
  for(var i=0; i<data.length; i++)
  {
    var years = [];
    for(var k=0; k<data[i]["pubs"].length; k++)
      years.push( parseInt( data[i]["pubs"][k]["year"] ) );
    years.sort();

    for(var k=1; k<years.length; k++)
      years[k] -= years[0];
    years[0] = 0;

    var contYear = {};
    for(var k=0; k<years.length; k++)
      contYear[years[k]] = 0;
    for(var k=0; k<years.length; k++)
      contYear[years[k]]++;

    var points = [];
    for(var k in contYear)
      points.push( [k, contYear[k]] );
    points.sort( (a,b) => a[0] - b[0] );

    for(var k=1; k<points.length; k++)
      points[k][1] += points[k-1][1];

    var line = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))

    svg.append("path")
       .attr("d", line(points))
       .attr("stroke", data[i]["id"] == selectedId ? "red" : "blue")
       .attr("stroke-width", data[i]["id"] == selectedId ? 2 : 1)
       .attr("stroke-opacity", data[i]["id"] == selectedId ? 1 : .25)
       .attr("fill", "none");

    svg.selectAll("dot")
       .data([ points[points.length-1] ])
       .enter().append("circle")
       .attr("r", 4)
       .attr("cx", function(d) { return x(d[0]); })
       .attr("cy", function(d) { return y(d[1]); })
       .attr("stroke", data[i]["id"] == selectedId ? "red" : "blue")
       .attr("fill", data[i]["id"] == selectedId ? "red" : "blue")
       .attr("stroke-width", data[i]["id"] == selectedId ? 2 : 1)
       .attr("stroke-opacity", data[i]["id"] == selectedId ? 1 : .25)
       .attr("fill-opacity", .3)
       .style("cursor", "pointer")
       .on("click", (function(id){ return function(d){
          location.href = "author?id=" + id;
        };
       })(data[i]["id"]))
      .append("svg:title")
      .text(data[i]["name"]);
  }

};

plotFunctions[1] = function(data)
{
  // Chart 2
};
