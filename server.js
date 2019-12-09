var express = require('express');
var app = express();
var cons = require('consolidate');

// view engine setup
app.engine('html', cons.swig)
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.static(__dirname + '/assets'));
app.get('/', function(req, res){
  //render the index.jade template
  //don't provide variables - we'll use socket.io for that
  res.render('webspeechdemo');

    });
var server = app.listen(8001);
var io = require('socket.io').listen(server);
var sock = null;
var fs = require('fs');

function readImage(image, end) {
  buf = fs.readFileSync(__dirname + '/assets/img/sym/' + image);
  console.log(end);
  sock.emit('image', 
    { image: true, 
      buffer: buf.toString('base64'),
      name: image,
      end: end
    }
  );
}

function readDir(data) {
  path = __dirname + "/assets/img/sym";
  console.log(path);
  symbols = {};
  fs.readdir(path, function(err, items) {
    for (var i=0; i<items.length; i++) {
      elems = items[i].split("-");
      elems.pop();
      symbols[elems] = items[i]
      console.log(elems);
    }
    console.log(data);
    //words = data.split(" ");
    words = data;
    console.log(words);
    //sock.emit('newCol');
    colCnt = 1;
    for (i = 0; i < words.length; i++) {
      console.log("--------")
      word = words[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
      console.log(word)
      var found = false;
      for (var sym_words in symbols) {
        sym_words = sym_words.split(',')
        for (var j in sym_words) {
          sym_word = sym_words[j].toLowerCase();
          if (sym_word == word) {
            console.log(sym_word)
            fileName = symbols[sym_words]
            found = true;
            if (words[i].includes('.')) {
              sock.emit('newCol');
              colCnt += 1;
              //images.push([fileName, true]);
              readImage(fileName, true);
            } else {
              //images.push([fileName, false]);
              readImage(fileName, false);
            }
            break;
          }
        }
        if (found) {
          break;
        }
      }
    }

    sock.emit('done', { num: colCnt });
    //sendImages(images);
     // for (elem in elems.values()) {
     //   console.log(elem)
     //   
     // }

    //console.log(symbols);
  })
}
var unwanted = ['this', 'is', 'my', 'i', 'am', 'what', 'get', 'of', 'to', 'i\'m', 'if']
io.sockets.on('connection', function (socket) {
  sock = socket;
  sock.on('dream', function (data) {
    console.log(data);
    dream = data.split(' ').map(v => v.toLowerCase());
    filtered = dream.filter(function(value, index, arr){
      return !unwanted.includes(value);
    });
    console.log(dream);
    console.log(filtered);
    readDir(dream)
  });
});
