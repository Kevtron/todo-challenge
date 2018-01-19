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
    // Sends a message to the client to reload all todos
    const loadTodos = (x) => {
        socket.emit('load', x);
    }

    const useCache = (x) => {
        socket.emit('cache', x);
    }

    const updateTodos = (t) => {
        socket.emit('update', t);
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

        }); 
     }

    // Accepts when a client makes a new todo
    client.on('make', (t) => {
        // Make a new todo
        const newTodo = new Todo(title=t.title);

        // Push this newly created todo to our database
        DB.push(newTodo);

        //Persist todos
        persist(DB)
        // Send the latest todos to the client
        updateTodos([newTodo])
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
        persist([]);
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
    var pushDB = checkCache(DB, client.handshake.query.todos);   
    if (pushDB)
    {
        loadTodos(DB);
    } else {
        useCache();
    }   

});

function checkCache(DB, cacheString){
    if(cacheString && cacheString != 'undefined'){
    var cacheDict = JSON.parse(cacheString).reduce(function(map, obj) {
        map[obj.title] = obj.completed;
        return map;
    }, {});
    }else {
        return true;

    } 

    var dbDict =  DB.reduce(function(map, obj) {
        map[obj.title] = obj.completed;
        return map;
    }, {});

    var pushDB = false;
    if (dbDict.size != cacheDict.size)
    {
        pushDB = true;
    } 
    else
    {
    for (var key in cacheDict) 
        {
            var val = cacheDict[key];
            var compare = dbDict[key];
            if(compare != val)
            {
            pushDB = true;
            break;
            }
        }
    }
    return pushDB
 }
console.log('Waiting for clients to connect');


