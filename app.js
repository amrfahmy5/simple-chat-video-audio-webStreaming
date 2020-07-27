var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(3000,()=>{
    console.log('Server running... ');
});;
var io = require('socket.io').listen(server);
var cv = require('opencv4nodejs');
const wCap = new cv.VideoCapture(0)    ;


users = [];
connections =  []; 
audioList = [];

app.get('/play', function(req,res) {
    var audioIndex = audioList.findIndex(item => item.id === req.query.name)
    let file = audioList[audioIndex].path
    var stream = fs.createReadStream(file)
    .on("open", function() {
      stream.pipe(res);
    });
})


app.get('/',function(req,res){
    console.log(req.query.name);
    createAudioPaths();
    res.sendFile(__dirname + '/index.html');
});

app.get('/list', async(req,res) => {
    res.json(audioList);
  });

function createAudioPaths()
{
    audioList.push(__dirname+"/audio/plain_truth.mp3");
}

io.sockets.on('connection', function(socket){


    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);
    
    socket.on('disconnect',function(data){
        users.splice(users.indexOf(socket.username),1);
        io.sockets.emit('get users',users);
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected',connections.length);

    });


    socket.on('send message',function(data){
        // if(data.value().splite(':')[0]=='audio')
            console.log(data.value().splite(':'));
        io.sockets.emit('new message', {user: socket.username, msg: data});
    });
    

    socket.on('send message to user',function(data){
        let found = connections.find(e => e.username === data.userName);
        if(found==null)
            io.to(socket.id).emit('new message to user',{'senderUserName':socket.username,'reciverUserName':'Not Found(error)','data':''});
        else{
            console.log(found.id)
            io.to(found.id).emit('new message to user',{'senderUserName':socket.username,'reciverUserName':found.username,'data':data.data});
            io.to(socket.id).emit('new message to user',{'senderUserName':socket.username,'reciverUserName':found.username,'data':data.data});
        }
    });



    socket.on('new user',function(data,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        io.sockets.emit('get users',users); 
    });

    setInterval(()=>{
        var frame =wCap.read();
        var image = cv.imencode('.jpg',frame).toString('base64');
        io.emit('image',image)
    },1000)
});


/*
socket.emit('message', "this is a test"); //sending to sender-client only
socket.broadcast.emit('message', "this is a test"); //sending to all clients except sender


socket.broadcast.to('game').emit('message', 'nice game'); //sending to all clients in 'game' room(channel) except sender
socket.to('game').emit('message', 'enjoy the game'); //sending to sender client, only if they are in 'game' room(channel)


socket.broadcast.to(socketid).emit('message', 'for your eyes only'); //sending to individual socketid
io.emit('message', "this is a test"); //sending to all clients, include sender


io.in('game').emit('message', 'cool game'); //sending to all clients in 'game' room(channel), include sender
io.of('myNamespace').emit('message', 'gg'); //sending to all clients in namespace 'myNamespace', include sender


socket.emit(); //send to all connected clients
socket.broadcast.emit(); //send to all connected clients except the one that sent the message


socket.on(); //event listener, can be called on client to execute on server
io.sockets.socket(); //for emiting to specific clients
io.sockets.emit(); //send to all connected clients (same as socket.emit)
io.sockets.on() ; //initial connection from a client.
*/