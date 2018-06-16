#!/bin/env python3

import gzip

file = "dblp.json.gz"
file_auth = "dblp.author.gz"

dblp_json = gzip.open(file, "r")
dblp_auth = gzip.open(file_auth, "w")

dblp_json.readline()

for line in dblp_json:
  line = line.decode("ascii")
  if len(line) < 4:
    continue
  if "[" not in line:
    continue
  if "]" not in line:
    continue
  line = line[ line[1:].find("[") : line[1:].find("]")+2 ]
  author = eval(line)
  #print(author)
  for auth in author:
    dblp_auth.write( (auth + "\n").encode() )

dblp_auth.close()
