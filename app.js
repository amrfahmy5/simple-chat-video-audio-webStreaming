var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(3000,()=>{
    console.log('Server running... ');
});;

var io = require('socket.io').listen(server);
var cv = require('opencv4nodejs');
const wCap = new cv.VideoCapture(0)  ;

const fs = require('fs')


users = [];
connections =  []; 
audioList = [];

app.get('/play/:path', function(req,res) {
    var audioIndex = audioList.findIndex(item => item === req.params.path)
    var file = audioList[audioIndex]
    var stream = fs.createReadStream(file)
    .on("open", function() {
      stream.pipe(res);
    });
})


app.get('/',function(req,res){
    createAudioPaths();
    res.sendFile(__dirname + '/index.html');
});

app.get('/list', async(req,res) => {
    res.json(audioList);
  });

function createAudioPaths()
{
    audioList.push("plain_truth.mp3");
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
