#!/bin/bash

echo "Download xml"
wget -O data/dblp.xml.gz -N http://dblp.uni-trier.de/xml/dblp.xml.gz
wget -O data/dblp.dtd -N http://dblp.uni-trier.de/xml/dblp.dtd

echo "Parse to JSON"
python2 jsonDBLP.py

echo "JSON -> Papers CSV"
python2 papers.py

echo "JSON -> Authors CSV"
python2 authors.py

echo "JSON -> Journals CSV"
python2 journals.py

echo "(author, paper)"
python2 wrote.py

echo "(journal, paper)"
python2 publish.py

echo "(author, author, paper)"
python2 coauthorship.py
