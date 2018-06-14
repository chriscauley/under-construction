
mkdir .vendor -p

cp node_modules/diff/dist/diff.min.js .vendor/
cd .vendor

wget https://cdn.jsdelivr.net/npm/pixelmatch@4.0.2/index.js -O pixelmatch.js

URLS=`cat _vendor_urls`;
for url in $URLS;
do
    wget $url
done

