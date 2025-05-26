import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import EditProfile from "./EditProfile";
import Layout from "./Layout"; // 🔹 layout with navbar

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages with navbar */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
