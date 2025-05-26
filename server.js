const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Firebase Admin Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Sanitize email function — used consistently everywhere
const sanitizeEmail = (email) =>
  email.replace(/\./g, "_dot_").replace(/@/g, "_at_");

/**
 * ✅ Register route (called from frontend after Firebase Auth registration)
 * Stores user profile in Firestore at: users/{uid}
 */
app.post('/register', async (req, res) => {
  const { uid, name, email } = req.body;

  if (!uid || !name || !email) {
    return res.status(400).json({ error: "uid, name, and email are required." });
  }

  try {
    await db.collection('users').doc(uid).set({ name, email });
    res.status(201).json({ uid, name, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Create a new task
 * Tasks are stored in tasks/{sanitizedEmail} as an object with taskId keys
 */
app.post('/tasks', async (req, res) => {
  const { title, description, email } = req.body;

  if (!title || !description || !email) {
    return res.status(400).json({ error: "Title, description, and email are required." });
  }

  try {
    const taskId = Date.now().toString();
    const taskData = {
      title,
      description,
      createdAt: new Date().toISOString()
    };

    const sanitizedEmail = sanitizeEmail(email);
    const taskRef = db.collection('tasks').doc(sanitizedEmail);
    await taskRef.set({ [taskId]: taskData }, { merge: true });

    res.status(200).json({ id: taskId, ...taskData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Get all tasks for a user
 */
app.get('/tasks', async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const sanitizedEmail = sanitizeEmail(email);
    const doc = await db.collection('tasks').doc(sanitizedEmail).get();
    if (!doc.exists) return res.status(200).json({});
    res.status(200).json(doc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Update a specific task by ID
 */
app.put('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, email } = req.body;

  if (!email || (!title && !description)) {
    return res.status(400).json({ error: "Email and updated task data are required." });
  }

  try {
    const sanitizedEmail = sanitizeEmail(email);
    const taskRef = db.collection('tasks').doc(sanitizedEmail);
    const doc = await taskRef.get();

    const existingTask = doc.data()?.[taskId];
    if (!existingTask) return res.status(404).json({ error: "Task not found." });

    const updatedTask = {
      ...existingTask,
      title: title || existingTask.title,
      description: description || existingTask.description
    };

    await taskRef.update({ [taskId]: updatedTask });

    res.status(200).json({ message: "Task updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Delete a specific task by ID
 */
app.delete('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const sanitizedEmail = sanitizeEmail(email);
    const taskRef = db.collection('tasks').doc(sanitizedEmail);

    const docSnap = await taskRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "User tasks document not found" });
    }

    const tasks = docSnap.data();
    if (!tasks[taskId]) {
      return res.status(404).json({ error: "Task ID not found" });
    }

    await taskRef.update({
      [taskId]: FieldValue.delete()
    });

    res.status(200).json({ message: `Task ${taskId} deleted.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Optional: Update user profile in Firestore
 * Only for Firestore profile data — Firebase Auth (email/password) is updated on frontend
 */
app.put('/edit-profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    await db.collection('users').doc(uid).update({ name, email });
    res.status(200).json({ message: "Profile updated in Firestore." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
