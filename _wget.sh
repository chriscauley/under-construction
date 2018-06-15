rm src/vendor/*.js
cp node_modules/diff/dist/diff.min.js src/vendor/
cd src/vendor

wget https://cdn.jsdelivr.net/npm/pixelmatch@4.0.2/index.js -O pixelmatch.js

URLS=`cat _vendor_urls`;
for url in $URLS;
do
    wget $url
done

