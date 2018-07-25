var authIds = getQueryVariable("ids");

if (authIds == null) authIds = [];
else authIds = authIds.split(",").map(x => +x);

var degree = 1;
var plotType = 0;

$(function() {
  loadAuthors(function(authors) {
    loadWrote(function(wrote) {
      loadPapers(function(papers) {
        parseData(authors, wrote, papers);
      });
    });
  });
});

var data = [];
var graph = {};
var wrotes = {};
var name2id = {};
var coauth = {};

// { idA: { idA1: [idPaper,...] }

function parseData(authors, wrote, papers) {

  data = authors;
  for (var i = 0; i < data.length; i++) {
    name2id[data[i]["name"]] = data[i]["id"];
    data[i]["pubs"] = [];
  }

  for (var i = 0; i < wrote.length; i++) {
    var idA = parseInt(wrote[i]["idA"]);
    var idP = parseInt(wrote[i]["idP"]);
    if (wrotes[idP] == undefined) wrotes[idP] = [];
    wrotes[idP].push(idA);
    data[idA]["pubs"].push(idP);
  }

  for (var idP in wrotes) {
    for (var i = 0; i < wrotes[idP].length; i++)
      for (var j = 0; j < wrotes[idP].length; j++) {
        if (i == j) continue;
        var idA1 = wrotes[idP][i];
        var idA2 = wrotes[idP][j];
        if (graph[idA1] == undefined) graph[idA1] = {};
        if (graph[idA1][idA2] == undefined) graph[idA1][idA2] = [];
        graph[idA1][idA2].push(parseInt(idP));
      }
  }

  for (var k in wrotes) {
    for (var i = 0; i < wrotes[k].length; i++)
      for (var j = i + 1; j < wrotes[k].length; j++)
        if (i != j) {
          var s = wrotes[k][i] + "-" + wrotes[k][j];
          if (coauth[s] == undefined) coauth[s] = 0;
          coauth[s]++;
        }
  }

  loadControls();
  plot();
}

function loadControls() {
  loadSearch();
  loadPlotType();
  loadCouple();
  loadCollab();
}

// c_collab
function loadCollab() {
  var cid = [];
  for (var k in graph)
    cid.push([k, Object.keys(graph[k]).length]);
  cid.sort((a, b) => b[1] - a[1]);

  $("#c_collab").html("");
  addCollapse();
  var ul = $("<ol></ol>").css("padding-left", "50px");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");
  for (var i = 0; i < 256; i++) {
    var idA1 = +cid[i][0];
    var cont = +cid[i][1];
    var li = $("<li></li>");
    li.append("<a href='author?id=" + idA1 + "'>" + data[idA1]["name"] + "</a>");
    li.append(" (" + cont + " coauthors)");
    ul.append(li);
  }

  $("#c_collab").append('<b><i class="fas fa-globe-africa"></i> Most collaborative authors:</b>');
  $("#c_collab").append(ul);
}

function loadCouple() {
  var cid = [];
  for (var k in coauth)
    cid.push([coauth[k], k.split("-")]);
  cid.sort((a, b) => b[0] - a[0]);

  $("#c_couple").html("");
  addCollapse();

  var ul = $("<ol></ol>").css("padding-left", "50px");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");
  for (var i = 0; i < 256; i++) {
    var idA1 = +cid[i][1][0];
    var idA2 = +cid[i][1][1];
    var cont = +cid[i][0];
    var li = $("<li></li>");
    li.append("<a href='author?id=" + idA1 + "'>" + data[idA1]["name"] + "</a>");
    li.append(" - ");
    li.append("<a href='author?id=" + idA2 + "'>" + data[idA2]["name"] + "</a>");
    li.append(" (" + cont + " common papers)");
    ul.append(li);
  }

  $("#c_couple").append('<b><i class="fas fa-people-carry"></i> Top prolific couples:</b>');
  $("#c_couple").append(ul);
}

function loadPlotType() {
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
      plot();
    });
    fields.append(el)
    fields.append("<span> </span>");
    fields.append("<label for='" + id + "'>" + plotLabel[i] + "</label>");
    fields.append("<br>");
  }
  $("#c_plot_type").append('<b><i class="fas fa-sort-amount-up"></i> Axis scales:</b>');
  $("#c_plot_type").append(fields);
}

function loadSearch() {
  $("#c_search").html("");
  addCollapse();
  var label = $("<label for='authors'>Search author: </label>");
  var input = $("<input id='author' style='width:100%'>");

  var names = [];
  for (var k in name2id) names.push(k);
  input.autocomplete({
    source: names,
    minLength: 3,
    autoFocus: true,
    select: function(event, ui) {
      var id = name2id[ui.item.value];
      if (authIds.indexOf(id) != -1) return;
      authIds.push(parseInt(id));
      updateQueryStringParam("ids", authIds.join(","));
      plot();
    }
  });

  $("#c_search").append('<b><i class="fas fa-search"></i> Search author:</b>');
  $("#c_search").append("<span> </span>");
  $("#c_search").append(input);
}

function loadSliderDegree() {
  var minDegree = 0;
  var maxDegree = 6;
  var sliderDegText = $("<span></span>");
  var sliderDegSlider = $("<div id='slider_deg'></div>");

  sliderDegText.html("Max depth: <b>" + degree + "</b>");
  sliderDegSlider.slider({
    range: false,
    min: minDegree,
    max: maxDegree,
    value: minDegree,
    slide: function(event, ui) {
      degree = ui.value;
      sliderDegText.html("Max separation degree: <b>" + degree + "</b>");
      plot();
    }
  });

  addCollapse();
  $("#c_slider_degree").append('<i class="fas fa-list-ol"></i> ');
  $("#c_slider_degree").append(sliderDegText);
  $("#c_slider_degree").append("<div></div>");
  $("#c_slider_degree").append(sliderDegSlider);
}

function plot() {
  if (authIds.length != 0) updateQueryStringParam("ids", authIds.join(","));
  updateInfo();
  updateList();
  draw();
  drawDegree();
}

function updateInfo() {
  $("#c_info").html("<b><i class='fas fa-info-circle'></i> " + data.length + " authors in dataset</b>");
  addCollapse();
}

function updateList() {
  $("#c_authors").html("");
  addCollapse();
  var label = $("<b><i class='fas fa-user'></i> Selected authors:</b>");
  var ul = $("<ul></ul>");

  for (var i = 0; i < authIds.length; i++) {
    var li = $("<li><a href='author?id=" + authIds[i] + "' name='" + authIds[i] + "'>" + data[authIds[i]]["name"] + "</a> - <i class='fas fa-times'></i></li>");
    $(".fa-times", li).css({
      color: "red",
      cursor: "pointer"
    }).click((function(id) {
      if (id == -1) return;
      return function() {
        authIds = authIds.filter(x => x != id);
        plot();
      };
    })(authIds[i]));
    ul.append(li);
  }
  $("#c_authors").append(label);
  $("#c_authors").append(ul);
  ul.css("margin-bottom", "0px !important");
}

function draw() {

  $("#c_plot").html("");
  addCollapse();

  var names = authIds.map(x => data[x]["name"]);

  if (names.length == 0) {
    drawEdge();
    $("#c_plot").append('<b><i class="fas fa-users"></i> ' + "Please selected at least one author!</b>");
    return;
  }

  common = {};
  for (var k in graph[authIds[0]])
    common[k] = graph[authIds[0]][k].length;

  for (var i = 1; i < authIds.length; i++) {
    var idA = authIds[i];
    for (var k in common) {
      var da = graph[idA][k] == undefined ? 0 : graph[idA][k].length;
      common[k] = Math.min(common[k], da);
    }
  }

  for (var k in common)
    if (common[k] == 0)
      delete common[k];

  console.log(common);
  if (Object.keys(common).length == 0) {
    $("#c_plot").append('<b><i class="fas fa-users"></i> ' + names.join(", ") + " don't have any common coauthor!</b>");
    return;
  }

  $("#c_plot").append('<b><i class="fas fa-users"></i> ' + names.join(", ") + " have " + Object.keys(common).length + " common co-authors:</b>");

  var ul = $("<ol>");
  ul.css("max-height", "300px");
  ul.css("overflow-y", "scroll");
  ul.css("padding-left", "50px");

  var commons = [];
  for (var k in common) commons.push([+k, common[k]]);
  commons.sort((a, b) => b[1] - a[1]);
  for (var k = 0; k < commons.length; k++) {
    var li = $("<li><a href='author?id=" +data[commons[k][0]]["id"]+ "'>" + data[commons[k][0]]["name"] + "</a> (" + commons[k][1] + " common papers) </li>");
    li.append($("<i class='fas fa-plus text-success'></i>").css({
      cursor: "pointer"
    }).on("click", (function(id) {
      return function() {
        authIds.push(id);
        plot();
      };
    })(commons[k][0])));

    ul.append(li);
  }

  $("#c_plot").append(ul);
  drawEdge();

}
$(window).resize(plot);
function drawEdge() {
  // c_plot_edge

  var diameter = Math.min(800, $("#c_plot_edge").width()),
    radius = diameter / 2,
    innerRadius = radius - 120;

  var cluster = d3.cluster()
    .size([360, innerRadius]);

  var line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function(d) {
      return d.y;
    })
    .angle(function(d) {
      return d.x / 180 * Math.PI;
    });

  $("#c_plot_edge").html("");
  addCollapse();
  $("#c_plot_edge").append("<b><i class='fab fa-connectdevelop'></i> Hierarchical edge bundling of selected authors:</b>");

  if (authIds.length == 0) return;
  var svg = d3.select("#c_plot_edge").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .style("margin-left", ($("#c_plot_edge").width()-diameter)/2)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

  var link = svg.append("g").selectAll(".link"),
    node = svg.append("g").selectAll(".node");

  // CREATE CLASSES
  var classes = [{
    "name": "iit.mumbai.pub1",
    "imports": ["iit.chennai.pub3"]
  }, {
    "name": "iit.delhi.pub2",
    "imports": ["iit.mumbai.pub1"]
  }, {
    "name": "iit.chennai.pub3",
    "imports": ["iit.delhi.pub2"]
  }];

  classes = [];
  var common2 = Object.assign({}, common);
  for (var i = 0; i < authIds.length; i++)
    common2[authIds[i]] = 1;

  for (var k in common2) {
    var p = {};
    p["name"] = data[k]["name"];
    p["imports"] = [];
    for (var k2 in common2) {
      if (graph[k][k2] == undefined) continue;
      p["imports"].push(data[k2]["name"]);
    }
    classes.push(p);
  }

  var root = packageHierarchy(classes)
    .sum(function(d) {
      return d.size;
    });

  cluster(root);

  link = link
    .data(packageImports(root.leaves()))
    .enter().append("path")
    .each(function(d) {
      d.source = d[0], d.target = d[d.length - 1];
    })
    .attr("class", "link")
    .attr("d", line);

  console.log(root.leaves())
  node = node
    .data(root.leaves())
    .enter().append("text")
    .attr("class", "node")
    .attr("dy", "0.31em")
    .attr("transform", function(d) {
      return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
    })
    .attr("text-anchor", function(d) {
      return d.x < 180 ? "start" : "end";
    })
    .attr("fill", function(d){
      var kk = name2id[d.data.key]
      var found = false;
      for(var i=0; i<authIds.length; i++)
        if( authIds[i] == kk ) found = true;
      return found  ? "red" : "black";
    })
    .text(function(d) {
      return d.data.key;
    })
    .style("cursor", "pointer")
    .on("click", function(d) {
      location.href = "author?id=" + name2id[d.data.key];
    })
    .on("mouseover", mouseovered)
    .on("mouseout", mouseouted);


  function mouseovered(d) {
    node
      .each(function(n) {
        n.target = n.source = false;
      });

    link
      .classed("link--target", function(l) {
        if (l.target === d) return l.source.source = true;
      })
      .classed("link--source", function(l) {
        if (l.source === d) return l.target.target = true;
      })
      .filter(function(l) {
        return l.target === d || l.source === d;
      })
      .raise();

    node
      .classed("node--target", function(n) {
        return n.target;
      })
      .classed("node--source", function(n) {
        return n.source;
      });
  }

  function mouseouted(d) {
    link
      .classed("link--target", false)
      .classed("link--source", false);

    node
      .classed("node--target", false)
      .classed("node--source", false);
  }

  // Lazily construct the package hierarchy from class names.
  function packageHierarchy(classes) {
    var map = {};

    function find(name, data) {
      var node = map[name],
        i;
      if (!node) {
        node = map[name] = data || {
          name: name,
          children: []
        };
        if (name.length) {
          node.parent = find(name.substring(0, i = name.lastIndexOf("_")));
          node.parent.children.push(node);
          node.key = name.substring(i + 1);
        }
      }
      return node;
    }

    classes.forEach(function(d) {
      find(d.name, d);
    });

    return d3.hierarchy(map[""]);
  }

  // Return a list of imports for the given array of nodes.
  function packageImports(nodes) {
    var map = {},
      imports = [];

    // Compute a map from name to node.
    nodes.forEach(function(d) {
      map[d.data.name] = d;
    });

    // For each import, construct a link from the source to target node.
    nodes.forEach(function(d) {
      if (d.data.imports) d.data.imports.forEach(function(i) {
        imports.push(map[d.data.name].path(map[i]));
      });
    });

    return imports;
  }

}

function draw_old() {
  var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };

  var width = $("#c_plot").width() - margin.left - margin.right,
    height = $("#c_plot").width()*3/4 - margin.top - margin.bottom;

  $("#c_plot").html("");
  addCollapse();
  $("#c_plot").append("<h3>Coauthor:</h3>");

  var svg = d3.select("#c_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.selectAll("*").remove();
  g = svg.append("g");

  var idS = [];
  console.log("OK", 1);

  for (var i = 0; i < authIds.length; i++) idS.push(authIds[i]);

  console.log("OK", 2);

  for (var i = 0; i < degree; i++) {
    var idS2 = idS.slice();
    for (var j = 0; j < idS.length; j++)
      for (var k in graph[idS[j]])
        if (idS2.indexOf(k) == -1)
          idS2.push(k);
    idS = idS2.slice();
  }

  console.log("OK", 3);

  var x = height / idS.length

  var maxC = d3.max(idS, function(i) {
    return d3.max(idS, function(j) {
      if (graph[i][j] == undefined) return 0;
      return graph[i][j].length;
    });
  });

  console.log("IDS", idS, maxC);

  for (var i = 0; i < idS.length; i++)
    for (var j = 0; j < idS.length; j++) {
      var co = 0;
      if (graph[idS[i]][idS[j]] != undefined)
        co = graph[idS[i]][idS[j]].length;

      if (co == 0) continue;

      svg.append('rect')
        .attr("x", x * i)
        .attr("y", x * j)
        .attr("width", x)
        .attr("height", x)
        .attr("fill", d3.interpolateRdYlGn(co / maxC))
    }
}

function oldDraw() {

  var idGraph = [];
  var Graph = {};
  Graph["nodes"] = [];
  Graph["links"] = [];

  // degree, authIds
  // {"source": "Napoleon", "target": "Myriel", "value": 10},


  for (var i = 0; i < authIds.length; i++) {
    idGraph.push(authIds[i]);
    Graph["nodes"].push({
      id: data[authIds[i]]["name"],
      group: 0,
      fixed: true
    });
  }

  for (var i = 0; i < degree; i++) {
    var idS = [];
    for (var j = 0; j < Graph["nodes"].length; j++)
      idS.push(name2id[Graph["nodes"][j]["id"]]);

    for (var j = 0; j < idS.length; j++) {
      var idA = idS[j];
      for (var k in graph[idA]) {
        if (idGraph.indexOf(k) != -1) continue;

        Graph["links"].push({
          source: Graph["nodes"][p]["id"],
          target: data[k]["name"],
          value: graph[k][name2id[Graph["nodes"][p]["id"]]].length
        });

        Graph["nodes"].push({
          id: data[k]["name"],
          group: i + 1,
          fixed: false
        });

      }
    }
  }


  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
      return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

  var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(Graph.links)
    .enter().append("line")
    .attr("stroke-width", function(d) {
      return Math.sqrt(d.value);
    })
    .attr("stroke", "#999")
    .attr("stroke-opacity", "0.6");

  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(Graph.nodes)
    .enter().append("circle")
    .attr("r", function(d) {
      return 5 * (3 - d.group);
    })
    .attr("fill", function(d) {
      return ["red", "orange", "green"][d.group];
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .classed("fixed", n => n["fixed"])
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  node.append("title")
    .text(function(d) {
      return d.id;
    });

  simulation
    .nodes(Graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(Graph.links);

  function ticked() {
    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });

    node
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}

function drawDegree() {
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
  for (var idA in graph) {
    var count = Object.keys(graph[idA]).length;
    if (degreeCount[count] == undefined)
      degreeCount[count] = 0;
    degreeCount[count]++;
  }

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
    .text("#authors");


  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," + (height + margin.top + 30) + ")")
    .style("text-anchor", "middle")
    .text("#coauthors");

  // Prep the tooltip bits, initial display is hidden
  d3.selectAll(".tooltip").remove();
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("opacity", "1");

  svg.selectAll("dot")
    .data(authIds)
    .enter().append("circle")
    .attr("r", 5)
    .attr("cx", function(d) {
      return x(Object.keys(graph[d]).length);
    })
    .attr("cy", function(d) {
      return y(degreeCount[Object.keys(graph[d]).length]);
    })
    .attr("fill", "red")
    .attr("stroke", "red")
    .attr("fill-opacity", "0.5")
    .style("cursor", "pointer")
    .on("click", function(d) {
      location.href = "author?id=" + d;
    })
    .on("mouseover", function() {
      tooltip.style("display", "block");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    .on("mousemove", function(d, i) {
      tooltip.style("left", (d3.event.pageX + 10) + "px")
             .style("top", (d3.event.pageY - 45) + "px");
      tooltip.html(data[d]["name"] + "<br>" + Object.keys(graph[d]).length + " coauthors");
    });

}
