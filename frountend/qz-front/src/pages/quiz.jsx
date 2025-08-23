import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";
import { useNavigate } from "react-router-dom";

function Quiz() {
    const [protectedData, setProtectedData] = useState({});
    const [error, setError] = useState("");
    const [quizes, setQuizes] = useState([]);
    const [prquiz, setPrquiz] = useState(1);
    const [timing, setTiming] = useState({ stTime: null, endTime: null });
    const [ans, setAns] = useState({});
    const [score, setScore] = useState(false);
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

        const quizCode = localStorage.getItem("quizCode");
        if (!quizCode) {
            setError("No quiz code found, please join a quiz.");
            navigate("/join-quiz");
            return;
        }

        fetch(import.meta.env.VITE_QUIZ_GET_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quizCode: quizCode,
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to join quiz");
                return res.json();
            })
            .then((data) => {
                console.log(data);
                setQuizes(data.quiz.questions);
                setTiming({ stTime: data.quiz.startTime, endTime: null });
            })
            .catch((err) => setError(err.message));
    }, []);

    const currentQuestion = quizes.find((q) => q.id === prquiz);

    const handleAnswerSelect = (questionId, option, value) => {
        setAns(prev => ({
            ...prev,
            [questionId]: { option, value }
        }));
    };

    // Fix the typo and timing logic in handleSubmit:
   function handleSubmit() {
    setError("");
    const token = localStorage.getItem("token");
    const qzx = localStorage.getItem("quizCode");
    const currentEndTime = new Date().toISOString();

    setTiming(prev => ({ ...prev, endTime: currentEndTime }));

    // Send the ans object directly instead of converting
    fetch(import.meta.env.VITE_SUBMIT_ANS_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            answers: ans, // Send ans object directly
            quizCode: qzx,
            startTime: timing.stTime || new Date().toISOString(),
            endTime: currentEndTime,
        }),
    })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to submit answers");
            return res.json();
        })
        .then((data) => {
            setScore(data);
            console.log("Response data:", data);
        })
        .catch((err) => setError(err.message));
}


    return (
        <div className="min-h-screen flex flex-col items-center">
            <Navbar />
            <Profilebar user={protectedData} />

            {error && (
                <div className="text-red-500 mt-4 text-center">{error}</div>
            )}

            {currentQuestion ? (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="w-full max-w-4xl rounded-xl p-8 flex flex-col border-2 border-[#393E46] mx-4">
                        {/* Progress indicator */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-[#393E46]">
                                    Question {prquiz} of {quizes.length}
                                </span>
                                <div className="text-sm text-[#393E46]">
                                    Progress: {Math.round((prquiz / quizes.length) * 100)}%
                                </div>
                            </div>
                            <div className="w-full bg-[#393E46] rounded-full h-2">
                                <div
                                    className="bg-[#00ADB5] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(prquiz / quizes.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Question */}
                        <h3 className="text-2xl font-bold mb-6 text-[#222831] leading-relaxed">
                            {currentQuestion.question}
                        </h3>

                        {/* Answer options */}
                        <div className="space-y-3 mb-8">
                            {Object.entries(currentQuestion.options).map(([key, value]) => (
                                <button
                                    key={key}
                                    className={`block w-full p-4 text-left border-2 rounded-xl transition-all duration-200 ${ans[currentQuestion.id]?.option === key
                                        ? 'bg-[#00ADB5] border-[#00ADB5] text-[#EEEEEE] font-semibold'
                                        : 'bg-[#EEEEEE] border-[#393E46] text-[#222831] hover:bg-[#00ADB5] hover:text-[#EEEEEE] hover:border-[#00ADB5]'
                                        }`}
                                    onClick={() => handleAnswerSelect(currentQuestion.id, key, value)}
                                >
                                    <span className="font-bold">{key}.</span> {value}
                                </button>
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setPrquiz(prquiz - 1)}
                                disabled={prquiz <= 1}
                                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${prquiz <= 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#393E46] text-[#EEEEEE] hover:bg-[#222831]'
                                    }`}
                            >
                                ← Previous
                            </button>

                            <div className="flex-1 text-center">
                                <span className="text-[#222831] font-semibold">
                                    {ans[currentQuestion.id] ?
                                        `Selected: ${ans[currentQuestion.id].option}` :
                                        'No answer selected'
                                    }
                                </span>
                            </div>

                            <button
                                onClick={() => setPrquiz(prquiz + 1)}
                                disabled={prquiz >= quizes.length}
                                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${prquiz >= quizes.length
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]'
                                    }`}
                            >
                                Next →
                            </button>
                        </div>

                        {/* Submit button (appears on last question) */}
                        {prquiz === quizes.length && (
                            <div className="mt-6 text-center">
                                <button className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-colors"
                                    onClick={handleSubmit}>
                                    Submit Quiz
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="text-center">
                        <div className="text-xl font-semibold text-[#00ADB5] mb-4">
                            Loading Quiz...
                        </div>
                        <div className="w-8 h-8 border-4 border-[#00ADB5] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                </div>
            )}
            {score && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 text-center shadow-2xl">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-4 text-[#00ADB5]">Quiz Submitted!</h2>

                            {/* Score display with better formatting */}
                            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                                <h3 className="text-3xl font-bold text-[#222831] mb-2">
                                    {score.score}/{score.total}
                                </h3>
                                <p className="text-gray-600">Correct Answers</p>
                            </div>

                            {/* Percentage if available */}
                            {score.percentage && (
                                <div className="mb-4">
                                    <p className="text-xl font-semibold text-[#00ADB5]">
                                        {score.percentage}%
                                    </p>
                                </div>
                            )}

                            {/* Points */}
                            <div className="bg-[#00ADB5] text-white p-3 rounded-lg mb-4">
                                <h3 className="text-xl font-bold">Points: {score.points}</h3>
                            </div>

                            {/* Time taken if available */}
                            {score.timeTaken && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Time taken: {Math.floor(score.timeTaken / 60)}:{(score.timeTaken % 60).toString().padStart(2, '0')}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => { setScore(null); navigate("/home"); }}
                            className="w-full px-6 py-3 rounded-xl bg-[#00ADB5] text-white font-semibold hover:bg-[#393E46] transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Quiz;
