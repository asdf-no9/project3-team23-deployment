const { GoogleGenerativeAI } = require('@google/generative-ai');
const API_KEY = process.env.VITE_GEMINI_API_KEY; 

//Initialize AI model
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function translateText(text, targetLanguage) {
    try {
        const prompt = `You are simply a translator, translate "${text}" to ${targetLanguage}. Just give the translation.`;
        const result = await model.generateContent(prompt);
        console.log("Gemini API Response:", result);
        const response = await result.response;
        console.log("Full Response Object:", response); // Added line
        const translatedText = response.text();
        return translatedText;
    } catch (error) {
        console.error('Gemini API translation error:', error);
        return null;
    }
}

module.exports = { translateText };