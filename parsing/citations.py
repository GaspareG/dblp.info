#!/bin/env python3

import json

n = 19634
folder = "semantic/"
json_data = []
ids = {}

for i in range(0, n):
  with open(folder + str(i) + ".txt", 'r') as f:
    try:
      data = json.load(f)
      json_data.append(data)
      ids[ data["paperId"] ] = i
    except:
      json_data.append( {} )

#for id in ids:
#  print(id, ids[id])

for js in json_data:
  if "citations" in js:
    for cite in js["citations"]:
      if cite["paperId"] in ids:
        print( str(ids[js["paperId"]]) + "," + str(ids[ cite["paperId"]]) )
