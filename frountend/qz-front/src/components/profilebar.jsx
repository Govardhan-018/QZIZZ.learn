import React from "react";
import { useNavigate } from "react-router-dom";

function Profilebar({ user = {} }) { 
  const navigate = useNavigate();
  
  function handleProfile() {
    navigate("/profile");
  }
  
  // Better fallback logic
  const userInitial = user?.mail ? user.mail[0]?.toUpperCase() : "U";
  const displayName = user?.mail || "User";
  
  return (
    <div className="absolute top-6 right-6 flex items-center gap-2">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ADB5] text-[#EEEEEE] font-semibold shadow hover:bg-[#393E46] transition cursor-pointer"
        onClick={handleProfile}
      >
        <div className="w-8 h-8 rounded-full bg-[#393E46] flex items-center justify-center text-[#EEEEEE] font-bold border-2 border-[#00ADB5]">
          {userInitial}
        </div>
        {displayName}
      </button>
    </div>
  );
}

export default Profilebar;
