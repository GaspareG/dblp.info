#!/bin/env python2

import gzip, os, sys

import DBLP2json

# idJ, idP

papers = "data/papers.csv.gz"
journals = "data/journals.csv.gz"
publish = "data/publish.csv.gz"

gp = gzip.GzipFile (papers, 'r')
gj = gzip.GzipFile (journals, 'r')

# id, tag, title
def force ():
  print '** Wrote'

  idP = dict()
  idJ = dict()

  for line in gp:
    splitted = line.split(",")
    idP[ splitted[1] ] = splitted[0]

  for line in gj:
    splitted = line.split(",")
    splitted[1] = splitted[1][ 1 : - 1]
    idJ[ splitted[1] ] = splitted[0]

  print "idP = " + str(len(idP))
  print "idJ = " + str(len(idJ))

  # TODO UPDATE
  gw = gzip.GzipFile (publish, 'w')

  for p, paper in enumerate (DBLP2json.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'journals'):
        journal = tags[1]
        gw.write( str( idJ[journal] ) )
        gw.write( "," )
        gw.write( str( idP[tag] ) )
        gw.write( "\n")

  gw.close()


if __name__ == '__main__': force ()




