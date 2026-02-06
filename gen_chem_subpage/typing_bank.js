console.log("typing_log.js loaded")
// ==============================
// STATE
// ==============================

// 1.1 Set and mode
let activeSetId;
let activeSetFile;
let direction = "formula_to_name"; // default direction
let isRandomMode = false;
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
    const questionDisplay = document.getElementById("question-display");
    const feedbackDisplay = document.getElementById("feedback-display");
    const answerForm = document.getElementById("answer-form");
    const answerInput = document.getElementById("answer-input");
    const submitAnswer = document.getElementById("submit-answer");
    const prevQuestion = document.getElementById("prev-question");
    const nextQuestion = document.getElementById("next-question");
    const setSelector = document.getElementById("set-selector");
    const showAnswerBtn = document.getElementById("show-answer");
    const showAnswerDisplay = document.getElementById("show-answer-display");

    // 2.2 Getting classes
    const navigationControls = document.querySelector(".navigation-controls");

    // 2.3 Getting mode radios (includes formula to name and random)
    const directionsRadios = document.querySelectorAll('input[name="direction"]');
    const randomToggle = document.getElementById('random-toggle');

    // ==============================
    // FUNCTIONS
    // ==============================

    // 3.1.1 Load index.json on page load
    async function loadIndex() {
        const res = await fetch("sets_bank/index.json")
        if (!res.ok) throw new Error(`Failed to load index.json (${res.status})`);
        return await res.json();
    }
    
    // 3.1.2 Initialization function
    async function init(){
        console.log("init() started")
        try {
            indexData = await loadIndex();

            // clear the set selector
            setSelector.innerHTML = "";

            for (const set of indexData.sets) {
                // create an option element in html. createElement creates a new DOM element
                const option = document.createElement("option");
                option.textContent = set.title;
                option.value = set.file;
                setSelector.appendChild(option);
            }

            const defaultFile = indexData.sets[0].file;
            setSelector.value = defaultFile;
            await loadSetByFile(defaultFile);

            // get first set (from a chosen set)
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

        // this is for safety
        if (!activeSetData) return;
        if (!Array.isArray(questionOrder) || questionOrder.length === 0) buildQuestionOrder();

        
        const pairIndex = questionOrder[cursor];
        const pair = activeSetData.pairs[pairIndex];

        if (direction === "formula_to_name") {
            questionDisplay.textContent = pair.formula;
            answerInput.placeholder = "Type the name...";
        } else if (direction === "name_to_formula") {
            questionDisplay.textContent = pair.names[0];
            answerInput.placeholder = "Type the formula...";
        } else {
            console.warn("Unknown direction:", direction);
            questionDisplay.textContent = pair.formula;
        }

        answerInput.value = "";
        showAnswerDisplay.textContent = "";
        clearShowAnswer();
    }

    // 3.1.4 Normalize the input
    function normalizeInput(userInput) {
        userInput = userInput.trim().toLowerCase()
        return userInput;
    }

    // this function builds the question order
    function buildQuestionOrder() {
        if (!activeSetData) return;

        // build array
        questionOrder = Array.from(
            { length: activeSetData.pairs.length},
            (_, i) => i
        );

        // random mode shuffle
        if (isRandomMode) {
            for (let i = questionOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
            }
        }

        // reset cursor
        cursor = 0;
    }

    // 3.1.5 Check answer function
    function checkAnswer() {
        console.log("checkAnswer initiated");

        const pairIndex = questionOrder[cursor];
        const pair = activeSetData.pairs[pairIndex];

        const userInput = answerInput.value;
        const normalizedInput = normalizeInput(userInput);

        let isCorrect = false;

        if (direction === "formula_to_name") {
            // user types a name, accept any alias in pair.names
            isCorrect = pair.names.some(name => normalizeInput(name) === normalizedInput);

        } else if (direction === "name_to_formula") {
            // user types the formula
            isCorrect = normalizeInput(pair.formula) === normalizedInput;

        } else {
            console.warn("Unknown direction:", direction);
        }

        feedbackDisplay.textContent = isCorrect ? "Yay! Correct!" : "Incorrect, try again.";

        if (isCorrect) {
            cursor = (cursor + 1) % questionOrder.length;
            renderQuestion();
        } else {
            console.log("User got it wrong, they have to attempt again.");
        }
    }

    function showAnswer() {

        // safety guards
        if (!activeSetData || questionOrder.length === 0) return;

        const pairIndex = questionOrder[cursor];
        const pair = activeSetData.pairs[pairIndex];

        let answerText = "";

        if (direction === "formula_to_name") {
            answerText = pair.names.join(", ");
        } else if (direction === "name_to_formula") {
            answerText = pair.formula;
        } else {
            console.warn("Unknown direction:", direction);
            return;
        }

        showAnswerDisplay.textContent = `Answer: ${answerText}`;
    }


    function nextButton() {
        // guard
        if (!activeSetData) return;
        
        // next button logic
        cursor = (cursor + 1) % questionOrder.length;

        // call question
        renderQuestion();
    }

    function prevButton() {
        // guard
        if (!activeSetData) return;

        // prev button logic
        cursor = (cursor - 1 + questionOrder.length) % questionOrder.length;

        // call question
        renderQuestion();
    }

    function clearShowAnswer() {
        if (showAnswerDisplay) showAnswerDisplay.textContent = "";
    }

    // for set selector. load the sets by file
    async function loadSetByFile(file) {
        const res = await fetch(`sets_bank/${file}`);
        if (!res.ok) {
            throw new Error(`Failed to load set file from (${res.status})`);
        }

        activeSetData = await res.json();
        buildQuestionOrder();

        cursor = 0;

        if (typeof feedbackDisplay !== "undefined" && feedbackDisplay) {
            feedbackDisplay.textContent = "";
        }

        renderQuestion();
    }



    // ==============================
    // EVENT LISTENERS
    // ==============================

    // 3.2.1 Listen for when user presses submit to submit answer
    answerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        checkAnswer();
    });

    showAnswerBtn.addEventListener("click", () => {
        showAnswer();
    });

    nextQuestion.addEventListener("click", () => {
        nextButton();
    });
    
    prevQuestion.addEventListener("click", () => {
        prevButton();
    });

    setSelector.addEventListener("change", async () => {
        const chosenFile = setSelector.value;
        await loadSetByFile(chosenFile);
    });

    directionsRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            direction = radio.value;
            console.log("Direction changed to:", direction);

            // optional: keep same order, or rebuild (especially useful in random mode)
            buildQuestionOrder();
            renderQuestion();
            clearShowAnswer();
        });
    });

    if (randomToggle) {
        randomToggle.addEventListener("change", () => {
            isRandomMode = randomToggle.checked;
            console.log("Random mode changed to:", isRandomMode);
            buildQuestionOrder();
            renderQuestion();
            clearShowAnswer();
        });
    } else {
        console.warn("Random toggle element not found.");
    }

    init();

});

// ==============================
// JSON 
// ==============================

