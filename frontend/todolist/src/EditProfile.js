import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

const EditProfile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const fetchUserData = async (uid) => {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setName(userData.name || "");
        setLocation(userData.location || "");
        setPhone(userData.phone || "");
      } else {
        console.log("No such user!");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        console.log("User not signed in");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !location) {
      alert("Name, location, and phone are required.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        await updateDoc(userRef, { name, location, phone });
      } else {
        await setDoc(userRef, { name, location, phone, uid: user.uid });
      }

      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      localStorage.setItem("userName", name);

      alert("Profile updated successfully!");
      navigate("/home");
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try logging in again.");
    }
  };

  return (
    <div className="edit-profile-container">
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <h2>Edit Profile</h2>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProfile;
