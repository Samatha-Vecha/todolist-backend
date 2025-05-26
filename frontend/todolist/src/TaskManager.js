import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

const TaskManager = () => {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [user, setUser] = useState(null);

  const sanitizeEmail = (email) =>
    email.replace(/\./g, "_dot_").replace(/@/g, "_at_");

  // ✅ Memoized fetchTodos to avoid useEffect warning
  const fetchTodos = useCallback(async (email) => {
    const sanitized = sanitizeEmail(email);
    const userDocRef = doc(db, "tasks", sanitized);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const tasksData = userDocSnap.data();
      setTodos(Object.entries(tasksData || {}).map(([id, task]) => ({ id, ...task })));
    } else {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchTodos(firebaseUser.email); // ✅ Using memoized version
      } else {
        setUser(null);
        setTodos([]);
      }
    });

    return () => unsubscribe();
  }, [fetchTodos]);

  const addTodo = async () => {
    const newTodo = { title, description };
    const sanitized = sanitizeEmail(user.email);
    const userDocRef = doc(db, "tasks", sanitized);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const tasks = userDocSnap.data();
      const newTaskId = new Date().getTime().toString();
      tasks[newTaskId] = newTodo;
      await updateDoc(userDocRef, tasks);
    } else {
      await setDoc(userDocRef, {
        [new Date().getTime().toString()]: newTodo,
      });
    }

    setTitle("");
    setDescription("");
    fetchTodos(user.email);
  };

  const updateTodo = async () => {
    const updated = { title, description };
    const sanitized = sanitizeEmail(user.email);
    const userDocRef = doc(db, "tasks", sanitized);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const tasks = userDocSnap.data();
      tasks[editingId] = updated;
      await updateDoc(userDocRef, tasks);
    }

    setEditingId(null);
    setTitle("");
    setDescription("");
    fetchTodos(user.email);
  };

  const deleteTodo = async (id) => {
    if (!user?.email) return;
    const sanitizedEmail = sanitizeEmail(user.email);

    try {
      await axios.delete(`http://localhost:3001/tasks/${id}`, {
        data: { email: sanitizedEmail },
      });

      alert("Task deleted successfully ✅");
      fetchTodos(user.email);
    } catch (error) {
      console.error('Delete error:', error.response?.data?.error || error.message);
      alert("Failed to delete the task ❌");
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setTitle(todo.title);
    setDescription(todo.description);
    setSelectedTodo(null);
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="container">
      <h1 className="title">TODO App</h1>

      <div className="form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-title"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input input-description"
          rows={4}
        />

        {editingId ? (
          <button onClick={updateTodo} className="button button-update">Update</button>
        ) : (
          <button onClick={addTodo} className="button button-add">Add</button>
        )}
      </div>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item" onClick={() => setSelectedTodo(todo)}>
            <h3>{todo.title}</h3>
            <p>{todo.description.length > 100 ? todo.description.slice(0, 100) + "..." : todo.description}</p>
            <div>
              <button onClick={(e) => { e.stopPropagation(); startEditing(todo); }} className="button-edit">
                <i className="fas fa-edit"></i>
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} className="button-delete">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedTodo && (
        <div className="modal-overlay" onClick={() => setSelectedTodo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTodo(null)}>&times;</button>
            <h2>{selectedTodo.title}</h2>
            <p>{selectedTodo.description}</p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="button-edit" onClick={() => startEditing(selectedTodo)}>
                <i className="fas fa-edit"></i>
              </button>
              <button className="button-delete" onClick={() => deleteTodo(selectedTodo.id)}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
