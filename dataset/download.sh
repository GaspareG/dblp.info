#!/bin/bash

echo "Download xml"
wget -O data/dblp.xml.gz -N http://dblp.uni-trier.de/xml/dblp.xml.gz

echo "Parse to JSON"
python2 DBLP2json.py

echo "JSON -> Papers CSV"
python2 DBLP2paper.py

echo "JSON -> Authors CSV"
python2 DBLP2author.py

echo "JSON -> Journals CSV"
python2 DBLP2journals.py

echo "JSON -> Conferences CSV"
python2 DBLP2conf.py

