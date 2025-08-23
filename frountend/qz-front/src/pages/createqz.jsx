import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";
import { useNavigate } from "react-router-dom";

function CreateQuiz() {
  const [protectedData, setProtectedData] = useState({});
  const [error, setError] = useState("");
  const [quizContent, setQuizContent] = useState("");
  const [quizCount, setQuizCount] = useState(10);
  const [loading, setLoading] = useState(false);
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

  function handleCreate() {
    // Validate BEFORE setting loading
    if (quizContent.trim().split(" ").length > 4) {
      setError("Quiz content must be 1 to 4 words.");
      return;
    }
    if (quizCount < 1 || quizCount > 50) {
      setError("Quiz count must be between 1 and 50.");
      return;
    }
    
    // Set loading and clear error
    setLoading(true);
    setError("");
    
    const token = localStorage.getItem("token");
    fetch(import.meta.env.VITE_CREATE_QUIZ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: quizContent,
        questions: quizCount,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create quiz");
        return res.json();
      })
      .then((data) => {
        console.log(data);
        localStorage.setItem("quizCode", data.quizCode);
        setLoading(false);
        navigate("/quiz-dashboard");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
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
          <Profilebar user={protectedData} />
          <div className="flex flex-1 items-center justify-center w-full">
            <div className="w-full max-w-lg rounded-xl p-8 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-4 text-[#00ADB5] text-center">
                Create Your AI Quiz
              </h3>
              <p className="text-[#222831] text-center mb-6">
                Enter a word or phrase (1 to 4 words) for your quiz topic and select how many questions you want to generate.
              </p>
              <input
                type="text"
                placeholder="Quiz content (1-4 words)"
                onChange={(e) => setQuizContent(e.target.value)}
                value={quizContent}
                className="border border-[#393E46] p-3 mb-4 w-full rounded focus:outline-none focus:border-[#00ADB5] text-[#222831]"
              />
              <input
                type="number"
                min={1}
                max={50}
                placeholder="Quiz count"
                onChange={(e) => setQuizCount(e.target.value)}
                value={quizCount}
                className="border border-[#393E46] p-3 mb-6 w-full rounded focus:outline-none focus:border-[#00ADB5] text-[#222831]"
              />
              <button
                onClick={handleCreate}
                disabled={loading}
                className={`w-full p-3 rounded font-semibold transition-colors ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#00ADB5] hover:bg-[#393E46]'
                } text-[#EEEEEE]`}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              {error && (
                <div className="text-red-500 mt-4 text-center">{error}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CreateQuiz;
