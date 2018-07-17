#!/bin/bash

echo "Download xml"
wget -O data/dblp.xml.gz -N http://dblp.uni-trier.de/xml/dblp.xml.gz
wget -O data/dblp.dtd -N http://dblp.uni-trier.de/xml/dblp.dtd

echo "Parse to JSON"
python2 json.py

echo "JSON -> Papers CSV"
python2 papers.py

echo "JSON -> Authors CSV"
python2 authors.py

echo "JSON -> Journals CSV"
python2 journals.py

echo "JSON -> Conferences CSV"
python2 conferences.py

echo "(author, paper)"
python2 wrote.py

echo "(conference, paper)"
python2 present.py

echo "(journal, paper)"
python2 publish.py

echo "(author, author, paper)"
python2 coauthorship.py

echo "Create DB tables"
mysql -uroot -p < dblp.sql

folder=$(pwd)

echo "Load journals"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/journals.csv' INTO TABLE journals FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load conferences"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/conferences.csv' INTO TABLE conferences FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load papers"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/papers.csv' INTO TABLE papers FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load authors"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/authors.csv' INTO TABLE authors FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load present"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/present.csv' INTO TABLE present FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load publish"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/publish.csv' INTO TABLE publish FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load wrote"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/wrote.csv' INTO TABLE wrote FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

echo "Load coauthorship"
mysql -uroot -p --local_infile=1 dblp -e "LOAD DATA LOCAL INFILE '${folder}/data/coauthorship.csv' INTO TABLE coauthorship FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"'"

