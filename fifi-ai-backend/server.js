// server.js

// 1. Import necessary packages
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cors = require('cors');

// 2. Configure API Key
// WARNING: Storing your API key directly in the code is not secure.
const GEMINI_API_KEY = "";

// 3. Initialize Express app and middleware
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Middleware to enable Cross-Origin Resource Sharing

// 4. Initialize the Google Gemini AI Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 5. Define the main API endpoint
app.post('/generate', async (req, res) => {
    try {
        const { topic, mode } = req.body;

        if (!topic || !mode) {
            return res.status(400).json({ error: 'Topic and mode are required.' });
        }

        // --- PROMPT ---
        const flexiblePrompt = `
            You are a highly intelligent and helpful AI assistant. Your primary goal is to provide accurate, clear, and relevant information based on the user's request.

            **Analyze the User's Request Carefully:**
            - Pay close attention to the user's "Topic". Look for keywords that indicate the desired length and depth of the answer (e.g., "explain in detail," "summarize," "what is," "list," "2 marks," "in short").
            - Your response should directly address the user's query. If they ask for a short answer, provide one. If they ask for a detailed explanation, provide that.

            **User's Request:**
            - **Topic:** "${topic}"
            - **Learning Mode:** "${mode}"

            **Task:**
            Based on the user's request, generate an appropriate response.

            - If the **Learning Mode** is "Theory", focus on providing definitions, concepts, explanations, and factual information.
            - If the **Learning Mode** is "Practical", focus on providing step-by-step instructions, code examples, real-world applications, or actionable advice.

            **Formatting:**
            - Use Markdown for clear formatting (headings, bold, lists, etc.) where it enhances readability.
            - Respond directly to the user's query without any unnecessary introductions.
        `;

        // 6. Call the Gemini API with Safety Settings
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-pro', // lastest model
            safetySettings,
        });

        const result = await model.generateContent(flexiblePrompt);
        const response = await result.response;

        if (response.promptFeedback && response.promptFeedback.blockReason) {
            return res.status(400).json({
                error: 'Your request was blocked because it violates the safety policy. Please use respectful language and ask about appropriate educational topics.',
            });
        }
        
        const text = response.text();
        console.log(text);

        // 7. Send the response back to the client
        res.json({
            message: 'Content generated successfully!',
            content: text
        });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate content from AI.' });
    }
});

// 8. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
