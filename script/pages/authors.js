var plotDescr = [];
var sort = 0;
var minPub = 0;
var maxPub = 0;
var minYear = 0;
var maxYear = 0;
var minCitations = 0;
var maxCitations = 0;
var plotType = 0;
var selectedId = getQueryVariable("ids");
//var selectedColor = d3.schemeDark2.slice().concat(d3.schemeCategory10);
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
var pData = []
var wrotePA = {};

function parseData(authors, wrote, papers, publish, journals, citations) {
  dJournals = journals;


  for (var i = 0; i < authors.length; i++) {
    name2id[authors[i]["name"]] = parseInt(authors[i]["id"]);
    data[parseInt(authors[i]["id"])] = authors[i];
    data[parseInt(authors[i]["id"])]["pubs"] = [];
    data[parseInt(authors[i]["id"])]["minYear"] = 3000;
    data[parseInt(authors[i]["id"])]["maxYear"] = 1000;
  }
  for (var i = 0; i < papers.length; i++) 
  {
    pData[parseInt(papers[i]["id"])] = papers[i];
    dCitations[ +papers[i]["id"] ] = [];
  }
  for(var i=0; i<citations.length; i++)
  {
    var idP1 = +citations[i]["idP1"];
    var idP2 = +citations[i]["idP2"];
    dCitations[idP1].push(idP2);
  }

  for (var i = 0; i < wrote.length; i++) {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    if( wrotePA[idP] == undefined ) wrotePA[idP] = [];
    wrotePA[idP].push(idA);
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
  loadSliderCitations();
  updateAuthors();
  loadPlotType();
}

function loadSearch() {
  $("#c_search").html("");
  addCollapse();
  var input = $("<input style='width: 100%' id='author'>");

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

  $("#c_search").append('<b><i class="fas fa-search"></i> Search author:</b><br>');
  $("#c_search").append("<span> </span>");
  $("#c_search").append($("<div>").css("width", "100%").append(input));
}

function updateAuthors()
{
  if( selectedId.length > 0 ) updateQueryStringParam("ids", selectedId.join(","));
  var ol = $("<ol>").css("padding-left", "50px");

  for(var i=0; i<selectedId.length; i++)
  {
    var li = $("<li>");
    li.append( $("<a>").text( data[selectedId[i]]["name"] ).attr("href", "author?id=" + selectedId[i])/*.css("color", selectedColor[i] + " !important")*/ )
      .append(" - ")
      .append( $("<i class='fas fa-times'></i>").css({"color":"red","cursor": "pointer"}).on("click", (function(id){
        return function(){
          var pos = selectedId.indexOf(id);
          selectedId = selectedId.slice(0, pos).concat(selectedId.slice(pos+1));
          updateAuthors();
          plot();
        }
      })(selectedId[i])))
    ol.append(li);
  }
  $("#c_selected").html("");
  addCollapse();
  $("#c_selected").append('<b><i class="fas fa-user"></i> Selected authors:</b>');
  $("#c_selected").append($("<div>").css("width","100%").append(ol));
}

function loadSort() {
  var sortLabel = ["Name", "Year", "Number of publications"];
  $("#c_sort").html("");
  addCollapse();

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
  $("#c_sort").append($("<div>").css("width","100%").append(fields));
}

function loadSliderPub() {

  minPub = 10;
  maxPub = 128;

  var sliderPubText = $("<span></span>");
  var sliderPubSlider = $("<div id='slider_pub'></div>");

  sliderPubText.html("<b><i class='fas fa-list-ol'> </i> Number of publications: " + minPub + " - " + maxPub + "</b>");
  sliderPubSlider.slider({
    range: true,
    min: 1,
    max: d3.max(data, x => x["pubs"].length),
    values: [minPub, maxPub],
    slide: function(event, ui) {
      minPub = ui.values[0];
      maxPub = ui.values[1];
      sliderPubText.html("<b><i class='fas fa-list-ol'> </i> Number of publications: " + minPub + " - " + maxPub + "</b>");
      plot();
    }
  });

  addCollapse();
  $("#c_slider_pub").append(sliderPubText);
  $("#c_slider_pub").append("<div></div>");
  $("#c_slider_pub").append($("<div>").css("width","100%").append(sliderPubSlider));
}

function loadSliderYear() {
  minYear = 1985;
  maxYear = 1000;
  for (var i = 0; i < data.length; i++)
    maxYear = Math.max(maxYear, data[i]["maxYear"]);
  var sliderYearText = $("<span></span>");
  var sliderYearSlider = $("<div id='slider_year'></div>");

  sliderYearText.html("<b><i class='fas fa-calendar-alt'> </i> Years of publications: "+minYear+" - " + maxYear + "</b>");
  sliderYearSlider.slider({
    range: true,
    min: d3.min(data, x => x["minYear"]),
    max: maxYear,
    values: [1985, maxYear],
    slide: function(event, ui) {
      minYear = ui.values[0];
      maxYear = ui.values[1];
      sliderYearText.html("<b><i class='fas fa-calendar-alt'> </i> Years of publications: " + minYear + " - " + maxYear + "</b>");
      plot();
    }
  });

  addCollapse();
  $("#c_slider_years").append(sliderYearText);
  $("#c_slider_years").append($("<div>").css("width","100%").append(sliderYearSlider));

}
function loadSliderCitations() {
  minCitations = 0;
  maxCitations = d3.max(data, function(x){
    return d3.max( x["pubs"], y => (dCitations[y["id"]]||[]).length);
  });

  var sliderCitationsText = $("<span></span>");
  var sliderCitationsSlider = $("<div id='slider_citations'></div>");

  sliderCitationsText.html("<b><i class='fas fa-quote-right'> </i> Number of citations: " + minCitations + " - " + maxCitations + "</b>");
  sliderCitationsSlider.slider({
    range: true,
    min: 0,
    max: maxCitations,
    values: [minCitations, maxCitations],
    slide: function(event, ui) {
      minCitations = ui.values[0];
      maxCitations = ui.values[1];
      sliderCitationsText.html("<b><i class='fas fa-quote-right'> </i> Number of citations: " + minCitations + " - " + maxCitations + "</b>");
      plot();
    }
  });

  $("#c_slider_citations").html("");
  addCollapse();
  $("#c_slider_citations").append(sliderCitationsText);
  $("#c_slider_citations").append($("<div>").css("width","100%").append(sliderCitationsSlider));

}

var proprs = {
  "X-Axis": ["Absolute year of career", "Relative year of career"],
  "Y-Axis": ["Number of citations", "Number of citations (right years)", "Number of papers"],
  "Colors": ["Number of papers", "Number of citations", "None"],
  "Path-Style": ["Color per path", "Color per segment"]
};



function loadPlotType()
{

  var fields = $("<div>");

  window["props"] = [];
  for(var props in proprs)
  {
    window["props"][props] = 0;
    var fieldsSet = $('<form class="custom-controls-stacked">');
    fieldsSet.append("<label><b>" +props+ ":</b></label><br/>");
    var select = $("<select>").attr("name", props).css("width", "100%");
    for(var i=0; i<proprs[props].length; i++)
    {
      var name = proprs[props][i];

      var field = $("<option>").text(name).attr("value", i);

      select.append(field);
    }

    select.on("change", function(){
      var name = $(this).attr("name");
      var value =  this.value;
      console.log(name, value);
      window["props"][name] = +value;
      plot();
    });

    fieldsSet.append(select);
    fields.append(fieldsSet);
  }

  $("#c_chart").html();
  $("#c_chart").append('<b><i class="fas fa-chart-bar"></i> Plot type: </b>');
  $("#c_chart").append($("<div>").css("width","100%").append(fields));

}
var journalsBanned = {};

var sortF = [];
sortF[0] = (a, b) => (a["name"] < b["name"] ? -1 : 1);
sortF[1] = (a, b) => (a["minYear"] - b["minYear"]);
sortF[2] = (a, b) => (b["pubs"].length - a["pubs"].length);

var filterData = [];

function filter()
{
  var aid = {};
  var pubOk = pData.filter(function(x){
    var cit = (dCitations[ x["id"] ] || []);
    if( cit.length < minCitations ) return false;
    if( cit.length > maxCitations ) return false;

    for(var i=0; i< (wrotePA[ +x["id"] ]||[]).length; i++)
    {
      var idA = wrotePA[ x["id"] ][i];
      if( aid[idA] == undefined ) aid[idA] = { pubs: [] };
      aid[idA]["pubs"].push( x );
    }
    return true;
  });

  var dataRet = [];
  for(var idA in aid)
  {
    aid[idA]["id"] = idA;
    aid[idA]["name"] = data[idA]["name"];
    aid[idA]["minYear"] = data[idA]["minYear"];
    aid[idA]["maxYear"] = data[idA]["maxYear"];
    if( aid[idA]["maxYear"] > maxYear ) continue;
    if( aid[idA]["minYear"] < minYear ) continue;
    if( aid[idA]["pubs"].length < minPub ) continue;
    if( aid[idA]["pubs"].length > maxPub ) continue;
    dataRet.push( aid[idA] );
  }
  dataRet.sort( sortF[sort] );
  return dataRet;
}

function plot() {
  filterData = filter();
  updateInfo(filterData);
  updateList(filterData);
  updateQuote(filterData);
  draw(filterData);
}

function updateInfo(dataF) {
  $("#c_info").html("");
  addCollapse();
  $("#c_info").append("<div><i class='fas fa-info-circle'></i> <b>" + data.length + "</b> total authors in dataset</div>");
  $("#c_info").append("<div style='width: 100%'>Selected <b>" + dataF.length + "</b> authors with number of publications between <b>" + minPub + "</b> and <b>" + maxPub + "</b> in the years <b>" + minYear + "</b> - <b>" + maxYear + "</b>  </div>");
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
        draw(filterData);
      }
    })(+data[i]["id"]), (function(i){ return function() {
      if( selectedId.indexOf(i) != -1 ){
      var pos = selectedId.indexOf(i);
      selectedId = selectedId.slice(0, pos).concat(selectedId.slice(pos+1));;
        draw(filterData);
      }
      }
    })(+data[i]["id"]));
    list.append(el);
  }
  $("#c_authors").html("<b><i class='fas fa-users'></i> Authors list:</b>");
  addCollapse();
  $("#c_authors").append(list);
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

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

/****************************************************************************************/
function draw(data){

  var margin = {
    top: 25,
    right: 40,
    bottom: 55,
    left: 55
  };

  var wH = window.innerHeight;
  var innerH = getOffset( $("#c_plot")[0] ).top;
  var width = $("#c_plot").width() - margin.left - margin.right;
  var height1 = (wH - innerH-100) - margin.top - margin.bottom;
  var height2 = $("#c_plot").width()*3/4 - margin.top - margin.bottom;
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

  var minX = 0;
  var minY = 0;

  var maxX = 0;
  var maxY = 0;

  if( window["props"]["Y-Axis"] < 2 )
  {
    minY = 0;
    maxY = 1+d3.max( data, function(x){
      return d3.sum( x["pubs"], y => (dCitations[y["id"]]||[]).length);
    });
  }
  else
  {
    minY = 0;
    maxY = 1+d3.max(data, x => x["pubs"].length);
  }

  if( window["props"]["X-Axis"] == 0 )
  {
    minX = d3.min( data, x => x["minYear"] );
    maxX = d3.max( data, x => x["maxYear"] );
  }
  else
  {
    minX = 0;
    maxX = d3.max( data, x => x["maxYear"] - x["minYear"] );
  }

  // X AXIS - year
  var x = d3.scaleLinear().range([0, width]);
  x.domain([minX, maxX]).nice();

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 25) + ")")
    .style("text-anchor", "middle")
    .text( proprs["X-Axis"][ window["props"]["X-Axis"] ] );

  // Y AXIS - n pub
  var y = d3.scaleLinear().range([height, 0]);
  y.domain([minY, maxY + 1]).nice();

  svg.append("g").call(d3.axisLeft(y).ticks(20));
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(16))
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
    .text( proprs["Y-Axis"][ window["props"]["Y-Axis"] ] );

  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", 1)
    .style("text-size", "10px");

  var citNum = data.map(a => d3.sum(a["pubs"], p => (dCitations[p["id"]]||[]).length));
  citNum = citNum.filter(function(item, pos) {
    return citNum.indexOf(item) == pos;
  });
  citNum.sort();

  mapPapers = data.map( x => x["pubs"].length );
  mapCitations = data.map(function(x){
    return d3.sum(x["pubs"], y => (dCitations[y["id"]] || []).length );
  });

  mapPapers = mapPapers.filter(function(item, pos) {
    return mapPapers.indexOf(item) == pos;
  }).sort( (a,b) => a-b );

  mapCitations = mapCitations.filter(function(item, pos) {
    return mapCitations.indexOf(item) == pos;
  }).sort( (a,b) => a-b);

  var colorScale = d3.scaleLinear().domain([0, 1]).range(['red', "blue"]);

  // Color bar
    var legend = svg.append("defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");

    for(var i=0; i<= 10; i+=.1)
    legend.append("stop")
      .attr("offset", (i*100)+"%")
      .attr("stop-color", colorScale(i))
      .attr("stop-opacity", 1);

  if( window["props"]["Colors"] <= 1 )
  {

    svg.append("rect")
      .attr("width", Math.min( width/2,  150) )
      .attr("height", 20)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(10, 30)");

    var yColor;
    if( window["props"]["Colors"] == 0 )
    {

    yColor = d3.scaleLinear()
      .range([0,  Math.min( width/2,  150) ])
      .domain( [mapPapers[0], mapPapers[mapPapers.length-1] ] ).nice();

    }
    else
    {
      yColor = d3.scaleLinear()
      .range([0,  Math.min( width/2,  150) ])
      .domain( [mapCitations[0], mapCitations[mapCitations.length-1] ] ).nice();


    }
    var yAxis = d3.axisBottom()
      .scale(yColor)
      .tickValues( yColor.domain() );

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(10, 50)")
      .call(yAxis)

    svg.append("text")
    .attr("transform",
      "translate("+(10+Math.min( width/2,  150)/2) +", 20)")
    .style("text-anchor", "middle")
    .attr("size", "10px")
    .text( proprs["Colors"][ window["props"]["Colors"] ] );


  }

  data.sort( function(a,b){
    var idA = selectedId.indexOf(a["id"]);
    var idB = selectedId.indexOf(b["id"]);
    if( idA == -1 && idB == 1 ) return -1;
    if( idA == 1 && idB == -1 ) return 1;
    return a["id"]-b["id"];
  });

  // Data plot
  for (var i = 0; i < data.length; i++) {

    var pathCitationsReal = {};
    var pathCitations = {};
    var pathPapers = {};

    for (var k = 0; k < data[i]["pubs"].length; k++)
    {
      var pub = data[i]["pubs"][k];
      var year = +pub["year"];
      var citations = (dCitations[pub["id"]]||[]);
      if( pathCitations[year] == undefined ) pathCitations[year] = 0;
      if( pathPapers[year] == undefined ) pathPapers[year] = 0;

      pathCitations[year] += citations.length;
      pathPapers[year]++;

      for(var l=0; l<citations.length; l++)
      {
        var trueYear = +pData[ citations[l] ]["year"];
        if( pathCitationsReal[trueYear] == undefined ) pathCitationsReal[trueYear] = 0;
        pathCitationsReal[trueYear]++;
      }
    }

    pathCitationsRealA = [];
    pathCitationsA = [];
    pathPapersA = [];

    if( pathCitationsReal[ data[i]["minYear"] ] == undefined )
      pathCitationsReal[ data[i]["minYear"] ] = 0;

    if( pathCitations[ data[i]["minYear"] ] == undefined )
      pathCitations[ data[i]["minYear"] ] = 0;

    for(var year in pathCitationsReal)
      pathCitationsRealA.push( [+year, pathCitationsReal[year], +data[i]["id"]] );
    pathCitationsRealA.sort( (a,b) => a[0] - b[0]);
    for(var k=1; k<pathCitationsRealA.length; k++)
      pathCitationsRealA[k][1] += pathCitationsRealA[k-1][1];

    for(var year in pathCitations)
      pathCitationsA.push( [+year, pathCitations[year], +data[i]["id"]] );
    pathCitationsA.sort( (a,b) => a[0] - b[0]);
    for(var k=1; k<pathCitationsA.length; k++)
      pathCitationsA[k][1] += pathCitationsA[k-1][1];

    for(var year in pathPapers)
      pathPapersA.push( [+year, pathPapers[year], +data[i]["id"]] );
    pathPapersA.sort( (a,b) => a[0] - b[0]);
    for(var k=1; k<pathPapersA.length; k++)
      pathPapersA[k][1] += pathPapersA[k-1][1];

    var line = d3.line()
      .x(d => x(d[0] - ((window["props"]["X-Axis"]) * window.data[d[2]]["minYear"]) ))
      .y(d => y(d[1]))

    var dots = [pathCitationsA, pathCitationsRealA, pathPapersA];
    var dataSet = dots[window["props"]["Y-Axis"]];

    var color = "steelblue";

/*    if( selectedId.indexOf(+data[i]["id"]) != -1 )
      color = selectedColor[ selectedId.indexOf(+data[i]["id"]) ];
    else */ if( window["props"]["Colors"] == 2 )
    {
      color = "steelblue";
    }
    else if( window["props"]["Colors"] == 1 )
    {
      var maxC = pathCitationsA[pathCitationsA.length - 1][1];
      var idx = mapCitations.indexOf( maxC );
      color = idx*1. / mapCitations.length ;
    }
    else if( window["props"]["Colors"] == 0 )
    {
      var maxP = pathPapersA[pathPapersA.length - 1][1];
      var idx = mapPapers.indexOf( maxP );
      color = idx*1. / mapPapers.length ;
    }

      var linearGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "linear-gradient-" + data[i]["id"])
            .attr("gradientTransform", "rotate(0)")
            .attr("y1", "0%")
            .attr("x1", "100%")
            .attr("y2", "100%")
            .attr("x2", "100%")

      if( selectedId.indexOf(+data[i]["id"]) == -1 && window["props"]["Path-Style"] == 1 && window["props"]["Colors"] != 2 )
      {
        for(var p=0; p<=color; p +=.05)
          linearGradient.append("stop")
            .attr("offset", parseInt(p*100)+"%")
            .attr("stop-color", colorScale(p) );
        color = colorScale(color);
      }
      else
      {

        if( typeof color == "number") color = colorScale(color);

        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color);
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color);
      }


      svg.append("path")
      .attr("d", line(dataSet) )
      .attr("class", "path-" + data[i]["id"])
      .attr("stroke", "url(#linear-gradient-"+data[i]["id"]+")")
      .attr("stroke-width", selectedId.indexOf(+data[i]["id"]) != -1 ? 3 : 1)
      .attr("stroke-opacity", selectedId.indexOf(+data[i]["id"]) != -1 ? 1 : .25)
      .attr("fill", "none")
      .attr("z-index", selectedId.indexOf(+data[i]["id"]) == -1 ? 1 : 100);

    var dot = svg.selectAll("dot")
      .data( [ dataSet[dataSet.length-1] ]  )
      .enter().append("circle")
      .attr("r", 4)
      .attr("cx", function(d) {
        return x(d[0] - ((window["props"]["X-Axis"]) * window.data[d[2]]["minYear"]) );
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("stroke", color )
      .attr("z-index", selectedId.indexOf(+data[i]["id"]) == -1 ? 1 : 100)
      .attr("fill", color)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 1)
      .attr("fill-opacity", .3)
      .style("cursor", "pointer")
      .attr("real-color", color )
      .attr("tooltip-text", data[i]["name"] + " " + pathPapersA[pathPapersA.length - 1][1] + "p " + pathCitationsA[pathCitationsA.length - 1][1] + "c")
      .on("click", function(d){ location.href = "author?id="+d[2]; })

    if(  selectedId.indexOf(+data[i]["id"]) == -1 )
    {
      dot.on("mouseover", function(d) {

          tooltip.style("display", "block");
          tooltip.html( d3.select(this).attr("tooltip-text") )
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

          d3.select(this).attr("fill", "green").attr("fill-opacity", 1).attr("stroke", "green");
          var path = d3.select(".path-" + d[2])
          path.attr("stroke", "green");
          path.attr("stroke-opacity", 1);
          path.attr("stroke-width", 3);

      })
      .on("mouseout", function(d) {
          tooltip.style("display", "none");
          var t = d3.select(this);
          var c = t.attr("real-color");
          t.attr("fill", c).attr("fill-opacity", .3).attr("stroke", c)
          var path = d3.select(".path-" + d[2])
          path.attr("stroke", c);

          if( window["props"]["Path-Style"] == 1)
          {
            draw(filterData);
            return;
          }
          if( selectedId.indexOf( +d[2] ) != -1 ) return;

          path.attr("stroke-opacity", .25);
          path.attr("stroke-width", 1);

      });

    }
    else
    {
      var d = dataSet[dataSet.length-1];
      d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("display", "block")
      .style("opacity", 1)
      .style("text-size", "10px")
      .html(  data[i]["name"] + " " + pathPapersA[pathPapersA.length - 1][1] + "p " + pathCitationsA[pathCitationsA.length - 1][1] + "c" )
      .style("left", (25+margin.left + getOffset( $("#c_plot")[0] ).left + x(d[0] - ((window["props"]["X-Axis"]) * window.data[d[2]]["minYear"]) ) ) + "px" )
      .style("top", (15+margin.top + getOffset( $("#c_plot")[0] ).top + y(d[1]) ) + "px")


    }

  }

};

