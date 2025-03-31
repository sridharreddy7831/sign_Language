// Prevents the user from entering bad characters in input
$('input').on('keypress', function (e) {
    if (e.keyCode === 13) return true; // Allow Enter key
    let charCode = e.which;
    if (!(charCode >= 48 && charCode <= 57) && // Numbers 0-9
        !(charCode >= 65 && charCode <= 90) && // Uppercase A-Z
        !(charCode >= 97 && charCode <= 122) && // Lowercase a-z
        charCode !== 32) { // Space
        e.preventDefault();
    }
});

var wordArrayJson = [];

// Fetch list of available words in signFiles
async function test_list() {
    try {
        let response = await fetch('static/js/sigmlFiles.json');
        let data = await response.json();

        wordArrayJson = data.map(e => ({ word: e.name.toLowerCase(), fileName: e.fileName }));
        
        let ul = document.querySelector(".test_list");
        data.forEach(e => {
            let li = document.createElement("li");
            li.innerHTML = `<a href="#player" onclick="setSiGMLURL('SignFiles/${e.fileName}');">${e.name}</a>`;
            ul.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching JSON:", error);
    }
}

test_list();

// Stop form from submitting
document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();
});

// Handle text input submission
document.getElementById('submit').addEventListener('click', async () => {
    let input = document.getElementById('text').value.trim().toLowerCase();

    if (input === "") {
        alert("Please enter some text.");
        return;
    }

    console.log("INPUT is", input);

    let words = input.split(" "); // Split sentence into words
    let sigmlFiles = [];

    // Find corresponding SiGML files
    words.forEach(word => {
        let matchedFile = wordArrayJson.find(e => e.word === word);
        if (matchedFile) {
            sigmlFiles.push(`SignFiles/${matchedFile.fileName}`);
        } else {
            console.error("No matching SiGML file found for:", word);
        }
    });

    if (sigmlFiles.length > 0) {
        playWordsSequentially(sigmlFiles);
    } else {
        display_err_message();
    }
});

// Function to play words one at a time
async function playWordsSequentially(files) {
    document.getElementById("submit").disabled = true; // Disable submit while playing

    for (let file of files) {
        console.log(`Playing: ${file}`);
        display_curr_word(file.split('/').pop().replace('.sigml', '')); // Display current word
        startPlayer(file);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust delay as needed
    }

    document.getElementById("submit").disabled = false; // Re-enable submit
}

// Displays currently playing word
function display_curr_word(word) {
    let p = document.querySelector(".curr_word_playing");
    if (!p) {
        console.error("Error: Element '.curr_word_playing' not found.");
        return; // Stop execution if element doesn't exist
    }
    
    p.textContent = word;
    p.style = "color:Red; font-size:24px; font-weight:bold;";
}


// Displays error message if there's an issue
function display_err_message() {
    let p = document.querySelector(".curr_word_playing");
    p.textContent = "Error: Some words may not have corresponding SiGML files.";
    p.style = "color:Red; font-size:24px; font-weight:bold;";
}

// Check if browser supports Speech Recognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (window.SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    document.getElementById("micButton").addEventListener("click", () => {
        recognition.start();
        console.log("Voice recognition started...");
    });

    recognition.onresult = async function (event) {
        let transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log("Recognized:", transcript);
        document.getElementById("text").value = transcript;

        let words = transcript.split(" "); // Split spoken input into words
        let sigmlFiles = [];

        // Find corresponding SiGML files
        words.forEach(word => {
            let matchedFile = wordArrayJson.find(e => e.word === word);
            if (matchedFile) {
                sigmlFiles.push(`SignFiles/${matchedFile.fileName}`);
            } else {
                console.error("No matching SiGML file found for:", word);
            }
        });

        if (sigmlFiles.length > 0) {
            playWordsSequentially(sigmlFiles);
        } else {
            display_err_message();
        }
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
    };

} else {
    console.warn("Speech Recognition not supported in this browser.");
    document.getElementById("micButton").disabled = true; // Disable mic button if not supported
}
