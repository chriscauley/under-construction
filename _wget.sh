
mkdir .vendor -p

cp node_modules/diff/dist/diff.min.js .vendor/

URLS=`cat _vendor_urls`;
cd .vendor
for url in $URLS;
do
    wget $url
done

