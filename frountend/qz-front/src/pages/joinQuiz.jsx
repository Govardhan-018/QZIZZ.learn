import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";
import { useNavigate } from "react-router-dom";

function JoinQuiz() {
    const [protectedData, setProtectedData] = useState({});
    const [error, setError] = useState("");
    const [quizCode, setQuizCode] = useState("");
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

    function handleJoinquiz() {
        if (quizCode.trim().length === 0) {
            setError("Quiz code cannot be empty.");
            return;
        }
        setError("");
        setLoading(true);
        const token = localStorage.getItem("token");
        fetch(import.meta.env.VITE_JOIN_QUIZ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quizCode: quizCode.trim(),
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to join quiz");
                }
                return res.json();
            })
            .then((data) => {
                console.log(data);
                localStorage.setItem("quizCode", quizCode.trim());
                navigate("/quiz");
            })
            .catch((err) => setError(err.message));
    }


    return (
        <div className="min-h-screen flex flex-col items-center">
            {loading ? (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="text-center">
                        <div className="text-xl font-semibold text-[#00ADB5] mb-4">
                            Joining Quiz...
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
                                Join a Quiz
                            </h3>
                            <p className="text-[#222831] text-center mb-6">
                                Enter the quiz code provided by the quiz creator to join and start playing.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter quiz code"
                                onChange={(e) => setQuizCode(e.target.value)}
                                value={quizCode}
                                className="border border-[#393E46] p-3 mb-6 w-full rounded focus:outline-none focus:border-[#00ADB5] text-[#222831] text-center text-lg tracking-wider"
                            />
                            <button
                                onClick={handleJoinquiz}
                                className="w-full p-3 rounded font-semibold transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
                            >
                                Join Quiz
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

export default JoinQuiz;
