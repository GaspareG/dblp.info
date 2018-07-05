#!/bin/bash

echo "Download xml"
wget -O data/dblp.xml.gz -N http://dblp.uni-trier.de/xml/dblp.xml.gz
wget -O data/dblp.dtd -N http://dblp.uni-trier.de/xml/dblp.dtd

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

echo "(author, paper)"
python2 wrote.py

echo "(conference, paper)"
python2 present.py

echo "(journal, paper)"
python2 publish.py

# LOAD CSV in DB
# mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '/root/web/dblp.info/dataset/data/authors.csv' INTO TABLE authors FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

