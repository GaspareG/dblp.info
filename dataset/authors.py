#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import DBLP2json

# id, name, affiliation, website
def force ():
  print '** Authors'

  auths = set()
  idx = 0

  out = gzip.GzipFile ('data/authors.csv.gz', 'w')
  for p, paper in enumerate (DBLP2json.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'journals') or (tags[0] == 'conf'):
      for auth in authors:
        auths.add(auth)

  for auth in sorted(auths):
    auth = auth.encode("utf-8")
    out.write( str(idx) + "," )
    out.write( "\"" + auth + "\"" + "," )
    out.write( "\"\"" + "," )
    out.write( "\"\"" + "\n" )
    idx = idx+1

if __name__ == '__main__': force ()


