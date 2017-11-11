UnderConstruction.js
========

Sadly, under-construction is currently under construction. The goal of this project is a wrapper around XMLHttpRequest that saves all requests/responses in local storage to replay them. This way front end data and results can be used in testing.

![Under Construction](/under-construction.gif?raw=true "Under Construction")

### In `&lt;head&gt;` tag

```html
<link href="https://static.unrest.io/.dist/unrest-built.css" type="text/css" rel="stylesheet" />
<link href="https://uc.unrest.io/.dist/uc-built.css" type="text/css" rel="stylesheet" />
<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" />
<script> var uR = { _ready: [], ready: function(f) { uR._ready.push(f) } };</script>

```

### Anywhere else (after body, in head)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/riot/2.6.8/riot.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/markdown.js/0.5.0/markdown.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/object-hash@1.2.0/dist/object_hash.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.3/beautify.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.3/beautify-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.3/beautify-html.min.js"></script>

<script src="https://static.unrest.io/.dist/unrest-built.js"></script>
<script src="https://uc.unrest.io/.dist/uc-built.js"></script>

<!-- Begin local javascript -->
<script src="main.js"></script>
<script src="tests.js"></script>
```
