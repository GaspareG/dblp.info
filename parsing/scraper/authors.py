#!/bin/env python3

import gzip, json, os
from requests_html import *

def getAffiliation(url):
  session = HTMLSession()
  r = session.get(url)
  aff = r.html.find("li[itemprop=affiliation] span", first=True)
  if aff != None:
    print( aff.text )
  else:
    print( "" )

scrap = 0
inf = gzip.GzipFile ('authors.csv.gz', 'r')
out = gzip.GzipFile ('authors.csv.gz', 'a')

def getList(pos):
  global scrap
  global out
  session = HTMLSession()
  r = session.get("https://dblp.uni-trier.de/pers?pos=" + str(pos) )
  auths = r.html.find("#browse-person-output li a")
  for auth in auths:
    tag = auth.attrs["href"][36:]
    nam = auth.text
    out.write( (str(scrap)        +  "," ).encode('utf-8') )
    out.write( ("\"" + tag + "\"" +  "," ).encode('utf-8') )
    out.write( ("\"" + nam + "\"" +  "," ).encode('utf-8') )
    out.write( ("\"\""            + "\n" ).encode('utf-8') )
    scrap = scrap+1

last = ""
for l in inf:
  last = l

last = str(last)
last = int( last[ 2 : last.find(",") ] )
print(last)
inf.close()

scrap = last+1

total = 2142000

for i in range(scrap, total, 300):
  oldScrap = scrap
  getList(i)

  if oldScrap == scrap:
    print("ERROR|", scrap)
    break

    print( str(scrap) + "/" + str(total) + " (" +  str( scrap*100/total ) + "%)" )

out.close()

