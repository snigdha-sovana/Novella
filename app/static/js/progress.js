// static/js/progress.js
document.addEventListener("DOMContentLoaded", () => {
    const pageSlider = document.getElementById("pagesRead");
    const pageOutput = document.getElementById("pagesReadOutput");

    if (pageSlider && pageOutput) {
        pageOutput.textContent = pageSlider.value;
        pageSlider.addEventListener("input", () => {
            pageOutput.textContent = pageSlider.value;
        });
    }

    const chapterSlider = document.getElementById("chaptersRead");
    const chapterOutput = document.getElementById("chaptersReadOutput");

    if (chapterSlider && chapterOutput) {
        chapterOutput.textContent = chapterSlider.value;
        chapterSlider.addEventListener("input", () => {
            chapterOutput.textContent = chapterSlider.value;
        });
    }
});
