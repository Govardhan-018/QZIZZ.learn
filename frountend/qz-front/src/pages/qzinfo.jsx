import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Profilebar from "../components/profilebar";

function Qzinfo() {
    const [protectedData, setProtectedData] = useState({});
    const [error, setError] = useState("");
    const [quizCode, setQuizCode] = useState();
    const [data, setData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedQuizCode = localStorage.getItem("codeQuiz") || "";
        setQuizCode(storedQuizCode);

        if (!token) {
            setError("No token found, please log in.");
            navigate("/");
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
            .catch((err) => setError(err.message));

        // Second fetch - quiz info
        fetch(import.meta.env.VITE_QUIZ_INFO_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quizCode: storedQuizCode,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to get quiz info");
                }
                return res.json();
            })
            .then((responseData) => {
                console.log(responseData);
                setData(responseData.data); // Fixed: accessing the data property
                if (!responseData.data.closed) navigate("/close-quiz");
            })
            .catch((err) => {
                console.error("Quiz info error:", err);
                setError(err.message);
            });

    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center">
            <Navbar />
            <Profilebar user={protectedData} />
            
            {error && (
                <div className="text-red-500 mt-4 text-center font-semibold bg-red-50 p-4 rounded-xl border border-red-200 mx-4">
                    Error: {error}
                </div>
            )}

            {data && Object.keys(data).length > 0 ? (
                <div className="flex flex-1 w-full justify-center">
                    <div className="w-full max-w-6xl p-8 mx-4">
                        {/* Quiz Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-[#00ADB5] mb-2">
                                {data.title}
                            </h2>
                            <p className="text-lg text-[#393E46]">
                                Quiz #{data.id} • Created: {new Date(data.crt_tm).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="rounded-xl border-2 border-[#393E46] p-6 bg-white text-center">
                                <h3 className="text-lg font-semibold text-[#393E46] mb-2">Quiz Code</h3>
                                <div className="text-2xl font-bold text-[#00ADB5] bg-[#EEEEEE] p-3 rounded border border-[#393E46]">
                                    {quizCode}
                                </div>
                            </div>

                            <div className="rounded-xl border-2 border-[#393E46] p-6 bg-white text-center">
                                <h3 className="text-lg font-semibold text-[#393E46] mb-2">People Joined</h3>
                                <div className="text-3xl font-bold text-[#00ADB5]">
                                    {data.joined_ppl?.length || 0}
                                </div>
                            </div>

                            <div className="rounded-xl border-2 border-[#393E46] p-6 bg-white text-center">
                                <h3 className="text-lg font-semibold text-[#393E46] mb-2">Completed</h3>
                                <div className="text-3xl font-bold text-[#00ADB5]">
                                    {data.completed_ppl?.length || 0}
                                </div>
                            </div>
                        </div>

                        {/* Completion Progress */}
                        {data.joined_ppl?.length > 0 && (
                            <div className="rounded-xl border-2 border-[#393E46] p-6 bg-white mb-8">
                                <h3 className="text-xl font-semibold text-[#00ADB5] mb-4">Progress Overview</h3>
                                <div className="mb-2">
                                    <div className="flex justify-between text-sm text-[#393E46] mb-1">
                                        <span>Completion Rate</span>
                                        <span>
                                            {Math.round(((data.completed_ppl?.length || 0) / (data.joined_ppl?.length || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-[#393E46] rounded-full h-3">
                                        <div 
                                            className="bg-[#00ADB5] h-3 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: `${((data.completed_ppl?.length || 0) / (data.joined_ppl?.length || 1)) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Leaderboard */}
                        <div className="rounded-xl border-2 border-[#393E46] p-8 bg-white">
                            <h3 className="text-2xl font-bold text-[#00ADB5] mb-6 text-center">
                                🏆 Leaderboard
                            </h3>
                            
                            {data.completed_ppl && data.completed_ppl.length > 0 ? (
                                <div className="space-y-4">
                                    {data.completed_ppl
                                        .sort((a, b) => a.position - b.position)
                                        .map((ppl, index) => (
                                        <div 
                                            key={index} 
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                ppl.position === 1 
                                                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' 
                                                    : ppl.position === 2 
                                                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400'
                                                    : ppl.position === 3
                                                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400'
                                                    : 'bg-[#EEEEEE] border-[#393E46]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                                    ppl.position === 1 
                                                        ? 'bg-yellow-400 text-yellow-900' 
                                                        : ppl.position === 2 
                                                        ? 'bg-gray-400 text-gray-900'
                                                        : ppl.position === 3
                                                        ? 'bg-orange-400 text-orange-900'
                                                        : 'bg-[#393E46] text-[#EEEEEE]'
                                                }`}>
                                                    {ppl.position === 1 ? '🥇' : 
                                                     ppl.position === 2 ? '🥈' : 
                                                     ppl.position === 3 ? '🥉' : 
                                                     `#${ppl.position}`}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-[#222831]">
                                                        {ppl.name}
                                                    </h4>
                                                    <p className="text-sm text-[#393E46]">
                                                        Position #{ppl.position}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-[#00ADB5]">
                                                    {ppl.score}
                                                </div>
                                                <p className="text-sm text-[#393E46]">points</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <h4 className="text-xl font-semibold text-[#393E46] mb-2">
                                        No Completions Yet
                                    </h4>
                                    <p className="text-[#222831]">
                                        Participants are still working on the quiz. Check back later!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
                            <button 
                                onClick={() => navigate("/quiz-dashboard")}
                                className="px-6 py-3 rounded-xl font-semibold transition-colors bg-[#00ADB5] text-[#EEEEEE] hover:bg-[#393E46]"
                            >
                                Back to Dashboard
                            </button>
                            <button 
                                onClick={() => navigate("/home")}
                                className="px-6 py-3 rounded-xl font-semibold transition-colors bg-[#393E46] text-[#EEEEEE] hover:bg-[#00ADB5]"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center w-full">
                    <div className="text-center">
                        <div className="text-xl font-semibold text-[#00ADB5] mb-4">
                            Loading Quiz Information...
                        </div>
                        <div className="w-8 h-8 border-4 border-[#00ADB5] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Qzinfo;
