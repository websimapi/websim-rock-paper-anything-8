import { config } from './config.js';
import { chat } from "@websim/ai-features";

const initialSelectionDiv = document.getElementById('initial-selection');
const startGameButton = document.getElementById('start-game');
const startEmojiSelect = document.getElementById('start-emoji');
const gamePlayDiv = document.getElementById('game-play');
const currentEmojiDiv = document.getElementById('current-emoji');
const userGuessInput = document.getElementById('user-guess');
const submitGuessButton = document.getElementById('submit-guess');
const resultText = document.getElementById('result-text');
const explanationText = document.getElementById('explanation-text');
const resetGameButton = document.getElementById('reset-game');

let currentEmoji = '';
let conversationHistory = [];

// Populate emoji options
config.initialEmojis.forEach(emoji => {
    const option = document.createElement('option');
    option.value = emoji;
    // Simple naming for default emojis
    let name = '';
    switch (emoji) {
        case '✊': name = 'Rock'; break;
        case '📄': name = 'Paper'; break;
        case '✂️': name = 'Scissors'; break;
        case '🦎': name = 'Lizard'; break;
        case '🖖': name = 'Spock'; break;
        case '🔥': name = 'Fire'; break;
        case '💧': name = 'Water'; break;
        case '🌪️': name = 'Tornado'; break;
        default: name = 'Emoji';
    }
    option.textContent = `${emoji} ${name}`;
    // Remove default options first if they exist in config
    if (startEmojiSelect.querySelector(`option[value="${emoji}"]`)) {
       startEmojiSelect.removeChild(startEmojiSelect.querySelector(`option[value="${emoji}"]`));
    }
    startEmojiSelect.appendChild(option);
});

startGameButton.addEventListener('click', () => {
    currentEmoji = startEmojiSelect.value;
    currentEmojiDiv.textContent = currentEmoji;
    initialSelectionDiv.style.display = 'none';
    gamePlayDiv.style.display = 'block';
    resetGameButton.style.display = 'none'; // Hide reset button initially
    resultText.textContent = ''; // Clear previous results
    explanationText.textContent = '';
    userGuessInput.value = ''; // Clear input
    conversationHistory = []; // Reset conversation history for new game
});

submitGuessButton.addEventListener('click', handleGuess);
userGuessInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleGuess();
    }
});


async function handleGuess() {
    const userGuess = userGuessInput.value.trim();
    if (!userGuess) {
        resultText.textContent = "Please enter something to challenge the emoji!";
        explanationText.textContent = "";
        return;
    }

    submitGuessButton.disabled = true;
    userGuessInput.disabled = true;
    resultText.textContent = "Thinking...";
    explanationText.textContent = "";

    try {
        const prompt = `The current emoji is ${currentEmoji}. The user challenges it with "${userGuess}". Determine if the user's challenge beats the current emoji in a creative, rock-paper-scissors style logic. Respond ONLY with JSON following this schema:
        {
          "beats": boolean, // true if user's guess beats the current emoji, false otherwise
          "new_emoji": string, // the emoji representing the user's winning guess, or the original emoji if the user loses
          "explanation": string // a brief, fun explanation of why (e.g., "Giant laser melts rock!")
        }`;

        // Add user message to history
        conversationHistory.push({ role: "user", content: prompt });
        // Keep history short
        conversationHistory = conversationHistory.slice(-6);

        const completion = await chat.completions.create({
             messages: [
                 {
                     role: "system",
                     content: "You are a creative judge for a game called 'Rock Paper Anything'. You decide winners based on imaginative logic, like rock-paper-scissors but with anything. Respond strictly in the specified JSON format."
                 },
                 ...conversationHistory
             ],
             json: true,
         });

        const responseText = completion.content;
        conversationHistory.push({ role: "assistant", content: responseText }); // Add AI response to history

        try {
            const result = JSON.parse(responseText);

            if (result.beats) {
                resultText.textContent = `You win! "${userGuess}" beats ${currentEmoji}!`;
                currentEmoji = result.new_emoji; // Update current emoji
                currentEmojiDiv.textContent = currentEmoji;
            } else {
                resultText.textContent = `You lose! ${currentEmoji} withstands "${userGuess}"!`;
                 // Emoji stays the same
            }
            explanationText.textContent = result.explanation;
            userGuessInput.value = ''; // Clear input for next round
             resetGameButton.style.display = 'block'; // Show reset button after a round

        } catch (e) {
             console.error("Error parsing LLM response:", e);
             resultText.textContent = "Error processing the result. Try again!";
             explanationText.textContent = `Raw response: ${responseText}`;
        }

    } catch (error) {
        console.error("Error fetching LLM completion:", error);
        resultText.textContent = "An error occurred. Please try again.";
        explanationText.textContent = "";
    } finally {
        submitGuessButton.disabled = false;
        userGuessInput.disabled = false;
        userGuessInput.focus(); // Set focus back to input
    }
}

resetGameButton.addEventListener('click', () => {
    gamePlayDiv.style.display = 'none';
    initialSelectionDiv.style.display = 'block';
    // No need to clear emoji options, they are static
});
`````` index.html
<!DOCTYPE html>
<html>
<head>
    <title>Rock Paper Anything</title>
    <link rel="stylesheet" href="style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
</head>
<body>
    <div id="game-container">
        <h1>Rock Paper Anything</h1>

        <div id="initial-selection">
            <label for="start-emoji">Choose your starting emoji:</label>
            <select id="start-emoji">
                <!-- Options will be populated by JS -->
            </select>
            <button id="start-game">Start Game</button>
        </div>

        <div id="game-play" style="display: none;">
            <div id="current-emoji-display">
                <h2>Current Emoji:</h2>
                <div id="current-emoji"></div>
            </div>

            <div id="user-input">
                <label for="user-guess">Enter your challenge:</label>
                <input type="text" id="user-guess" placeholder="e.g., 'a giant laser'">
                <button id="submit-guess">Fight!</button>
            </div>

            <div id="result-display">
                <h2>Result:</h2>
                <p id="result-text"></p>
                 <p id="explanation-text"></p>
            </div>
             <button id="reset-game" style="display: none;">Play Again?</button>
        </div>
    </div>

    <script type="importmap">
      {
        "imports": {
          "@websim/ai-features": "https://unpkg.com/@websim/ai-features@0.0.10/dist/websim-ai-features.js"
        }
      }
    </script>
    <script src="config.js"></script>
    <script type="module" src="script.js"></script>
</body>
</html>

import { config } from './config.js';
import { chat } from "@websim/ai-features";

// DOM Elements
const initialSelectionDiv = document.getElementById('initial-selection');
const startGameButton = document.getElementById('start-game');
const startEmojiSelect = document.getElementById('start-emoji');
const gamePlayDiv = document.getElementById('game-play');
const currentEmojiDiv = document.getElementById('current-emoji');
const userGuessInput = document.getElementById('user-guess');
const submitGuessButton = document.getElementById('submit-guess');
const resultText = document.getElementById('result-text');
const explanationText = document.getElementById('explanation-text');
const resetGameButton = document.getElementById('reset-game');

// Game State
let currentEmoji = '';
let conversationHistory = [];
let isProcessing = false; // Flag to prevent multiple submissions

// --- Initialization ---

function populateEmojiOptions() {
    startEmojiSelect.innerHTML = ''; // Clear existing options
    config.initialEmojis.forEach(item => {
        const option = document.createElement('option');
        option.value = item.emoji;
        option.textContent = `${item.emoji} ${item.name}`;
        startEmojiSelect.appendChild(option);
    });
}

// --- Game Logic ---

function startGame() {
    currentEmoji = startEmojiSelect.value;
    currentEmojiDiv.textContent = currentEmoji;
    initialSelectionDiv.style.display = 'none';
    gamePlayDiv.style.display = 'block';
    resetGameButton.style.display = 'none';
    resultText.textContent = '';
    explanationText.textContent = '';
    userGuessInput.value = '';
    conversationHistory = []; // Reset history for a new game
    userGuessInput.focus();
}

async function handleGuess() {
    if (isProcessing) return; // Prevent concurrent calls

    const userGuess = userGuessInput.value.trim();
    if (!userGuess) {
        resultText.textContent = "Come on, challenge the emoji with something!";
        explanationText.textContent = "";
        return;
    }

    isProcessing = true;
    setLoadingState(true);

    try {
        const userMessage = {
            role: "user",
            content: `Current Emoji: ${currentEmoji}\nUser Challenge: "${userGuess}"\n\nDetermine the outcome according to the rules.`
        };

        // Add user message to history and truncate if necessary
        conversationHistory.push(userMessage);
        if (conversationHistory.length > config.maxHistoryLength) {
            conversationHistory = conversationHistory.slice(-config.maxHistoryLength);
        }

        const completion = await chat.completions.create({
            messages: [
                { role: "system", content: config.systemPrompt },
                ...conversationHistory
            ],
            json: true,
        });

        const responseContent = completion.content;

        // Add assistant response to history
        conversationHistory.push({ role: "assistant", content: responseContent });
         if (conversationHistory.length > config.maxHistoryLength) {
            conversationHistory = conversationHistory.slice(-config.maxHistoryLength);
        }


        try {
            const result = JSON.parse(responseContent);
            updateUIWithResult(result, userGuess);
        } catch (parseError) {
            console.error("Error parsing LLM JSON response:", parseError, "\nRaw response:", responseContent);
            resultText.textContent = "Oops! The judge got confused. Try again!";
            explanationText.textContent = `(Error: Could not understand the response)`;
        }

    } catch (error) {
        console.error("Error fetching LLM completion:", error);
        resultText.textContent = "Connection error! Could not reach the judge. Please try again.";
        explanationText.textContent = "";
         // Optionally remove the last user message from history if the API call failed
         if (conversationHistory[conversationHistory.length - 1]?.role === "user") {
            conversationHistory.pop();
        }
    } finally {
        setLoadingState(false);
        isProcessing = false;
    }
}

function updateUIWithResult(result, userGuess) {
    if (typeof result.beats !== 'boolean' || typeof result.new_emoji !== 'string' || typeof result.explanation !== 'string' || result.new_emoji.length === 0) {
         console.error("Invalid JSON structure received:", result);
         resultText.textContent = "Oops! The judge gave a weird answer. Try again!";
         explanationText.textContent = `(Error: Invalid result format)`;
         return;
    }

    if (result.beats) {
        resultText.textContent = `You win! "${userGuess}" (${result.new_emoji}) beats ${currentEmoji}!`;
        currentEmoji = result.new_emoji; // Update current emoji only on win
        currentEmojiDiv.textContent = currentEmoji;
    } else {
        resultText.textContent = `You lose/tie! ${currentEmoji} withstands "${userGuess}"!`;
        // Keep the current emoji: result.new_emoji should match currentEmoji in this case per prompt
        currentEmojiDiv.textContent = currentEmoji; // Ensure display is correct
    }
    explanationText.textContent = result.explanation;
    userGuessInput.value = ''; // Clear input for next round
    resetGameButton.style.display = 'inline-block'; // Show reset button after a round
}


function setLoadingState(isLoading) {
    if (isLoading) {
        submitGuessButton.disabled = true;
        userGuessInput.disabled = true;
        resultText.textContent = "Judging...";
        explanationText.textContent = "";
        currentEmojiDiv.style.opacity = 0.5;
    } else {
        submitGuessButton.disabled = false;
        userGuessInput.disabled = false;
        currentEmojiDiv.style.opacity = 1;
        userGuessInput.focus();
    }
}

function resetGame() {
    gamePlayDiv.style.display = 'none';
    initialSelectionDiv.style.display = 'block';
    populateEmojiOptions(); // Repopulate in case config changes (though unlikely here)
}

// --- Event Listeners ---

startGameButton.addEventListener('click', startGame);
submitGuessButton.addEventListener('click', handleGuess);
userGuessInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleGuess();
    }
});
resetGameButton.addEventListener('click', resetGame);

// --- Initial Setup ---
populateEmojiOptions();

