const http = require('http');
const io = require('socket.io');
const firstTodos = require('./data');
const Todo = require('./todo');
const port = 3003;
const fs=require('fs');
const url=require('url');

var server = http.createServer(function(request, response){
    var pathName = url.parse(request.url).pathname;
    if (pathName === '/')
       {
         pathName = '/index.html'
       }
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

const socket = io.listen(server);
const DB = firstTodos.map((t) => {
        // Form new Todo objects
        return new Todo(title=t.title, completed = t.completed);
    });

socket.on('connection', (client) => {
    // This is going to be our fake 'database' for this application
    // Parse all default Todo's from db

    // FIXME: DB is reloading on client refresh. It should be persistent on new client
    // connections from the last time the server was run...


    // Sends a message to the client to reload all todos
    const reloadTodos = (x) => {
        socket.emit('load', x);
    }
    
    const refreshTodos = (t) => {
        socket.emit('refresh', t);
    }

    const removeTodos = (t) => {
        socket.emit('remove', t);
    }

    const persist = (t) => 
    {
        const content = JSON.stringify(t);

        fs.writeFile("data.json", content, 'utf8', function (err) {
            if (err) {
            return console.log(err);
        }

         console.log("The file was saved!");
        }); 
     }

    // Accepts when a client makes a new todo
    client.on('make', (t) => {
        // Make a new todo
        const newTodo = new Todo(title=t.title);
        console.log(newTodo);

        // Push this newly created todo to our database
        DB.push(newTodo);
        console.log(DB);

        //Persist todos
        persist(DB)
        // Send the latest todos to the client
        reloadTodos([newTodo])
    });
    
    client.on('deleteOne',(t) => {
        let obj = DB.find((o, i) => {
            if (o.title === t.title) {
                DB.splice(i, 1);
                return true; // stop searching
            }
        });
        //Persist todos
        persist(DB)
        // Send the todo to remove to the client
        const toRemove = new Todo(title=t.title);
        removeTodos([toRemove]);
    });

    client.on('deleteAll', () => {
        //burn it down man
        removeTodos(DB);
        DB.splice(0,DB.length);//empty the array
        persist(DB);
     });

    client.on('completeOne',(t) => {
        var newTodo = new Todo(title=t.title, completed=true);
        let obj = DB.find((o, i) => {
            if (o.title === t.title) {
                DB[i] = newTodo;
                return true; // stop searching
            }
        });
        
        //Persist todos
        persist(DB)
        // Send the latest todos to the client
        refreshTodos([newTodo])
    });

    client.on('completeAll', (t) => {
        for (var i in DB) 
            {
                DB[i].completed = true;
            }     
        persist(DB);
        refreshTodos(DB);
         
    });

    // Send the DB downstream on connect
    reloadTodos(DB);
});

console.log('Waiting for clients to connect');
