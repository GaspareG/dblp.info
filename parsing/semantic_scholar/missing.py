#!/bin/env python3

import csv

papers = []

with open('papers.csv', 'r') as csvfile:
  papersCsv = csv.reader(csvfile, delimiter=',', quotechar='"')
  cont = 0
  for row in papersCsv:
    if cont == 0:
      cont = 1
      continue
    papers.append(row[2])

with open("id_semantic.txt","r") as f:
  for l in f:
    if " " not in l:
      print( int(l) , papers[int(l)] )
