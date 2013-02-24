cat start.js events.js screens.js conf.js main.js end.js > bundle.temp
curl --data-urlencode "js_code@bundle.temp" -d "compilation_level=WHITESPACE_ONLY" -d "output_format=text" -d "output_info=compiled_code" -d "formatting=pretty_print" http://closure-compiler.appspot.com/compile > bundle.min.js
rm bundle.temp