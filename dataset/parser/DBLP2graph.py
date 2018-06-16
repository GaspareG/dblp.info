#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import DBLP2json

def force ():
  print '** Computing coauthorship half-square graph...'

  allauthors = set ()
  out = gzip.GzipFile ('tmp_dblp_coauthorship.json.gz', 'w')
  out.write ('[\n')
  edgecount = 0
  for p, paper in enumerate (DBLP2json.papers ()):
    tag, authors, year = paper
    for a, author1 in enumerate (authors):
      allauthors.add (author1)
      for author2 in authors[a+1:]:
        if edgecount: out.write (',\n')
        edgecount += 1
        json.dump ([author1, author2, year], out)
  out.write ('\n]\n')
  out.close ()
  os.rename ('tmp_dblp_coauthorship.json.gz', 'dblp_coauthorship.json.gz')

  print '--', len (allauthors), 'unique authors'
  print '--', edgecount, 'total coauthorship edges'

if __name__ == '__main__': force ()
