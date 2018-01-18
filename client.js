const socket = io('http://localhost:3003/').connect();
const list = document.getElementById('todo-list');

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
    // TODO: refocus the element
}

function deleteOne() {
    socket.emit('deleteOne')    
};
function deleteAll() {
    socket.emit('deleteAll')
};
function completeOne() {
    socket.emit('completeOne')
};
function completeAll() {
    socket.emit('completeAll')
};

function render(todo) {
    console.log(todo);
    const listItem = document.createElement('li');
    const listItemText = document.createTextNode(todo.title);
    listItem.appendChild(listItemText);
    list.append(listItem);
}

// NOTE: These are listeners for events from the socket
// This event is for (re)loading the entire list of todos from the socket
socket.on('load', (todos) => {
    console.log(todos);
    todos.forEach((todo) => render(todo));
});
