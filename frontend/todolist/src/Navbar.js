import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.name || "User");
        }
      } else {
        setUserName("User");
      }
    });

    return () => unsubscribe();
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    return words.map((w) => w[0].toUpperCase()).join("").slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">📝 To-Do List APP</div>

      <div className="navbar-greeting-wrapper">
        <div className="navbar-greeting">Hi 👋 {userName}</div>
      </div>

      <div
        className="navbar-profile"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="profile-initials">{getInitials(userName)}</div>
        <div className={`arrow-icon ${dropdownOpen ? "open" : ""}`}>▼</div>

        {dropdownOpen && (
          <div className="dropdown">
            <div
              className="dropdown-item username-display"
              style={{ cursor: "default", fontWeight: "bold" }}
            >
              {userName}
            </div>
            <div className="dropdown-item" onClick={handleEditProfile}>
              Edit Profile
            </div>
            <div
              className="dropdown-item"
              onClick={handleLogout}
              style={{ color: "red" }}
            >
              Logout ➡
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
