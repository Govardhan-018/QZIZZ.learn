import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";

function Quizanalysis() {
    const [protectedData, setProtectedData] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedQno = localStorage.getItem("qId");
        const storedQuizCode = localStorage.getItem("idQZ");

        console.log("Stored values:", { storedQno, storedQuizCode });
        console.log("Environment URLs:", {
            protected: import.meta.env.VITE_PROTECTED_URL,
            analysis: import.meta.env.VITE_QUIZ_ANALYSIS_URL
        });

        if (!token) {
            setError("No token found, please log in.");
            navigate("/");
            return;
        }

        if (!storedQuizCode || !storedQno) {
            setError("Missing quiz code or result ID. Please ensure you have completed a quiz.");
            return;
        }

        // Check if environment variables are defined
        if (!import.meta.env.VITE_PROTECTED_URL || !import.meta.env.VITE_QUIZ_ANALYSIS_URL) {
            setError("Environment variables not configured properly. Please check your .env file.");
            return;
        }

        // First fetch - protected data
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
            .catch((err) => console.error("Protected data error:", err));

        // Second fetch - quiz analysis
        setLoading(true);
        fetch(import.meta.env.VITE_QUIZ_ANALYSIS_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quizCode: parseInt(storedQuizCode),
                qid: parseInt(storedQno)
            }),
        })
            .then(async (res) => {
                console.log("Response status:", res.status);
                console.log("Response headers:", res.headers);

                const responseText = await res.text();
                console.log("Raw response:", responseText);

                if (!res.ok) {
                    let errorMessage = "Failed to fetch analysis data";
                    try {
                        if (responseText.trim() && responseText.trim().startsWith('{')) {
                            const errorData = JSON.parse(responseText);
                            errorMessage = errorData.error || errorMessage;
                        } else {
                            errorMessage = responseText || `HTTP ${res.status}: ${res.statusText}`;
                        }
                    } catch (parseError) {
                        console.error("Error parsing error response:", parseError);
                        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                // Parse JSON response
                if (!responseText.trim()) {
                    throw new Error("Empty response from server");
                }

                try {
                    return JSON.parse(responseText);
                } catch (parseError) {
                    console.error("JSON parsing error:", parseError);
                    throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
                }
            })
            .then((responseData) => {
                console.log("Analysis data:", responseData);
                setData(responseData);
            })
            .catch((err) => {
                console.error("Fetch quiz error:", err);
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [navigate]);

    // Helper function to get question by ID
    const getQuestionById = (questions, questionId) => {
        if (!questions || !Array.isArray(questions)) return null;
        return questions.find(q => q.id === parseInt(questionId));
    };

    const getCorrectAnswerById = (answers, questionId) => {
        if (!answers || !Array.isArray(answers)) return null;
        const answer = answers.find(a => a.id === parseInt(questionId));
        return answer ? answer.correct_option : null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEEEEE]">
                <Navbar />
                <Profilebar user={protectedData} />
                <div className="pt-8 flex items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <div className="text-xl font-semibold text-[#00ADB5] mb-4">
                            Loading Analysis...
                        </div>
                        <div className="w-8 h-8 border-4 border-[#00ADB5] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#EEEEEE]">
                <Navbar />
                <Profilebar user={protectedData} />
                <div className="pt-8 flex items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <div className="text-red-500 font-semibold bg-red-50 p-6 rounded-xl border border-red-200 max-w-lg mx-4">
                            <h3 className="text-lg font-bold mb-2">Error</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#EEEEEE]">
                <Navbar />
                <Profilebar user={protectedData} />
                <div className="pt-8 flex items-center justify-center min-h-[50vh]">
                    <div className="text-center text-[#393E46]">
                        <h3 className="text-xl font-semibold">No data available</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <Navbar />
            <Profilebar user={protectedData} />

            {/* Main Content Container - positioned below navbar */}
            <div className="pt-8 pb-8">
                {data.resdata && (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        {/* Quiz Results Header */}
                        <div className="rounded-xl border-2 border-[#393E46] p-8 bg-white mb-8">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-[#00ADB5] mb-2">
                                    Quiz Analysis
                                </h2>
                                <h3 className="text-xl font-semibold text-[#222831] mb-4">
                                    {data.resdata.quiz_title}
                                </h3>
                            </div>

                            {/* Score Display */}
                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-[#EEEEEE] p-4 rounded-xl text-center border border-[#393E46]">
                                    <h4 className="text-sm font-semibold text-[#393E46] mb-1">Final Score</h4>
                                    <div className="text-3xl font-bold text-[#00ADB5]">
                                        {data.resdata.score}/{data.resdata.total_questions}
                                    </div>
                                </div>

                                <div className="bg-[#EEEEEE] p-4 rounded-xl text-center border border-[#393E46]">
                                    <h4 className="text-sm font-semibold text-[#393E46] mb-1">Percentage</h4>
                                    <div className="text-3xl font-bold text-[#00ADB5]">
                                        {Math.round((data.resdata.score / data.resdata.total_questions) * 100)}%
                                    </div>
                                </div>

                                <div className="bg-[#EEEEEE] p-4 rounded-xl text-center border border-[#393E46]">
                                    <h4 className="text-sm font-semibold text-[#393E46] mb-1">Submitted</h4>
                                    <div className="text-lg font-semibold text-[#222831]">
                                        {new Date(data.resdata.submitted_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Score Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-[#393E46] mb-1">
                                    <span>Your Performance</span>
                                    <span>{Math.round((data.resdata.score / data.resdata.total_questions) * 100)}%</span>
                                </div>
                                <div className="w-full bg-[#393E46] rounded-full h-3">
                                    <div
                                        className="bg-[#00ADB5] h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${(data.resdata.score / data.resdata.total_questions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Question Analysis */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-[#00ADB5] mb-6 text-center">
                                Question-by-Question Analysis
                            </h3>

                            {data.resdata.given_answer && data.quizInfo && data.quizInfo.questions && (
                                Object.entries(data.resdata.given_answer).map(([questionId, userAnswer]) => {
                                    const question = getQuestionById(data.quizInfo.questions, questionId);
                                    const correctAnswer = getCorrectAnswerById(data.quizInfo.answers, questionId);
                                    const isCorrect = userAnswer.option === correctAnswer;

                                    return (
                                        <div
                                            key={questionId}
                                            className={`rounded-xl border-2 p-6 transition-all ${isCorrect
                                                    ? 'bg-green-50 border-green-400'
                                                    : 'bg-red-50 border-red-400'
                                                }`}
                                        >
                                            {/* Question Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="text-lg font-bold text-[#222831] flex-1 pr-4">
                                                    Question {questionId}: {question?.question || 'Question not found'}
                                                </h4>
                                                <div className={`px-4 py-2 rounded-full font-bold text-sm ${isCorrect
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                    }`}>
                                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                </div>
                                            </div>

                                            {/* Answer Options */}
                                            {question?.options && (
                                                <div className="mb-4">
                                                    <h5 className="text-md font-semibold text-[#393E46] mb-3">Answer Options:</h5>
                                                    <div className="space-y-2">
                                                        {Object.entries(question.options).map(([key, value]) => {
                                                            const isUserAnswer = key === userAnswer.option;
                                                            const isCorrectOption = key === correctAnswer;

                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className={`p-3 rounded-lg border-2 ${isCorrectOption
                                                                            ? 'bg-green-100 border-green-400 text-green-800'
                                                                            : isUserAnswer && !isCorrectOption
                                                                                ? 'bg-red-100 border-red-400 text-red-800'
                                                                                : 'bg-white border-gray-200 text-[#222831]'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-medium">
                                                                            <span className="font-bold">{key}.</span> {value}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            {isCorrectOption && (
                                                                                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                                                    ✓ Correct
                                                                                </span>
                                                                            )}
                                                                            {isUserAnswer && !isCorrectOption && (
                                                                                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                                                    ✗ Your Choice
                                                                                </span>
                                                                            )}
                                                                            {isUserAnswer && isCorrectOption && (
                                                                                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                                                    ✓ Your Choice
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Answer Summary */}
                                            <div className="grid md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-[#393E46]">
                                                <div>
                                                    <span className="text-sm font-semibold text-[#393E46]">Your Answer:</span>
                                                    <div className="text-lg font-bold text-[#222831]">
                                                        {userAnswer.option} - {userAnswer.value}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold text-[#393E46]">Correct Answer:</span>
                                                    <div className="text-lg font-bold text-[#00ADB5]">
                                                        {correctAnswer}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
                            <button
                                onClick={() => navigate("/profile")}
                                className="px-6 py-3 rounded-xl font-semibold transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
                            >
                                View Profile
                            </button>
                            <button
                                onClick={() => navigate("/home")}
                                className="px-6 py-3 rounded-xl font-semibold transition-colors bg-[#393E46] text-[#EEEEEE] hover:bg-[#00ADB5]"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Quizanalysis;
