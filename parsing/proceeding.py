#!/bin/env python3

folder = "proceedings/"
confs = ["siggraph", "eurographics", "sgp", "rt", "pg", "vissym", "visualization", "infovis"]

title2id = {}

with open("data/papers.csv","r") as p:
  first = False
  for l in p:
    if not first:
      first = True
      continue
    idP = int(l[0 : l.index(",")])
    title = l[ l.index('"')+1 : l.rindex('"') ]
    title2id[ title ] = idP
#    print(idP, title)


paper2conf = {}

print("idP,idC")

for i in range(0, len(confs)):
  with open(folder + confs[i] + ".txt", "r") as c:
    for t in c:
      t = t.replace("\n", "")
      if t in title2id:
        paper2conf[ title2id[t] ] = i

for p in paper2conf:
  print( str(p) + "," + str(paper2conf[p]) )
