console.log("typing_log.js loaded")
// ==============================
// STATE
// ==============================

// 1.1 Set and mode
let activeSetId;;
let activeSetFile;
let mode;
let indexData = null;   // holds parsed sets_bank/index.json
let activeSetData = null;   // holds parsed sets_bank/<set>.json

// 1.2 Loaded content state

// 1.3 Session navigation state
let questionOrder = [];
let cursor = 0;

// 1.4 Interaction state (per current question only)
let hasSubmitted = false;

// ==============================
// DOM REFERENCES
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    // 2.1 Getting element ids
    const questionDisplay = document.getElementById("question-display")
    const feedbackDisplay = document.getElementById("feedback-display")
    const answerForm = document.getElementById("answer-form")
    const answerInput = document.getElementById("answer-input")
    const submitAnswer = document.getElementById("submit-answer")
    const prevQuestion = document.getElementById("prev-question")
    const nextQuestion = document.getElementById("next-question")
    const setSelector = document.getElementById("set-selector")

    // 2.2 Getting classes
    const setOption = document.querySelectorAll(".set-option")
    const navigationControls = document.querySelector(".navigation-controls")

    // ==============================
    // FUNCTIONS
    // ==============================

    // 3.1.1 Load index.json on page load
    async function loadIndex() {
        const res = await fetch("sets_bank/index.json")
        if (!res.ok) throw new Error(`Failed to load index.json (${res.status})`);
        return await res.json();
    }
    
    // 3.1.2 INitialization function
    async function init(){
        console.log("init() started")
        try {
            indexData = await loadIndex();
            const firstSet = indexData.sets[0];

            const setRes = await fetch(`sets_bank/${firstSet.file}`);
            if (!setRes.ok) {
                throw new Error(`Failed to load set file (${setRes.status})`);

            }
            activeSetData = await setRes.json();
            renderQuestion();

            console.log("airs is:", activeSetData.pairs[0]);

        } catch (err) {
            questionDisplay.textContent = "Failed to load study sets.";
            console.error(err)
            return;
        }
    }

    // 3.1.3 Load the question
    function renderQuestion() {
        console.log("renderQuestion initiated")
        const pair = activeSetData.pairs[cursor];

        questionDisplay.textContent = pair.formula;
        answerInput.value = "";
    }

    // 3.1.4 Normalize the input
    function normalizeInput(userInput) {
        userInput = userInput.trim().toLowerCase()
        return userInput;
    }

    // 3.1.5 Check answer function
    function checkAnswer() {
        console.log("checkedAnswer initiated")
        const pair = activeSetData.pairs[cursor];
        const userInput = answerInput.value;

        let normalizedInput = normalizeInput(userInput);

        // iterate through the list (in case we have another name for the same ion)
        const isCorrect = pair.names.some(name => {
            return normalizeInput(name) === normalizedInput;
        });

        // is user input correct?
        const displayStatement = isCorrect 
            ? "Yay! Correct!" 
            : "Incorrect, try again."

        feedbackDisplay.textContent = displayStatement;

        // what happens if isCorrect == true?
        if (isCorrect) {
            // Increment cursor, modulo with length of pairs list
            cursor = (cursor + 1) % activeSetData.pairs.length; 

            // call for next question
            renderQuestion();
        } else {
            console.log("User got it wrong, they have to attempt again.")
        }
    }

    // ==============================
    // EVENT LISTENERS
    // ==============================

    // 3.2.1 Listen for when user presses submit to submit answer
    answerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        checkAnswer();
    })

    init();

});

// ==============================
// JSON 
// ==============================

