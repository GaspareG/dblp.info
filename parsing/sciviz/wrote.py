#!/bin/env python2

import gzip, os, sys

import jsonDBLP

# idA, idP

papers = "data/papers.csv.gz"
authors = "data/authors.csv.gz"
wrote = "data/wrote.csv.gz"

gp = gzip.GzipFile (papers, 'r')
ga = gzip.GzipFile (authors, 'r')

# id, tag, title
def force ():
  print '** Wrote'

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

  gw = gzip.GzipFile (wrote, 'w')

  for p, paper in enumerate (jsonDBLP.papers ()):
    tag, title, authors, year = paper
    tags = tag.split("/")
    if (tags[0] == 'journals') and (tags[1] in ["tog", "tvcg", "cgf", "cga", "vc", "cad", "cagd"]):
      for auth in authors:
        auth = auth.encode("utf-8")
        gw.write( str( idA[auth] ) )
        gw.write( "," )
        gw.write( str( idP[tag] ) )
        gw.write( "\n")

  gw.close()


if __name__ == '__main__': force ()




