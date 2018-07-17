#!/usr/bin/python
## wget -N http://dblp.uni-trier.de/xml/dblp.xml.gz
## then run this script
import gzip, json, os

import DBLP2json

# idA1, idA2, idP

papers = "data/papers.csv.gz"
authors = "data/authors.csv.gz"

gp = gzip.GzipFile (papers, 'r')
ga = gzip.GzipFile (authors, 'r')


def force ():
  print '** Computing coauthorship half-square graph...'

  idP = dict()
  idA = dict()

  for line in gp:
    splitted = line.split(",")
    idP[ splitted[1] ] = splitted[0]

  for line in ga:
    splitted = line.split(",")
    splitted[1] = splitted[1][ 1 : - 1]
    idA[ splitted[1] ] = splitted[0]

  print "idP = " + str(len(idP))
  print "idA = " + str(len(idA))

  out = gzip.GzipFile ('data/coauthorship.csv.gz', 'w')
  edgecount = 0
  for p, paper in enumerate (DBLP2json.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'journals') or (tags[0] == 'conf'):
      for i in range(0, len(authors)):
        for j in range(i+1, len(authors)):
          auth1 = authors[i].encode("utf-8");
          auth2 = authors[j].encode("utf-8");
          idA1 = idA[auth1]
          idA2 = idA[auth2]
          idP1 = idP[tag]
          out.write( str(idA1) +  "," )
          out.write( str(idA2) +  "," )
          out.write( str(idP1) + "\n" )

  out.close ()

if __name__ == '__main__': force ()
