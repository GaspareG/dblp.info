#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import jsonDBLP

base_url = "http://api.semanticscholar.org/v1/paper/"

# id, tag, title, year
def force ():
  idx = 0

  for p, paper in enumerate (jsonDBLP.papers()):
    tag, title, authors, year, doi = paper
    tags = tag.split("/")
    title = title.encode("utf-8").replace('"', "'")
    if (tags[0] == 'journals') and (tags[1] in ["tog", "tvcg", "cgf", "cga", "vc", "cad", "cagd"]):
      doi = doi[ doi.rfind("/", 0, doi.rfind("/"))+1 : ]
      print str(idx) + " " + base_url + doi
      idx = idx+1

if __name__ == '__main__': force ()


