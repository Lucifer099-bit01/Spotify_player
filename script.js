console.log('Spotify Javascript');

let currentsong = new Audio();
let songs = [];
let currfolder = '';

function sectomin(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    try {
        let response = await fetch(`http://127.0.0.1:3000/Songs/${folder}`);
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        currfolder = folder;
        updateLibrary(currfolder);
        return songs;
    } catch (error) {
        console.error(`Error fetching songs from folder ${folder}:`, error);
        return [];
    }
}

async function displayAlbums() {
    try {
        let response = await fetch('http://127.0.0.1:3000/Songs/');
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        let cardcont = document.querySelector(".card-container");
        cardcont.innerHTML = '';

        for (let index = 0; index < as.length; index++) {
            const e = as[index];

            if (e.href.includes("/Songs")) {
                let folder = e.href.split("/").slice(-2)[0];

                let infoResponse = await fetch(`http://127.0.0.1:3000/Songs/${folder}/info.json`);
                let info = await infoResponse.json();

                cardcont.innerHTML += `<div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="images/play.svg">
                    </div>
                    <img src="/Songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                const folderName = item.currentTarget.dataset.folder;
                console.log(`Card clicked, folder: ${folderName}`); // Debug log
                songs = await getSongs(folderName);
                console.log(`Songs loaded: ${songs}`); // Debug log
                if (songs.length > 0) {
                    playmusic(songs[0], true);
                }
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

const playmusic = (track, play = true) => {
    if (!currfolder) {
        console.error("Current folder is not set.");
        return;
    }
    currentsong.src = `Songs/${currfolder}/${track}`;
    console.log(`Playing song: Songs/${currfolder}/${track}`); // Debug log
    if (play) {
        currentsong.play().then(() => {
            document.getElementById("play").src = "images/pause.svg";
        }).catch(error => {
            console.error("Error playing the audio:", error);
        });
    }
    document.querySelector(".Sinfo").innerHTML = decodeURI(track);
    document.querySelector(".Stime").innerHTML = "00:00 / 00:00";
}

async function updateLibrary(folder) {
    try {
        let response = await fetch(`http://127.0.0.1:3000/Songs/${folder}`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        let library = document.querySelector(".songlist ul");
        library.innerHTML = '';

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                let songName = element.href.split(`/${folder}/`)[1];
                library.innerHTML += `<li>
                    <img class="invert" src="images/music.svg" alt="">
                    <div class="info">
                        <div>${songName.replaceAll("%20", " ")}</div>
                        <div>Uday</div>
                    </div>
                    <div class="playnow">
                        <span>Play now</span>
                        <img class="invert" src="images/play.svg" alt="">
                    </div>
                </li>`;
            }
        }

        Array.from(library.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playmusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });
    } catch (error) {
        console.error(`Error updating library for folder ${folder}:`, error);
    }
}

async function main() {
    try {
        songs = await getSongs("Diljit");
        if (songs.length > 0) {
            playmusic(songs[0], true);
        }
        await displayAlbums();

        document.getElementById("play").addEventListener("click", () => {
            if (currentsong.paused) {
                currentsong.play();
                document.getElementById("play").src = "images/pause.svg";
            } else {
                currentsong.pause();
                document.getElementById("play").src = "images/playbtn.svg";
            }
        });

        currentsong.addEventListener("timeupdate", () => {
            document.querySelector(".Stime").innerHTML =
                `${sectomin(currentsong.currentTime)}/
            ${sectomin(currentsong.duration)}`;
            document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentsong.currentTime = ((currentsong.duration) * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        document.getElementById("previous").addEventListener("click", () => {
            if (!Array.isArray(songs) || songs.length === 0) {
                return;
            }

            let currentSongFilename = currentsong.src ? currentsong.src.split("/").pop() : null;

            if (currentSongFilename) {
                let index = songs.indexOf(currentSongFilename);

                if (index !== -1 && index - 1 >= 0) {
                    playmusic(songs[index - 1]);
                }
            }
        });

        document.getElementById("next").addEventListener("click", () => {
            if (!Array.isArray(songs) || songs.length === 0) {
                return;
            }

            let currentSongFilename = currentsong.src ? currentsong.src.split("/").pop() : null;

            if (currentSongFilename) {
                let index = songs.indexOf(currentSongFilename);

                if (index !== -1 && index + 1 < songs.length) {
                    playmusic(songs[index + 1]);
                }
            }
        });

        document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
            currentsong.volume = parseInt(e.target.value) / 100;
        });

        document.querySelector(".volume>img").addEventListener("click", e => {
            if (e.target.src.includes("images/volume.svg")) {
                document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
                e.target.src = e.target.src.replace("images/volume.svg", "images/mute.svg");
                currentsong.volume = 0;
            } else {
                document.querySelector(".range").getElementsByTagName("input")[0].value = 100;
                e.target.src = e.target.src.replace("images/mute.svg", "images/volume.svg");
                currentsong.volume = 1;
            }
        });

    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
