const http = require('http');
const io = require('socket.io');
const firstTodos = require('./data');
const Todo = require('./todo');
const port = 3003;
const fs=require('fs');
const url=require('url');

var server = http.createServer(function(request, response){
    var pathName =url.parse(request.url).pathname;
    if (pathName === '')
        pathName = 'index.html'
        fs.readFile(__dirname + pathName, function(err, data){
        if (err) {
           response.writeHead(404, {'Content-type':'text/plain'});
           response.write('Page Was Not Found');
           response.end();
        }
        else
        {
           response.writeHead(200);
           response.write(data);
           response.end();
        }
    })
});

server.listen(port);

var socket = io.listen(server);

socket.on('connection', (client) => {
    // This is going to be our fake 'database' for this application
    // Parse all default Todo's from db

    // FIXME: DB is reloading on client refresh. It should be persistent on new client
    // connections from the last time the server was run...
console.log("this worked");
    const DB = firstTodos.map((t) => {
        // Form new Todo objects
        return new Todo(title=t.title);
    });

    // Sends a message to the client to reload all todos
    const reloadTodos = () => {
        server.emit('load', DB);
    }

    // Accepts when a client makes a new todo
    client.on('make', (t) => {
        // Make a new todo
        const newTodo = new Todo(title=t.title);

        // Push this newly created todo to our database
        DB.push(newTodo);

        // Send the latest todos to the client
        // FIXME: This sends all todos every time, could this be more efficient?
        reloadTodos();
    });

    // Send the DB downstream on connect
    reloadTodos();
});

console.log('Waiting for clients to connect');
