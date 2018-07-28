#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import jsonDBLP

# id, tag, title
def force ():
  print '** Journals'

  confs = set()
  idx = 0
  out = gzip.GzipFile ('data/journals.csv.gz', 'w')
  for p, paper in enumerate (jsonDBLP.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'journals') and (tags[1] in ["tog", "tvcg", "cgf", "cga", "vc", "cad", "cagd"]):
      confs.add(tags[1])

  for conf in sorted(confs):
    conf = conf.encode("utf-8")
    out.write( str(idx) + "," )
    out.write( "\"" + conf + "\"" + "," )
    out.write( "\"\"" + "\n" )
    idx = idx+1

  out.close()

if __name__ == '__main__': force ()


