import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";

function QuizDashboard() {
    const [protectedData, setProtectedData] = useState({});
    const [error, setError] = useState("");
    const [quizCode, setQuizCode] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        setQuizCode(localStorage.getItem("quizCode") || "");
        if (!token) {
            setError("No token found, please log in.");
            navigate("/");
            return;
        }
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

    function handleClosequiz() {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("No token found, please log in.");
            navigate("/");
            return;
        }

        const quizCode = localStorage.getItem("quizCode");
        if (!quizCode) {
            setError("No quiz code found.");
            return;
        }
        setLoading(true);
        fetch(import.meta.env.VITE_CLOSE_QUIZ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quizCode: quizCode,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    // Parse error from response body
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to close quiz");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Quiz closed successfully:", data);
                localStorage.removeItem("quizCode");
                navigate("/home");
            })
            .catch((err) => {
                console.error("Close quiz error:", err);
                setError(err.message); // Fix: Use err.message instead of res.error
            });
    }


    return (
        <div className="min-h-screen flex flex-col items-center">
            {loading ? (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="text-center">
                        <div className="text-xl font-semibold text-[#00ADB5] mb-4">
                            Closing Quiz...
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
                            <div className="w-full rounded-xl   p-6 mb-6">
                                <h4 className="text-lg font-semibold mb-2 text-[#222831] text-center">
                                    Your Quiz Code:
                                </h4>
                                <div className="text-3xl font-bold text-[#00ADB5] text-center mb-4 tracking-wider  p-4 rounded border border-[#393E46]">
                                    {quizCode}
                                </div>
                            </div>

                            <p className="text-[#222831] text-center mb-6 leading-relaxed">
                                To join the quiz, go to the <span className="font-semibold text-[#00ADB5]">home page</span> and
                                press on <span className="font-semibold text-[#393E46]">Join Quiz</span> button,
                                then enter this code.
                            </p>

                            <button
                                onClick={handleClosequiz}
                                className="w-full p-3 rounded font-semibold transition-colors bg-[#393E46] text-[#EEEEEE] hover:bg-red-600"
                            >
                                Close Quiz
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

export default QuizDashboard;
