echo 'CACHE MANIFEST' > offline.manifest
h=#
stamp=`md5 * | md5`
echo $h$stamp >> offline.manifest
echo 'CACHE:' >> offline.manifest
ls *.html *.css *.js | cat >> offline.manifest