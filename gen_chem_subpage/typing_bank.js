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
    // JSON 
    // ==============================

    // 3.1 Load index.json on page load
    async function loadIndex() {
        const res = await fetch("sets_bank/index.json")
        if (!res.ok) throw new Error(`Failed to load index.json (${res.status})`);
        return await res.json();
    }
    
    // 3.2 
    // Runs once when page loads
    async function init(){
        try {
            indexData = await loadIndex();

            const setRes = await fetch(`sets_bank/${firstSet.file}`);
            if (!setRes.ok) {
                throw new Error(`Failed to load set file (${setRes.status})`);

            }
            activateSetData = await setRes.json();

            console.log("Active set data:", activeSetData);
            
        } catch (err) {
            questionDisplay.textContent = "Failed to load study sets.";
            console.error(err)
            return;
        }
    }

});

// ==============================
// JSON 
// ==============================

