#!/bin/env python2

import gzip, os, sys

import DBLP2json

# idC, idP

papers = "data/papers.csv.gz"
conferences = "data/conferences.csv.gz"
present = "data/present.csv.gz"

gp = gzip.GzipFile (papers, 'r')
gc = gzip.GzipFile (conferences, 'r')

# id, tag, title
def force ():
  print '** Wrote'

  idP = dict()
  idC = dict()

  for line in gp:
    splitted = line.split(",")
    idP[ splitted[1] ] = splitted[0]

  for line in gc:
    splitted = line.split(",")
    splitted[1] = splitted[1][ 1 : - 1]
    idC[ splitted[1] ] = splitted[0]

  print "idP = " + str(len(idP))
  print "idC = " + str(len(idC))

  # TODO UPDATE
  gw = gzip.GzipFile (present, 'w')

  for p, paper in enumerate (DBLP2json.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'conf'):
        conf = tags[1]
        gw.write( str( idC[conf] ) )
        gw.write( "," )
        gw.write( str( idP[tag] ) )
        gw.write( "\n")

  gw.close()


if __name__ == '__main__': force ()




