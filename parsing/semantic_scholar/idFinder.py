#!/bin/env python3

import csv
import gzip
import json
import difflib
import sys
import requests

title2id = {}

base = "https://www.semanticscholar.org/api/1/partner/dblp/search?q="
last = "&s=30&p=1"

with open('papers.csv', 'r') as csvfile:
  papers = csv.reader(csvfile, delimiter=',', quotechar='"')
  cont = -1
  for row in papers:
    sys.stdout.flush()
    if cont < int(sys.argv[1]):
      cont = cont+1
      continue

    r = requests.get(base + row[2].replace(" ","%20") + last)
    js = r.json()
    if len(js["papers"]) == 0:
      print(row[0])
      continue

    found = False
    titleP = row[2].replace(".","").replace('"',"").replace("'","")
    for i in range(0, len(js["papers"])):
      titleP2 = js["papers"][i]["title"].replace(".","").replace('"',"").replace("'","")
      if titleP != titleP2:
        continue
      url = js["papers"][i]["url"]
      url = url[:url.rindex("?")]
      url = url[ url.rindex("/")+1 : ]
      print(row[0],  url )
      found = True
      break

    if not found:
      print(row[0])
