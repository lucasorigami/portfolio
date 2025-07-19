const loadingEl = document.getElementById("loading");
const ribbonEl = document.getElementById("ribbon");



// --- Trigger CSS fadeout animation after 2s ---
setTimeout(() => {
    loadingEl.classList.add("fadeout");
}, 2000);

// --- Remove the loading element after animation ends ---
const removeLoading = () => {
    loadingEl.remove();
    console.log("Loading element removed after animation");
};

// Cross-browser animation end detection
loadingEl.addEventListener("animationend", removeLoading, { once: true });
loadingEl.addEventListener("webkitAnimationEnd", removeLoading, { once: true });
loadingEl.addEventListener("mozAnimationEnd", removeLoading, { once: true });
loadingEl.addEventListener("oAnimationEnd", removeLoading, { once: true });

// --- Ribbon Content ---
const currentHour = new Date().getHours();

if (currentHour >= 23 || currentHour <= 7) {
    ribbonEl.innerHTML = `<span class="passive">&nbspsleeping...</span>`;
}
// } else {
//     ribbonEl.innerHTML = `<div class="scroll">
//         <span class="scrollspan">– Graduated – emailing people who he's met on the graduation expo – looking for freelance work – updating his linkedin</span>
//         <span class="scrollspan">– Graduated – emailing people who he's met on the graduation expo – looking for freelance work – updating his linkedin</span>
//         <span class="scrollspan">– Graduated – emailing people who he's met on the graduation expo – looking for freelance work – updating his linkedin</span>
//         <span class="scrollspan">– Graduated – emailing people who he's met on the graduation expo – looking for freelance work – updating his linkedin</span>
//     </div>
//     <div class="fade"></div>`;



    // document.addEventListener('DOMContentLoaded', () => {
        const textDiv = document.querySelectorAll('.text');

        for (let div of textDiv) {
            div.addEventListener('click', () => {
            div.classList.toggle('expanded');
        });
}
    // });
