var http = require("http");
var fileSystem = require('fs');
var path = require('path');

//callback function, porque se la pasamos al metodo createServer.
//request lo que nos piden, response lo que enviamos
function onRequest(request,response){ 
    var filePath; 
    var stat;
    var readStream;
    console.log("user did a request: "+request.url);
    /*error común, no interpreta bien el request (p.e pide "/js/test4.js" y tenemos
        puesto para que filtre por /test4.js, se va al default (el html) y muestra el error de 
        invalid character < puesto que en js no tiene sentido).*/
    switch (request.url) {
        /*
        case "/js/qunit/qunit-1.16.0.css" :
            filePath = path.join(__dirname, '../js/qunit/qunit-1.16.0.css');
            response.writeHead(200, {"Context-Type":"text/css"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/js/qunit/qunit-1.16.0.js" :
            filePath = path.join(__dirname, '../js/qunit/qunit-1.16.0.js');
            response.writeHead(200, {"Context-Type":"application/javascript"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/js/qunit/qunit-assert-canvas.js" :
            filePath = path.join(__dirname, '../js/qunit/qunit-assert-canvas.js');
            response.writeHead(200, {"Context-Type":"application/javascript"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        */
        case "/css/index.css" :
            filePath = path.join(__dirname, '../css/index.css');
            response.writeHead(200, {"Context-Type":"text/css"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/js/jquery-3.1.1.min.js" :
        //en ikasten se usa versión 2.2.4 y distintas rutas (js y res en root)
            filePath = path.join(__dirname, '../js/jquery-3.1.1.min.js');
            response.writeHead(200, {"Context-Type":"application/javascript"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/js/pacman.js" :
            filePath = path.join(__dirname, '../js/pacman.js');
            response.writeHead(200, {"Context-Type":"application/javascript"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/pacman.html" :
            filePath = path.join(__dirname, '../pacman.html');
            response.writeHead(200, {"Content-Type": "text/html"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/res/levels/1.txt" :
            filePath = path.join(__dirname, '../res/levels/1.txt');
            response.writeHead(200, {"Context-Type":"text/plain"}); //text/txt   //text/plain 
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/css/res/background.jpg" :
            filePath = path.join(__dirname, '../css/res/background.jpg');
            response.writeHead(200, {"Context-Type":"image/jpeg"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/favicon.ico" :
            filePath = path.join(__dirname, '../res/pacman.ico');
            response.writeHead(200, {"Context-Type":"image/x-icon"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        case "/" :
            filePath = path.join(__dirname, '../main.html');
            response.writeHead(200, {"Content-Type": "text/html"});
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);
            break;
        default :    
            console.log("request that cant be handled: " + request.url);
        /*
            filePath = path.join(__dirname, '../res/levels/1.txt');
            response.writeHead(200, {"Context-Type":"text/plain"}); //text/txt
            readStream = fileSystem.createReadStream(filePath);
            readStream.pipe(response);*/
    };
}
http.createServer(onRequest).listen(8888);
console.log("Server running...");