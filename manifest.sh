echo 'CACHE MANIFEST' > offline.manifest
h=#
d=`date`
echo $h$d >> offline.manifest
echo 'CACHE:' >> offline.manifest
ls *.html *.css *.js | cat >> offline.manifest