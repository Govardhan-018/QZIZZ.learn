import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function Profile() {
    const [protectedData, setProtectedData] = useState({});
    const [joinedQuizzes, setJoinedQuizzes] = useState([]);
    const [createdQuizzes, setCreatedQuizzes] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("No token found, please log in.");
            navigate("/");
            return;
        }

        console.log("Making API call...");
        fetch(import.meta.env.VITE_GET_PROFILE_DATA_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                console.log("Response status:", res.status);
                if (!res.ok) throw new Error("Unauthorized or error");
                return res.json();
            })
            .then((data) => {
                console.log("Full response data:", data);

                setProtectedData(data.user || {});
                setJoinedQuizzes(data.user?.joinedQuizes || []);
                setCreatedQuizzes(data.user?.createdQuizes || []);
            })
            .catch((err) => {
                console.error("API Error:", err);
                setError(err.message);
            });
    }, [navigate]);


    return (
        <div className="min-h-screen flex flex-col items-center">
            <Navbar />
            {error ? (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-[#00ADB5]">Error</h2>
                        <p className="text-red-500">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="w-full max-w-4xl p-8 mx-4">
                        <h2 className="text-3xl font-bold mb-8 text-center text-[#00ADB5]">
                            Profile
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* User Information Card */}
                            <div className="rounded-xl border-2 border-[#393E46] p-8 flex flex-col bg-white">
                                <h3 className="text-xl font-semibold mb-6 text-[#00ADB5]">
                                    User Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-[#EEEEEE] rounded">
                                        <span className="font-semibold text-[#393E46]">Email:</span>
                                        <span className="text-[#222831]">{protectedData.mail || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#EEEEEE] rounded">
                                        <span className="font-semibold text-[#393E46]">Name:</span>
                                        <span className="text-[#222831]">{protectedData.name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#EEEEEE] rounded">
                                        <span className="font-semibold text-[#393E46]">Quizzes Created:</span>
                                        <span className="text-[#00ADB5] font-bold">{createdQuizzes.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#EEEEEE] rounded">
                                        <span className="font-semibold text-[#393E46]">Quizzes Joined:</span>
                                        <span className="text-[#00ADB5] font-bold">{joinedQuizzes.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Created Quizzes Card */}
                            <div className="rounded-xl border-2 border-[#393E46] p-8 flex flex-col bg-white">
                                <h3 className="text-xl font-semibold mb-6 text-[#00ADB5]">
                                    Created Quizzes
                                </h3>
                                {createdQuizzes.length > 0 ? (
                                    <div className="space-y-3">
                                        {createdQuizzes.slice(0, 5).map((quiz, index) => (

                                            <div key={index} id={quiz.id} className="p-3 bg-[#EEEEEE] rounded flex justify-between items-center cursor-pointer hover:bg-[#00ADB5]" onClick={(e) => { localStorage.setItem("codeQuiz", e.target.id); navigate("/qzinfo") }}>

                                                <span className="text-[#222831] font-medium">{quiz.title}</span>
                                                <span className="text-sm text-[#393E46]">{(quiz.closed) ? "active" : "closed"}</span>
                                                <span className="text-sm text-[#393E46]">Quiz #{index + 1}</span>
                                            </div>
                                        ))}
                                        {createdQuizzes.length > 5 && (
                                            <div className="text-center text-sm text-[#393E46] mt-2">
                                                +{createdQuizzes.length - 5} more quizzes
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-[#393E46] py-8">
                                        <p className="mb-4">No quizzes created yet</p>
                                        <button
                                            onClick={() => navigate("/create-quiz")}
                                            className="px-6 py-2 rounded font-semibold transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
                                        >
                                            Create Your First Quiz
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quiz Results Section */}
                        {joinedQuizzes.length > 0 && (
                            <div className="mt-8 rounded-xl border-2 border-[#393E46] p-8 bg-white">
                                <h3 className="text-xl font-semibold mb-6 text-[#00ADB5]">
                                    Recent Quiz Results
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {joinedQuizzes.slice(0, 6).map((result, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-[#EEEEEE] rounded-xl border border-[#393E46] cursor-pointer hover:bg-[#7fe2e8]"
                                            onClick={() => {
                                                // Fixed: Use correct property names and values
                                                localStorage.setItem("idQZ", result.quiz_id); // Set quiz_id, not result.id
                                                localStorage.setItem("qId", result.id);       // Set result.id for the quiz result
                                                navigate("/qzanalysis");
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-[#393E46]">
                                                    {result.quiz_title}
                                                </span>
                                                <span className="text-lg font-bold text-[#00ADB5]">
                                                    {result.score}/{result.total_questions}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-[#222831]">
                                                    {result.points} pts
                                                </span>
                                            </div>
                                            {/* Progress bar for score */}
                                            <div className="mt-3">
                                                <div className="w-full bg-[#393E46] rounded-full h-2">
                                                    <div
                                                        className="bg-[#00ADB5] h-2 rounded-full transition-all"
                                                        style={{ width: `${(result.score / result.total_questions) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs text-center mt-1 text-[#393E46]">
                                                    {Math.round((result.score / result.total_questions) * 100)}% Score
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                                {joinedQuizzes.length > 6 && (
                                    <div className="text-center text-sm text-[#393E46] mt-4">
                                        Showing 6 of {joinedQuizzes.length} quiz results
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty state for quiz results */}
                        {joinedQuizzes.length === 0 && (
                            <div className="mt-8 rounded-xl border-2 border-[#393E46] p-8 bg-white text-center">
                                <h3 className="text-xl font-semibold mb-4 text-[#00ADB5]">
                                    No Quiz Results Yet
                                </h3>
                                <p className="text-[#222831] mb-4">
                                    You haven't joined any quizzes yet. Start your learning journey!
                                </p>
                                <button
                                    onClick={() => navigate("/join-quiz")}
                                    className="px-6 py-3 rounded-xl font-semibold transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
                                >
                                    Join a Quiz
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
