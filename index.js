const loadingEl = document.getElementById("loading");
const ribbonEl = document.getElementById("ribbon");
const playbuttonEl = document.getElementById("playbutton")
var audio = new Audio('audio_file.mp3');
var playing = true; 


var currentDate = new Date().getHours()


/*For when object has fully faded*/
loadingEl.addEventListener("transitioned", function() {
    console.log("animating...")
    this.style.display = "none";
  }.bind(loadingEl));
  



if (currentDate >= 23 || currentDate <= 7) {
    console.log("hello")
    ribbonEl.innerHTML += `<span class="passive">&nbspsleeping...</span>`
}
else {
    ribbonEl.innerHTML += `<div class="scroll">
    <span> — studying Graphic Design (BA) at ArtEZ Arnhem — making a social graph out of Wikipedia Userboxes — filming a video using LED lights as a metaphor for faraway stars — builing a guided hiking tour using node.js — editing a podcast episode about different ways of experiencing feeling at home</span>
    <span> — studying Graphic Design (BA) at ArtEZ Arnhem — making a social graph out of Wikipedia Userboxes — filming a video using LED lights as a metaphor for faraway stars — builing a guided hiking tour using node.js — editing a podcast episode about different ways of experiencing feeling at home</span>
    <span> — studying Graphic Design (BA) at ArtEZ Arnhem — making a social graph out of Wikipedia Userboxes — filming a video using LED lights as a metaphor for faraway stars — builing a guided hiking tour using node.js — editing a podcast episode about different ways of experiencing feeling at home</span>
    <span> — studying Graphic Design (BA) at ArtEZ Arnhem — making a social graph out of Wikipedia Userboxes — filming a video using LED lights as a metaphor for faraway stars — builing a guided hiking tour using node.js — editing a podcast episode about different ways of experiencing feeling at home</span>
</div>
<div class="fade"></div>`
}

playbuttonEl.addEventListener("click", playAudio);

function playAudio(){
    console.log("button clicked!")
    if (playing){
        audio.pause();
        playing = false;
    }
    else {
        audio.play();
        playing = true;
    }}