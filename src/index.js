const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.filter((user) => user.username === username);

  if (!user) {
    return response.status(400).send({
      error: "Mensagem do erro",
    });
  }
  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const user = users.filter((user) => user.username === username);

  if (user.length > 0) {
    return response.status(400).send({ error: "Mensagem do erro" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  if (validate(newUser.id)) {
    users.push(newUser);

    return response.status(201).send(newUser);
  }

  return response.send("Not a uuid");
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;

  const user = users.filter((user) => user?.username === username);

  return response.send(user[0]?.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date(),
  };

  const userCreated = users.map((user, index) => {
    if (user.username === username) {
      if (validate(newTodo.id)) {
        users[index].todos.push(newTodo);

        return true;
      }

      return false;
    }
  });

  if (userCreated) return response.status(201).send(newTodo);

  return response.send("Not uuid");
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const { username } = request.headers;
  let todoUpdated = {
    isUpdated: false,
    todo: {},
  };

  const userUpdated = users.map((user) => {
    if (user.username === username) {
      const updatedTodo = user.todos.map((todo, index) => {
        if (todo.id === id) {
          todoUpdated.isUpdated = true;
          todoUpdated.todo = {
            ...todo,
            title,
            deadline,
          };

          user.todos[index] = {
            ...todoUpdated.todo,
          };
          return;
        }
        todoUpdated.isUpdated = false;
        return;
      });
      return;
    }
  });

  if (todoUpdated.isUpdated) return response.status(201).send(todoUpdated.todo);

  return response.status(404).send({ error: "Not Found" });
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  let todoUpdated = {
    isUpdated: false,
    todo: {},
  };

  const userUpdated = users.map((user) => {
    if (user.username === username) {
      const updatedTodo = user.todos.map((todo, index) => {
        if (todo.id === id) {
          todoUpdated.isUpdated = true;
          todoUpdated.todo = {
            ...todo,
            done: true,
          };

          user.todos[index] = {
            ...todoUpdated.todo,
          };
          return;
        }
        todoUpdated.isUpdated = false;
        return;
      });
      return;
    }
  });

  if (todoUpdated.isUpdated) return response.status(200).send(todoUpdated.todo);

  return response.status(404).send({ error: "Not Found" });
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  let isDeleted = false;

  const userDeleted = users.map((user) => {
    if (user.username === username) {
      const deletedTodo = user.todos.map((todo) => {
        if (todo.id === id) {
          isDeleted = true;
        } else {
          return todo;
        }
      });

      user.todos = user.todos.filter((todo) => todo.id !== id);
      return;
    }
  });

  if (isDeleted) return response.status(204).send("No Content");

  return response.status(404).send({ error: "Not Found" });
});

module.exports = app;
