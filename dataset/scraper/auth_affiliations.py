#!/bin/env python3

from multiprocessing import Pool
import gzip, json, os, sys
from requests_html import *
from time import sleep

def getAffiliation(coppia):
  id, url = coppia[0], coppia[1]
  sleep(1)
  session = HTMLSession()
  r = session.get(url)
  if r.status_code != 200:
    print("ERROR", url)
  aff = r.html.find("li[itemprop=affiliation] span", first=True)
  if aff != None:
    return [id, aff.text]
  else:
    return None

inf = gzip.GzipFile ('authors.csv.gz', 'r')

wr = open("aff.txt","a")

base = "https://dblp.uni-trier.de/pers/hd/"

cont = 0
total = 2141840
start = 2100

links = []

for line in inf:

  if cont < start:
    cont = cont+1
    continue

  if cont == 5000:
    break
  #print( str(cont) + "/" + str(total) + " ("+str(cont*100/total)+"%)")

  cont = cont+1

  line = line.decode("utf-8")
  line = line[ line.find(',"')+2 : ]
  line = line[ 0 : line.find(',"')-1 ]
  c = line[0:1].lower()
  links.append( [cont,base + c + "/" + line] )


print("START", len(links))

p = Pool(8)
records = p.map(getAffiliation,links)
p.terminate()
p.join()

print(records)

out.close()
inf.close()
