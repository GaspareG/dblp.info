#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import jsonDBLP

# id, tag, title, year
def force ():
  print '** Papers'

  idx = 0
  out = gzip.GzipFile ('data/papers.csv.gz', 'w')
  for p, paper in enumerate (jsonDBLP.papers ()):
    tag, title, authors, year, doi = paper
    tags = tag.split("/")
    title = title.encode("utf-8")
    if (tags[0] == 'journals') and (tags[1] in ["tog", "tvcg", "cgf", "cga", "vc", "cad", "cagd"]):
      out.write( str(idx) + ",")
      out.write( tag + ",")
      title = title.replace('"',"'")
      out.write( "\"" + title + "\"" + ",")
      out.write( str(year) + ",")
      out.write( doi + "\n")
      idx = idx+1

if __name__ == '__main__': force ()


