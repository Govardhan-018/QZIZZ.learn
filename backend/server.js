import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import schedile from "node-schedule";
import cron from "node-cron";


dotenv.config();

const requiredEnv = [
    "PORT",
    "SESSION_SECRET",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENROUTER_API_KEY"
];

for (const k of requiredEnv) {
    if (!process.env[k]) {
        console.error(`Missing env var: ${k}`);
        process.exit(1);
    }
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3939",
    "https://qzizzlearn.vercel.app",
    "https://qzizz-backend.onrender.com",
    /\.vercel\.app$/,
  ],
  credentials: true,
}));



app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        proxy: true, // Added for production behind proxy (Render)
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function issueJwt(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Hourly cleanup job - removes quizzes older than 1 hour
cron.schedule('0 * * * *', async () => {
    console.log('Running hourly quiz cleanup...');

    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from("activeQuizes")
            .update({ closed: true })
            .lt("crt_tm", oneHourAgo)
            .select();

        if (error) {
            console.error("Error updating quizzes:", error);
        }

    } catch (e) {
        console.error('❌ Error in quiz cleanup job:', e);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const claims = jwt.verify(token, process.env.JWT_SECRET);
        req.user = claims;
        next();
    } catch (e) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}

// Configure Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            proxy: true, // Added for correct callback handling behind proxy
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log("Google profile received:", profile); // Debug log

                const email =
                    profile.emails && profile.emails.length ? profile.emails[0].value : null;
                const name = profile.displayName || "";

                if (!email) {
                    console.error("No email in Google profile"); // Debug log
                    return done(new Error("No email returned by Google profile"));
                }

                const { data: existing, error: selErr } = await supabase
                    .from("userinfo")
                    .select("*")
                    .eq("mail", email)
                    .maybeSingle();

                if (selErr) {
                    console.error("Database error during user lookup:", selErr);
                    return done(selErr);
                }

                let dbUser = existing;

                // If user doesn't exist, create new user
                if (!existing) {
                    const { data: inserted, error: insErr } = await supabase
                        .from("userinfo")
                        .insert([
                            {
                                mail: email,
                                name: name,
                                pass: "google-auth",
                                accr_tm: new Date().toISOString(),
                                lstlogin_tm: new Date().toISOString(),
                            },
                        ])
                        .select()
                        .single();

                    if (insErr) {
                        console.error("Database error during user creation:", insErr);
                        return done(insErr);
                    }
                    dbUser = inserted;
                } else {
                    const { error: updateErr } = await supabase
                        .from("userinfo")
                        .update({ lstlogin_tm: new Date().toISOString() })
                        .eq("mail", email);

                    if (updateErr) {
                        console.error("Database error during login update:", updateErr);
                    }
                }

                return done(null, {
                    appUserId: dbUser.id,
                    appUserMail: dbUser.mail,
                    name: dbUser.name,
                });
            } catch (e) {
                console.error("Detailed Google OAuth error:", e); // Enhanced logging
                return done(e);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Routes
app.get("/", (req, res) => {
    res.json({ ok: true, message: "Auth server running" });
});

// Local signup
app.post("/signup", async (req, res) => {
    try {
        const { mail, pass } = req.body;
        const name = mail.split("@")[0];
        if (!mail || !pass) {
            return res.status(400).json({ error: "mail and pass required" });
        }

        // Check if user already exists
        const { data: existing, error: selErr } = await supabase
            .from("userinfo")
            .select("*")
            .eq("mail", mail)
            .maybeSingle();

        if (selErr) {
            console.error("Database error during signup lookup:", selErr);
            return res.status(500).json({ error: "Database error" });
        }

        if (existing) {
            return res.status(409).json({ error: "User already exists" });
        }

        // Hash password
        const hashed = await bcrypt.hash(pass, 12);

        // Create new user
        const { data: inserted, error: insErr } = await supabase
            .from("userinfo")
            .insert([
                {
                    mail,
                    name: name || "",
                    pass: hashed,
                    accr_tm: new Date().toISOString(),
                    lstlogin_tm: new Date().toISOString(),
                },
            ])
            .select()
            .single();

        if (insErr) {
            console.error("Database error during signup:", insErr);
            return res.status(500).json({ error: "Failed to create user" });
        }

        const token = issueJwt({ id: inserted.id, mail: inserted.mail });
        return res.json({
            ok: true,
            token,
            user: { id: inserted.id, mail: inserted.mail, name: inserted.name }
        });
    } catch (e) {
        console.error("Signup error:", e);
        return res.status(500).json({ error: "Signup failed" });
    }
});

// Local login
app.post("/login", async (req, res) => {
    try {
        const { mail, pass } = req.body;
        if (!mail || !pass) {
            return res.status(400).json({ error: "mail and pass required" });
        }

        // Find user
        const { data: user, error: selErr } = await supabase
            .from("userinfo")
            .select("*")
            .eq("mail", mail)
            .maybeSingle();

        if (selErr) {
            console.error("Database error during login:", selErr);
            return res.status(500).json({ error: "Database error" });
        }

        if (!user || !user.pass) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(pass, user.pass);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login time
        const { error: updateErr } = await supabase
            .from("userinfo")
            .update({ lstlogin_tm: new Date().toISOString() })
            .eq("id", user.id);

        if (updateErr) {
            console.error("Error updating last login:", updateErr);
            // Don't fail login for this error
        }

        const token = issueJwt({ id: user.id, mail: user.mail });
        return res.json({
            ok: true,
            token,
            user: { id: user.id, mail: user.mail, name: user.name }
        });
    } catch (e) {
        console.error("Login error:", e);
        return res.status(500).json({ error: "Login failed" });
    }
});

// Google OAuth routes
app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: true
    })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("=== OAUTH CALLBACK DEBUG ===");
    console.log("Query params:", req.query);
    console.log("Session before auth:", req.session);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
    });
    next();
  },
  (req, res, next) => {
    passport.authenticate("google", {
      failureRedirect: "/auth/failure",
      session: true,
    })(req, res, (err) => {
      if (err) {
        console.error("Passport authenticate error:", err);
        return res.redirect("https://qzizzlearn.vercel.app/?error=auth_error");
      }
      next();
    });
  },
  (req, res) => {
    try {
      console.log("=== AUTH SUCCESS ===");
      console.log("User:", req.user);
      console.log("Session after auth:", req.session);
      
      const user = req.user;
      if (!user || !user.appUserId || !user.appUserMail) {
        console.error("User identity not resolved:", user);
        return res.redirect("https://qzizzlearn.vercel.app/?error=auth_failed");
      }

      const token = issueJwt({ id: user.appUserId, mail: user.appUserMail });
      res.redirect(`https://qzizzlearn.vercel.app/?token=${token}&ok=true`);
    } catch (e) {
      console.error("Error in Google callback:", e);
      res.redirect("https://qzizzlearn.vercel.app/?error=callback_failed");
    }
  }
);


// Auth failure route
app.get("/auth/failure", (req, res) => {
    res.redirect("https://qzizz-backend.onrender.com/?error=google_auth_failed");
});

// Protected route
app.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: "This is protected", user: req.user });
});

// Logout
app.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Logout failed" });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
                return res.status(500).json({ error: "Session cleanup failed" });
            }
            res.json({ ok: true });
        });
    });
});

app.post("/create-quiz", authenticateToken, async (req, res) => {
    const { title, questions } = req.body;

    let messages = [
        {
            role: "system",
            content: "You are a quiz creator. Respond with only valid JSON."
        },
        {
            role: "user",
            content: `Create a ${questions} question quiz about "${title}". 

Respond with this exact JSON format:
{
  "validity": "valid",
  "title": "${title}",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
    }
  ],
  "answers": [
    {"id": 1, "correct_option": "A"}
  ]
}

If inappropriate content, set validity to "invalid".`
        }
    ];

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: messages,
            }),
        });

        const responseData = await response.json();
        const content = responseData.choices[0].message.content;

        // Clean and parse JSON
        let cleanContent = content.replace(/``````/g, '').trim();

        // Additional cleaning for common AI response issues
        cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

        const quizData = JSON.parse(cleanContent);

        // Check validity
        if (quizData.validity === "invalid") {
            return res.status(400).json({
                ok: false,
                error: "Invalid content"
            });
        }

        try {
            const { data, error } = await supabase
                .from("activeQuizes")
                .insert({
                    title: quizData.title,
                    created_mail: req.user.mail,
                    questions: quizData.questions,
                    answers: quizData.answers,
                    joined_ppl: [],
                    completed_ppl: [],
                    closed: false,
                    crt_tm: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase insert error:", error);
                return res.status(500).json({
                    ok: false,
                    error: "Database insert failed"
                });
            }
            return res.status(201).json({
                ok: true,
                quizCode: data.id
            });

        } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).json({
                ok: false,
                error: "Database operation failed"
            });
        }

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            ok: false,
            error: "Quiz creation failed"
        });
    }
});

app.post("/close-quiz", authenticateToken, async (req, res) => {
    const { quizCode } = req.body;

    if (!quizCode) {
        return res.status(400).json({ ok: false, error: "quizCode required" });
    }

    try {
        // First, close the quiz
        const { data, error } = await supabase
            .from("activeQuizes")
            .update({ closed: true })
            .eq("id", parseInt(quizCode))
            .eq("created_mail", req.user.mail)
            .select();

        if (error) {
            console.error("Database update error:", error);
            return res.status(500).json({ ok: false, error: "Failed to close quiz" });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ ok: false, error: "Quiz not found or unauthorized" });
        }

        // Now fetch the quiz data to update positions
        const { data: qzdata, error: qzerror } = await supabase // Fixed: qzdata, qzerror instead of destructuring incorrectly
            .from("activeQuizes")
            .select("*")
            .eq("id", parseInt(quizCode))
            .single();

        if (qzerror) {
            console.error("Error fetching quiz data:", qzerror);
            return res.status(500).json({ ok: false, error: "Failed to fetch quiz data for ranking" });
        }

        if (qzdata && qzdata.completed_ppl) {
            const temp = qzdata.completed_ppl;

            // Check if temp is an array and has elements
            if (Array.isArray(temp) && temp.length > 0) {
                // Sort by score (highest first) and assign positions
                let sorted = [...temp]
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => ({
                        ...player,
                        position: index + 1,
                    }));

                // Update the quiz with sorted positions
                const { data: updateData, error: updateError } = await supabase // Fixed: updata -> update, proper destructuring
                    .from("activeQuizes")
                    .update({ completed_ppl: sorted })
                    .eq("id", parseInt(quizCode))
                    .select();

                if (updateError) {
                    console.error("Error updating positions:", updateError);
                    return res.status(500).json({
                        ok: false,
                        error: "Quiz closed but failed to update positions"
                    });
                }

            }
        }

        return res.json({
            ok: true,
            message: "Quiz closed successfully",
            ranked: qzdata?.completed_ppl?.length > 0
        });

    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({ ok: false, error: "Failed to close quiz" });
    }
});


app.post("/join-quiz", authenticateToken, async (req, res) => {
    const { quizCode } = req.body;

    if (!quizCode) {
        return res.status(400).json({ ok: false, error: "quizCode required" });
    }

    try {
        // Fix: Select both 'id' and 'joined_ppl' columns
        const { data: quiz, error } = await supabase
            .from('activeQuizes')
            .select('id, joined_ppl')  // Add joined_ppl here
            .eq('id', quizCode)
            .eq('closed', false) // Ensure quiz is not closed
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!quiz) {
            return res.status(404).json({ ok: false, error: "Quiz not found" });
        }

        // Handle joined_ppl safely
        let joinedPpl = [];
        if (quiz.joined_ppl) {
            joinedPpl = Array.isArray(quiz.joined_ppl) ? [...quiz.joined_ppl] : [];
        }

        // Only update if user is not already in the list
        // Only update if user is not already in the list
        if (!joinedPpl.includes(req.user.id)) {
            joinedPpl.push(req.user.id);

            const { data, error: updErr } = await supabase
                .from("activeQuizes")
                .update({ joined_ppl: joinedPpl })  // ✅ Fixed syntax
                .eq("id", quizCode)
                .select();

            if (updErr) {
                console.error("Database update error:", updErr);
                return res.status(500).json({ ok: false, error: "Failed to join quiz" });
            }

        }


        return res.json({ ok: true });

    } catch (error) {
        console.error("Error in join-quiz:", error);
        return res.status(500).json({ ok: false, error: "Failed to join quiz" });
    }
});

app.post("/quiz", authenticateToken, async (req, res) => {
    const { quizCode } = req.body;
    if (!quizCode) {
        return res.status(400).json({ ok: false, error: "quizCode required" });
    }
    try {
        const { data: quiz, error } = await supabase
            .from("activeQuizes")
            .select("*")
            .eq("id", quizCode)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!quiz) {
            return res.status(404).json({ ok: false, error: "Quiz not found" });
        }

        return res.json({
            ok: true,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                questions: quiz.questions
            }
        });

    } catch (e) {
        console.error("Error fetching quiz:", e);
        return res.status(500).json({ ok: false, error: "Failed to fetch quiz" });
    }
});

app.post("/submit-ans", authenticateToken, async (req, res) => {
    const { quizCode, answers, startTime, endTime } = req.body;

    if (!quizCode || !answers) {
        return res.status(400).json({ ok: false, error: "quizCode and answers required" });
    }

    try {
        const { data: quiz, error } = await supabase
            .from("activeQuizes")
            .select("*")
            .eq("id", quizCode)
            .eq("closed", false) // Ensure quiz is not closed
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!quiz) {
            return res.status(404).json({ ok: false, error: "Quiz not found" });
        }


        // Calculate time taken (in seconds)
        let timeTaken = 0;
        if (startTime && endTime) {
            timeTaken = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
        }

        // Create answer key - handle both possible structures
        const answerKey = {};

        if (Array.isArray(quiz.answers)) {
            // If quiz.answers is array like [{"id": 1, "correct_option": "A"}, ...]
            for (const ans of quiz.answers) {
                answerKey[ans.id] = ans.correct_option;
            }
        } else if (typeof quiz.answers === 'object') {
            // If quiz.answers is object like {"1": "A", "2": "B", ...}
            Object.entries(quiz.answers).forEach(([id, option]) => {
                answerKey[parseInt(id)] = option;
            });
        }


        // Convert user answers object to iterable format
        const answersArray = Object.entries(answers).map(([questionId, answerData]) => ({
            id: parseInt(questionId),
            selected_option: answerData.option
        }));


        // Calculate correct answers
        let correctAnswers = 0;
        for (const userAns of answersArray) {
            if (answerKey[userAns.id] && answerKey[userAns.id] === userAns.selected_option) {
                correctAnswers++;
            }
        }

        const totalQuestions = Object.keys(answerKey).length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        const simplePoints = correctAnswers * 10;

        const timeBonus = timeTaken > 0 ? Math.max(0, 300 - timeTaken) : 0; // Max 5 min bonus
        const timeBonusPoints = simplePoints + Math.floor(timeBonus / 10);

        const percentagePoints = percentage + (timeTaken > 0 ? Math.max(0, (600 - timeTaken) / 10) : 0);

        const { data, error: insErr } = await supabase
            .from("quizResults")
            .insert([
                {
                    quiz_id: quizCode,
                    quiz_title: quiz.title,
                    user_mail: req.user.mail,
                    user_id: req.user.id,
                    score: correctAnswers,
                    total_questions: totalQuestions,
                    points: simplePoints,
                    time_taken: timeTaken,
                    given_answer: answers,
                    submitted_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (insErr) {
            console.error("Database insert error:", insErr);
            return res.status(500).json({ ok: false, error: "Failed to record results" });
        }

        // First, get the current completed_ppl array
        const { data: quizz, error: fetchErr } = await supabase
            .from("activeQuizes")
            .select("completed_ppl")
            .eq("id", quizCode)
            .maybeSingle();

        if (fetchErr) {
            console.error("Error fetching quiz:", fetchErr);
            return res.status(500).json({ ok: false, error: "Database error" });
        }

        let completedPpl = Array.isArray(quizz.completed_ppl) ? quizz.completed_ppl : [];

        // Check if user already exists in completed list
        const userExists = completedPpl.some(user => user.id === req.user.id);

        if (!userExists) {
            completedPpl.push({
                id: req.user.id,
                name: req.user.mail, // Fixed: req.use.mail -> req.user.mail
                score: correctAnswers,
                position: 0
            });

            const { data: updateData, error: updErr } = await supabase
                .from("activeQuizes")
                .update({ completed_ppl: completedPpl })
                .eq("id", quizCode)
                .select();

            if (updErr) {
                console.error("Update error:", updErr);
                return res.status(500).json({ ok: false, error: "Failed to update completed users" });
            }

        }

        return res.json({
            ok: true,
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
            points: simplePoints,
            timeTaken: timeTaken,
        });

    } catch (e) {
        console.error("Error submitting answers:", e);
        return res.status(500).json({ ok: false, error: "Failed to submit answers" });
    }
});

app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from("userinfo")
            .select("id, mail, name, accr_tm, lstlogin_tm")
            .eq("id", req.user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!user) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }

        // Get quiz results
        const { data: results, error: resErr } = await supabase
            .from("quizResults")
            .select("*")
            .eq("user_id", req.user.id)
            .order("submitted_at", { ascending: false });
        if (resErr) {
            console.error("Error fetching quiz results:", resErr);
        }

        // Get created quizzes
        const { data: createdQuizzes, error: cqErr } = await supabase
            .from("activeQuizes")
            .select("*")
            .eq("created_mail", req.user.mail)
            .order("crt_tm", { ascending: false });
        if (cqErr) {
            console.error("Error fetching created quizzes:", cqErr);
        }

        // Attach data to user object to match frontend expectations
        user.joinedQuizes = results || [];        // Note: frontend uses "joinedQuizes"
        user.createdQuizes = createdQuizzes || []; // Note: frontend uses "createdQuizes"
        user.quizResults = results || [];

        return res.json({ ok: true, user });

    } catch (e) {
        console.error("Error fetching profile:", e);
        return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
    }
});


app.post("/qzinfo", authenticateToken, async (req, res) => {
    const { quizCode } = req.body;

    try {
        const { data, error } = await supabase
            .from("activeQuizes")
            .select("*")
            .eq("id", quizCode)
            .eq("created_mail", req.user.mail)
            .single();

        if (error || !data) {
            return res.status(500).json({ error: "Failed to get data" });
        }

        return res.status(200).json({ data });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/analysis", authenticateToken, async (req, res) => {
    const { quizCode, qid } = req.body;

    try {
        // Fetch quiz data - Add detailed logging
        const { data: qzdata, error: quizError } = await supabase
            .from("activeQuizes")
            .select("*")
            .eq("id", quizCode)
            .single();


        if (quizError) {
            console.error("Quiz fetch error:", quizError);
            return res.status(500).json({ error: `Failed to fetch quiz data: ${quizError.message}`, ok: false });
        }

        if (!qzdata) {

            return res.status(404).json({ error: "Quiz not found", ok: false });
        }


        if (!qzdata.closed) {
            return res.status(401).json({ error: "Quiz is currently running, wait for completion", ok: false });
        }

        // Fetch result data - Add detailed logging
        const { data: resdata, error: resultError } = await supabase
            .from("quizResults")
            .select("*")
            .eq("id", qid)
            .single();

        if (resultError) {
            console.error("Result fetch error:", resultError);
            return res.status(500).json({ error: `Failed to fetch result data: ${resultError.message}`, ok: false });
        }

        if (!resdata) {
            return res.status(404).json({ error: "Result not found", ok: false });
        }


        // Verify that the result belongs to the same quiz
        if (resdata.quiz_id !== parseInt(quizCode)) {
            return res.status(400).json({
                error: "Result does not belong to the specified quiz",
                ok: false
            });
        }

        // Parse JSON strings from database
        let parsedQuestions = [];
        let parsedAnswers = [];

        try {
            parsedQuestions = typeof qzdata.questions === 'string'
                ? JSON.parse(qzdata.questions)
                : qzdata.questions;

            parsedAnswers = typeof qzdata.answers === 'string'
                ? JSON.parse(qzdata.answers)
                : qzdata.answers;
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return res.status(500).json({ error: "Failed to parse quiz data", ok: false });
        }

        // Create combined quiz info object
        const quizInfo = {
            questions: parsedQuestions,
            answers: parsedAnswers,
            title: qzdata.title,
            created_time: qzdata.crt_tm
        };

        return res.status(200).json({
            quizInfo,
            resdata,
            ok: true
        });

    } catch (error) {
        console.error("Analysis endpoint error:", error);
        return res.status(500).json({ error: "Internal server error", ok: false });
    }
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
const port = Number(process.env.PORT) || 3939;
app.listen(port, () => {
    console.log(`Server is running`);
});

