// grab the chapter containers
const chapters = document.querySelectorAll(".chapter");

// attach click logic
chapters.forEach((chapter) => {
  const btn = chapter.querySelector(".chapter-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // Toggle open state on the parent container
    chapter.classList.toggle("open");

    // Sync aria-expanded with actual state
    const isOpen = chapter.classList.contains("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});