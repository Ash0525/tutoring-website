// About page scroll reveal
const revealCards = document.querySelectorAll(".reveal-card");

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
        } else {
            entry.target.classList.remove("reveal-visible");
        }
    });
}, {
    threshold: 0.2
});

revealCards.forEach(card => {
    revealObserver.observe(card);
});
