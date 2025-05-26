import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Login.css";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#]{6,}$/;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword || !location || !phone)
      return alert("Please fill in all fields.");
    if (!emailRegex.test(email)) return alert("Invalid email format.");
    if (!passwordRegex.test(password))
      return alert("Password must be at least 6 characters and include a number and a letter.");
    if (password !== confirmPassword) return alert("Passwords do not match.");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update displayName in Firebase Auth
      await updateProfile(user, { displayName: fullName });

      // Store profile in Firestore with extra fields
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email,
        uid: user.uid,
        location,
        phone,
      });

      // Inform backend (optional)
      await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, name: fullName, email, location, phone }),
      });

      alert("Registered successfully");
      navigate("/home");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login.");
        navigate("/");
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>📝 TODO-List</h2>
        <p>Create Account</p>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <a href="/">Login here</a>
        </p>
      </div>
      <div className="login-image">{/* Optional image */}</div>
    </div>
  );
};

export default Register;
