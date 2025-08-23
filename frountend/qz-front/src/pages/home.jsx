import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";

function Home() {
  const [protectedData, setProtectedData] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(import.meta.env.VITE_PROTECTED_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or error");
        return res.json();
      })
      .then((data) => {
        setProtectedData(data.user);
        console.log(data);
      })
      .catch((err) => setError(err.message));
  }, []);

  function handleCrtquiz() {
    navigate("/create-quiz");
  }
  function handleJoinquiz() {
    navigate("/join-quiz");
  }

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center">
      <Navbar />
     <Profilebar user={protectedData} />
      <div className="flex flex-col items-center justify-center gap-8 mt-20">
        <h1 className="text-4xl font-bold text-[#00ADB5] mb-4">
          Welcome to QZIZZ.learn!
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          <button
            onClick={handleCrtquiz}
            className="px-8 py-4 rounded-xl bg-[#00ADB5] text-[#EEEEEE] font-bold text-lg shadow hover:bg-[#393E46] transition"
          >
            Create Quiz
          </button>
          <button
            onClick={handleJoinquiz}
            className="px-8 py-4 rounded-xl bg-[#393E46] text-[#EEEEEE] font-bold text-lg shadow hover:bg-[#00ADB5] transition"
          >
            Join Quiz
          </button>
        </div>
        {error && (
          <div className="text-red-500 mt-4 text-center">{error}</div>
        )}
      </div>
    </div>
  );
}

export default Home;
