$(function()
{
  d3.csv("data/authors.csv").then(data => $("#authors_count").text(data.length));
  d3.csv("data/papers.csv").then(data => $("#papers_count").text(data.length));
  d3.csv("data/journals.csv").then(data => $("#journals_count").text(data.length));
  d3.csv("data/coauthorship.csv").then(data => $("#coauthorship_count").text(data.length));
});
