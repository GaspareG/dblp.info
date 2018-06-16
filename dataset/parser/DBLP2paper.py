#!/bin/env python3

import gzip

file = "dblp.json.gz"
file_paper = "dblp.paper.gz"

dblp_json = gzip.open(file, "r")
dblp_paper = gzip.open(file_paper, "w")

dblp_json.readline()

for line in dblp_json:
  line = line.decode("ascii")
  if len(line) < 4:
    continue
  if "[" not in line:
    continue
  if "]" not in line:
    continue
  line = line[2: line.index(",")-1]
  dblp_paper.write( (line + "\n").encode() )

dblp_paper.close()
