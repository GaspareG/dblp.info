#!/bin/env python3

import requests

urlbase = "http://dblp.org/search/author/api?format=json&q="


name2id = {}

with open("data/authors.csv", "r") as f:
  seen = False
  for l in f:
    if not seen:
      seen = True
      continue
    idA = int(l[0: l.index(",")])
    title = l[ l.index(',"')+2 : l.index('",') ]
    name2id[title] = idA

# name2id = { "Olga Sorkine-Hornung": 10, "Olga Sorkine": 11}

print("idA2,idA1")

for name in name2id:
  nameO = name
  name = name.replace(" ", "%20")
  r = requests.get(urlbase + name)
  json = r.json()
  hit = []


  if "result" in json:
    if "hits" in json["result"]:
      if "hit" in json["result"]["hits"]:
        hit = json["result"]["hits"]["hit"]

  for h in hit:
    if "info" not in h:
      continue
    if "author" not in h["info"] != name:
      continue
    if h["info"]["author"] != nameO:
      continue
    if "aliases" in h["info"]:

      if type( h["info"]["aliases"]["alias"] ) is str:
         h["info"]["aliases"]["alias"] = [  h["info"]["aliases"]["alias"] ]

      for alias in  h["info"]["aliases"]["alias"]:
        if alias not in name2id:
          continue
        print( str(name2id[ alias ]) + "," + str(name2id[nameO]) )
