$(function()
{
  loadAuthors(function(authors){
    loadWrote(function(wrote){
      loadPapers(function(papers){
        parseData(authors, wrote, papers);
      });
    });
  });
});


function parseData(authors, wrote, papers)
{
  // Parse
  console.log(authors, wrote, papers);
  loadControls();
  plot();
}

function loadControls()
{

}

function filter()
{

}

var plotFunctions = [];

function plot()
{
  var data = filter();
  plotFunctions[plotType](data);
}


plotFunctions[0] = function(data){
  // Chart 1
};

plotFunctions[0] = function(data){
  // Chart 2
};
