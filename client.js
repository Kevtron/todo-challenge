const socket = io('http://localhost:3003/',{query:"todos="+localStorage.todos});
const list = document.getElementById('todo-list');
const cache = [];

// NOTE: These are all our globally scoped functions for interacting with the socket
// This function adds a new todo from the input
function add() {
    console.warn(event);
    const input = document.getElementById('todo-input');

    // Emit the new todo as some data to the socket
    socket.emit('make', {
        title : input.value,
        completed : false
    });

    // Clear the input
    input.value = '';
    input.focus();
}

function deleteOne(s) {
    socket.emit('deleteOne',{title : s});    
};

function deleteAll() {
    socket.emit('deleteAll');
    localStorage.clear();
};

function completeOne(s) {
    socket.emit('completeOne',{title : s});
};

function completeAll() {
    socket.emit('completeAll');
};

function render(todo) {
    const listItem = document.createElement('li');
    const listItemText = document.createTextNode(todo.title);
    listItem.id = todo.title.replace(" ","-");
    listItem.classList.toggle("complete", todo.completed)
    listItem.classList.toggle("pending", !todo.completed)
    listItem.appendChild(listItemText);

    //Consider refactoring
    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.innerHTML="<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i>"; 
    completeButton.value = false;
    completeButton.onclick = function(){completeOne(todo.title)};
    listItem.appendChild(completeButton);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.innerHTML="<i class=\"fa fa-trash\" aria-hidden=\"true\"></i>"; 
    deleteButton.value = false;
    deleteButton.onclick = function(){deleteOne(todo.title)};
    listItem.appendChild(deleteButton);

    list.append(listItem);
}

function refresh(todo) {
    const listItem = document.getElementById(todo.title.replace(" ","-"))
    listItem.classList.toggle("complete", todo.completed)
    listItem.classList.toggle("pending", !todo.completed)
}

function remove(todo) {
    const listItem = document.getElementById(todo.title.replace(" ","-"))
    listItem.parentNode.removeChild(listItem);
}

// NOTE: These are listeners for events from the socket
// This event is for the initial load of list of todos from the socket
socket.on('load', (todos) => {
    //update localstorage
    localStorage.setItem("todos", JSON.stringify(todos))
    todos.forEach((todo) => render(todo));
});

//Use the cache
socket.on('cache', () => {
    var todos = JSON.parse(localStorage.getItem("todos"));
    todos.forEach((todo) => render(todo));
});

// This event is for appending to the list of todos from the socket
socket.on('update', (todos) => {
    todos.forEach((todo) => render(todo));
});

// This event is for updating members of the list of todos from the socket
socket.on('refresh', (todos) => {
    todos.forEach((todo) => refresh(todo));
});

// This event is for removing members of the list of todos from the socket
socket.on('remove', (todos) => {
    todos.forEach((todo) => remove(todo));
});
