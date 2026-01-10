// For now, we will have variables that have very simple information regarding
// molecular compounds. Later we will move to a more complex structure.
console.log("flash_cards.js loaded");
// steady state variables
let isFrontShowing = true;
let currentCardIndex = 0;

// event listeners and elementIds
var flashcard = document.querySelector(".flashcard");
var frontElement = document.getElementById("front-flashcard");
var backElement = document.getElementById("back-flashcard");
var resetButton = document.getElementById("reset-button");

// array list
const flashCardsFront = [
    "B2H6", 
    "CH4", 
    "SiH4", 
    "NH3"
];
const flashCardsBack = [
  "Diborane",
  "Methane",
  "Silane",
  "Ammonia",
];

// important functions

// Render card reads the contents from the arrays and updates the flashcard display
function renderCard() {
  frontElement.innerText = flashCardsFront[currentCardIndex];
  backElement.innerText = flashCardsBack[currentCardIndex]; 
}

// Decrements currentCardIndex, warps if needed
function goToPrev() {
  currentCardIndex -= 1;

  if (currentCardIndex < 0) { // decrementer makes the index negative
    currentCardIndex = flashCardsFront.length - 1;  // so wrap around to end
  }
  
  showFront(); // ensure front is showing
  renderCard(); // updates display
  console.log("You are pressing previous") 
}

// Increments currentCardIndex, warps if needed 
function goToNext() {
  currentCardIndex += 1;

  if (currentCardIndex >= flashCardsFront.length) {
    currentCardIndex = 0;  // wrap around to start
  }

  showFront(); // ensure front is showing
  renderCard(); // updates display
  console.log("You are pressing next")
}

// brings user back to first flashcard
function resetFlashcards() {
  currentCardIndex = 0;
  showFront(); // ensure front is showing
  renderCard();
  console.log("You are pressing reset")
}

// Flips flashcard
function flipFlashcard() {
  flashcard.classList.toggle("flipped");
  isFrontShowing = !isFrontShowing;
}

// When going to next card, ensure front is showing
function showFront() {
  if (!isFrontShowing) {  // if back is currently shwoing
    flashcard.classList.remove("flipped");  
    isFrontShowing = true;
  }
}

// Register click handlers for flashcard
flashcard.addEventListener("click", flipFlashcard);



