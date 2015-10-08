var listenport	= 5050;
var url     = require('url');
var http    = require('http');

var WebSocketServer = require('websocket').server;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
//    wsServer.send("kiriman datang! hahahaha");
});
var updater = http.createServer(function(request, response) {
    console.log((new Date()) + ' update ' + request.url);
    response.writeHead(404);
    response.end();
//    wsServer.send("kiriman datang! hahahaha");
});
updater.listen(6060,function (){
    console.log((new Date()) + ' Updater is listening on port 6060');
});
server.listen(listenport, function() {
    console.log((new Date()) + ' Server is listening on port '+listenport);
});
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    console.log("origin is "+origin);
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

var connection = new Array(),conidx=0;
wsServer.on('request', function(request){
    console.log("request comes in! origin => "+request.origin);
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    connection[conidx] = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection[conidx].on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection[conidx].sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection[conidx].sendBytes(message.binaryData);
        }
    });
    connection[conidx].on('close', function(reasonCode, description) {
//        console.log((new Date()) + ' Peer ' + connection[conidx].remoteAddress + ' disconnected.');
    });
    conidx++;
});
//wsServer.on('request',function() {
//    console.log("request comes in!");
//});
wsServer.on('connect',function (){
    console.log("client connected!");
});
wsServer.on('close',function (){
    console.log("client connection closed!");
});

var qs  = require('querystring');
updater.on('request',function (req,res){
    var updurl  = (req.url).replace(/--amp--/g,"&");
    updurl  = updurl.replace(/--tiko--/g,";");
    var purl    = url.parse(updurl);
    var query   = qs.parse(purl.query);
    var idmachine   = query['machine_id'];
    var iddevice    = query['device_id'];
    var idserial    = query['device_sernum'];
    var value       = query['device_value'];
    var cycle       = query['cycle'];
    var looptime    = query['loop_time'];
    var cyclespeed  = query['cycle_status'];
    var datetime    = (query['datetime']+"").split("_");
    datetime    = datetime[0]+" "+datetime[1];
    
    console.log("cek mesin  = "+idmachine);
    console.log("cek device = "+iddevice);
    console.log("cek device = "+(iddevice+"").split(";").length);
    var datadisplay = [];
    var datafor     = "";
    if (iddevice != "4" && (iddevice+"").split(";").length > 1){
        console.log("parsing data here");
        var serial  = (idserial+"").split(";");
        var value   = (value+"").split(";");
        var iddevice= (iddevice+"").split(";");
        for(var i=0;i<iddevice.length;i++){
            console.log("ketika assign, idmachine="+idmachine);
            datadisplay.push(i);
            datadisplay[i] = {idmachine   : idmachine,iddevice    : iddevice[i], idserial    : serial[i], value       : value[i], cycle       : cycle, datetime    : datetime,cycletime:"",cyclespeed  : cyclespeed,lastdown:""};
        }
        datafor = "cycleprocess";
    }
    else if (iddevice == "5"){
        datafor = "downinfo";
    }
    else if (iddevice == "6"){
        datadisplay.push({idmachine   : idmachine,iddevice    : iddevice, idserial    : idserial, value       : value, cycle       : cycle, datetime    : datetime,cycletime:"",cyclespeed  : cyclespeed,lastdown:""});
        datafor = "warningalert";
    }
    var datareturn  = {datafor : datafor, datadisplay : datadisplay};
//    console.log("panjang : "+datareturn.length);
    console.log("Sent to client : "+JSON.stringify(datareturn));
    
    
    //kirim data ke display
    var jmlconn = connection.length;
    for (var i=0;i<jmlconn;i++){
        connection[i].send(JSON.stringify(datareturn));
    }
});
//            $data[$i]['idmachine']  = $dis->IDMachine;
//            $data[$i]['iddevice']   = $dis->IDDevice;
//            $data[$i]['idserial']   = $dis->IDSerial;
//            $data[$i]['value']      = $dis->Value;
//            $data[$i]['cycle']      = $dis->Cycle;
//            $data[$i]['datetime']   = $dis->UpdateDate;
//            $data[$i]['cycletime']  = $cycletime;
//            $data[$i]['cyclespeed']  = $cyclespeed;
//            $data[$i]['lastdown']   = $lastdown;