const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const PORT = 3000;

app.use(cors());
app.use(express.json());

const serviceAcc = require('./key.json');
initializeApp({
    credential: cert(serviceAcc)
});

const db = getFirestore();

// Signup endpoint
app.post('/auth/signup', async (req, res) => {
    const { user_entered_email, user_entered_username, user_entered_password } = req.body;

    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', user_entered_email).get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(user_entered_password, 10);

        await userRef.add({
            email: user_entered_email,
            username: user_entered_username,
            password: hashedPassword
        });

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Signup failed', error: err.message });
    }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
    const { user_entered_email, user_entered_password } = req.body;

    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', user_entered_email).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        const isMatch = await bcrypt.compare(user_entered_password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        return res.status(200).json({ message: 'Login successful', user: userData });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
});
