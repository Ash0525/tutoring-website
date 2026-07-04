// Image Slider
let slides = [];
let slideIndex = 0;
let autoSlideTimer = null;
let restartTimer = null;

// wait for DOM
document.addEventListener("DOMContentLoaded", initializeSlider);

function initializeSlider() {
    slides = document.querySelectorAll(".slide");

    if (slides.length > 0) {
        showSlide(slideIndex);
        startAutoSlide();
    }
}

function showSlide(index) {

    if (index >= slides.length) {
        slideIndex = 0;
    } else if (index < 0) {
        slideIndex = slides.length - 1;
    } else {
        slideIndex = index;
    }
    
    slides.forEach(slide => {
        slide.classList.remove("displaySlide");
    });
    slides[slideIndex].classList.add("displaySlide");
}

function startAutoSlide() {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(nextSlide, 5000);
}

function stopAutoSlideTemporarily() {
    clearInterval(autoSlideTimer);
    clearTimeout(restartTimer);

    restartTimer = setTimeout(() => {
        startAutoSlide();
    }, 10000);
}

function nextSlide() {
    showSlide(slideIndex + 1);
}

function prevSlide() {
    stopAutoSlideTemporarily();
    showSlide(slideIndex - 1);
}

function manualNextSlide() {
    stopAutoSlideTemporarily();
    showSlide(slideIndex + 1);
}
