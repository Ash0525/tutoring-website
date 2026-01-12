// 1.1 Set and mode
let activeSetId;;
let activeSetFile;
let mode;

// 1.2 Loaded content state

// 1.3 Session navigation state
let questionOrder = [];
let cursor = 0;

// 1.4 Interaction state (per current question only)
let hasSubmitted = false;

// 1.5 Derived behavior