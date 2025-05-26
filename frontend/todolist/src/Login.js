import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Try to get user name from displayName, else Firestore, else default "User"
      let userName = user.displayName;
      if (!userName) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userName = userDocSnap.data().name;
        }
      }
      userName = userName || "User";

      localStorage.setItem("userName", userName);
      localStorage.setItem("userEmail", user.email);
      navigate("/home");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email above before clicking reset.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (error) {
      alert("Failed to send reset email. Reason: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>📝 TODO-List</h2>
        <p>Login</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="remember">
            <input type="checkbox" /> Remember Me
          </div>
          <button type="submit">Log In</button>
        </form>
        <p>
          <a href="#" className="forgot-password" onClick={handleForgotPassword}>
            Forgot your password?
          </a>
        </p>
        <p style={{ marginTop: "15px" }}>
          Don’t have an account?{" "}
          <span
            className="register-link"
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer" }}
          >
            Register here
          </span>
        </p>
      </div>
      <div className="login-image">{/* Optional image */}</div>
    </div>
  );
};

export default Login;
