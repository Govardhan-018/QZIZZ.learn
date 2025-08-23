import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      const expiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("token", token);
      localStorage.setItem("token_expiry", expiry);
      navigate("/home");
    }
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const responce = await fetch(import.meta.env.VITE_USERLOG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: email,
          pass: password,
        }),
      });
      if (responce.ok) {
        const data = await responce.json();
        const expiry = Date.now() + 60 * 60 * 1000;
        localStorage.setItem("token", data.token);
        localStorage.setItem("token_expiry", expiry);
        navigate("/home");
      } else {
        setEmail("");
        setPassword("");
        setLoading(false);
        alert("Invalid credentials");
      }
    } catch (error) {
      setEmail("");
      setPassword("");
      setLoading(false);
      alert("Login failed. Please try again.");
    }
  }

  async function handelSignup(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const responce = await fetch(import.meta.env.VITE_USERSIGN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mail: email,
          pass: password,
        }),
      });
      if (responce.ok) {
        const data = await responce.json();
        const expiry = Date.now() + 60 * 60 * 1000;
        localStorage.setItem("token", data.token);
        localStorage.setItem("token_expiry", expiry);
        navigate("/home");
      } else {
        setLoading(false);
        alert("Signup failed. Please try again.");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setLoading(false);
      alert("Signup failed. Please try again.");
      setEmail("");
      setPassword("");
    }
  }

  async function handelGoogle(e) {
    e.preventDefault();
    window.location.href = import.meta.env.VITE_USERGOOGLE_URL;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEEEEE]">
       {loading ? (
        <div className="flex flex-1 items-center justify-center w-full">
          <div className="text-center">
            <div className="text-xl font-semibold text-[#00ADB5] mb-4">
              Creating Quiz...
            </div>
            <div className="w-8 h-8 border-4 border-[#00ADB5] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
      <Navbar />
      <div className="flex flex-col md:flex-row w-full items-center justify-center gap-6 mt-16">
        <div className="rounded-xl border-2 border-black p-8 flex flex-col items-center w-full max-w-md bg-[#EEEEEE] mb-6 md:mb-0 md:mr-0">
          <h3 className="text-lg font-semibold mb-2 text-[#222831]">
            Let's go in
          </h3>
          <h1 className="text-3xl font-bold mb-6 text-[#00ADB5]">Welcome</h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[#393E46] p-3 mb-4 w-full rounded focus:outline-none focus:border-[#00ADB5] bg-[#EEEEEE] text-[#222831]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[#393E46] p-3 mb-4 w-full rounded focus:outline-none focus:border-[#00ADB5] bg-[#EEEEEE] text-[#222831]"
          />
          <button
            type="submit"
            onClick={handleLogin}
            className="w-full p-3 rounded font-semibold mb-3 transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
          >
            Login
          </button>
          <button
            type="submit"
            onClick={handelSignup}
            className="w-full p-3 rounded font-semibold mb-3 transition-colors bg-[#393E46] text-[#EEEEEE] hover:bg-[#00ADB5]"
          >
            Sign Up
          </button>
          <div className="my-3 text-center text-[#222831]">
            <span>or</span>
          </div>
          <button
            type="submit"
            onClick={handelGoogle}
            className="w-full p-3 rounded font-semibold flex items-center justify-center gap-3 transition-colors bg-[#222831] text-[#EEEEEE] hover:bg-[#00ADB5]"
          >
            <img
              src="https://www.vectorlogo.zone/logos/google/google-tile.svg"
              className="w-8 h-8"
              alt="googleLOGO"
            />
            Sign in with Google
          </button>
        </div>
        <div className="rounded-xl border-2 border-black p-8 flex flex-col items-center w-full max-w-md bg-[#EEEEEE]">
          <h2 className="text-2xl font-bold mb-4 text-[#00ADB5]">
            About QZIZZ.learn
          </h2>
          <p className="text-[#222831] text-center mb-2">
            Welcome to{" "}
            <span className="font-semibold text-[#00ADB5]">QZIZZ.learn</span>! This
            website lets you{" "}
            <span className="font-semibold text-[#393E46]">create quizzes using AI</span>
            {" "}and invite multiple people to join and play together.
          </p>
          <ul className="list-disc pl-5 text-[#393E46] text-left">
            <li>Create custom quizzes powered by AI.</li>
            <li>Invite friends or groups to join your quiz.</li>
            <li>Compete and learn in real-time.</li>
            <li>Track scores and improve your knowledge.</li>
          </ul>
          <p className="mt-4 text-[#222831] text-center">
            Get started by signing up or logging in!
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

export default Login;
