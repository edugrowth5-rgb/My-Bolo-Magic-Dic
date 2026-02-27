// 1. Mobile App (PWA) Registration - Taaki app install ho sake
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Bolo Magic PWA: Ready!"))
    .catch(err => console.log("PWA Error:", err));
}

// 2. Main Function: Word Search Logic
async function findWord() {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value.trim().toLowerCase();
    
    if(!word) {
        alert("Pehle koi word toh likhiye! 🐼");
        return;
    }

    // Loader dikhayein aur purana result chhupayein
    document.getElementById('loader').style.display = "block";
    document.getElementById('result-card').style.display = "none";

    try {
        // STEP A: Fetch Dictionary Data (English Meaning & Thesaurus)
        const dRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dData = await dRes.json();

        // STEP B: Fetch Hindi Translation (Ultra-Stable Google API)
        const tRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(word)}`);
        const tData = await tRes.json();
        let hMean = tData[0][0][0];

        // Global Fixes: Common words ke liye best Hindi arth
        const fixes = {
            "gravity": "गुरुत्वाकर्षण",
            "play": "खेलना / खेल",
            "father": "पिता",
            "education": "शिक्षा",
            "environment": "पर्यावरण"
        };
        if(fixes[word]) hMean = fixes[word];

        // STEP C: Extract Data Safely (Synonyms & Antonyms)
        let engDefinition = "Meaning not found, but I can translate it!";
        let syns = [];
        let ants = [];

        if (Array.isArray(dData)) {
            engDefinition = dData[0].meanings[0].definitions[0].definition;
            
            // Loop through meanings to find synonyms and antonyms
            dData[0].meanings.forEach(m => {
                if(m.synonyms && m.synonyms.length > 0) syns.push(...m.synonyms);
                if(m.antonyms && m.antonyms.length > 0) ants.push(...m.antonyms);
            });
        }

        // STEP D: UI Update (Result Card mein data bharna)
        document.getElementById('disp-word').innerText = word;
        document.getElementById('eng-mean').innerText = engDefinition;
        document.getElementById('hin-mean').innerText = hMean;

        // Display Synonyms/Antonyms Section
        const extraBox = document.getElementById('extra-info');
        const synList = document.getElementById('synonyms-list');
        const antList = document.getElementById('antonyms-list');

        if(syns.length > 0 || ants.length > 0) {
            extraBox.style.display = "block";
            synList.innerHTML = syns.length > 0 ? `<b>Similar:</b> ${syns.slice(0, 5).join(", ")}` : "<b>Similar:</b> No data found";
            antList.innerHTML = ants.length > 0 ? `<b>Opposite:</b> ${ants.slice(0, 5).join(", ")}` : "<b>Opposite:</b> No data found";
        } else {
            extraBox.style.display = "none";
        }

        // Search khatam, result dikhayein
        document.getElementById('loader').style.display = "none";
        document.getElementById('result-card').style.display = "block";
        
        // Chota pause dekar bolna shuru karein
        setTimeout(speakBoth, 500);

    } catch (e) {
        document.getElementById('loader').style.display = "none";
        console.error("Error:", e);
        alert("Magic book ko ye word nahi mila! Spelling check karein. 📖");
    }
}

// 3. Audio Function: English + Hindi voice
function speakBoth() {
    window.speechSynthesis.cancel(); // Purani awaaz band karein
    
    const speed = parseFloat(document.getElementById('speedRange').value);
    const word = document.getElementById('disp-word').innerText;
    const hindi = document.getElementById('hin-mean').innerText;

    // English Utterance
    const uE = new SpeechSynthesisUtterance(word);
    uE.lang = 'en-US';
    uE.rate = speed;

    // Hindi Utterance
    const uH = new SpeechSynthesisUtterance(`हिन्दी में इसका अर्थ है: ${hindi}`);
    uH.lang = 'hi-IN';
    uH.rate = speed;

    // Sequence: English bolne ke baad Hindi bole
    window.speechSynthesis.speak(uE);
    uE.onend = () => {
        window.speechSynthesis.speak(uH);
    };
}

// 4. Share Function
function shareWord() {
    const word = document.getElementById('disp-word').innerText;
    const hindi = document.getElementById('hin-mean').innerText;
    const text = `Magic Word: ${word.toUpperCase()}\nHindi Meaning: ${hindi}\n\nSeekhte rahiye Bolo Magic se! 🐼`;
    
    if(navigator.share) {
        navigator.share({ title: 'Bolo Magic Dictionary', text: text });
    } else {
        // Fallback agar share support na kare
        navigator.clipboard.writeText(text);
        alert("Copy ho gaya! Ab WhatsApp par paste karein.");
    }
}

// 5. Voice Search (Microphone)
function startVoice() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        
        rec.lang = 'en-US';
        rec.onstart = () => {
            document.getElementById('wordInput').placeholder = "Listening... 🎤";
        };
        
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            document.getElementById('wordInput').value = transcript;
            document.getElementById('wordInput').placeholder = "Enter word...";
            findWord(); // Automatic search
        };

        rec.onerror = () => {
            alert("Mic mein dikkat hai! Phir se koshish karein.");
            document.getElementById('wordInput').placeholder = "Enter word...";
        };

        rec.start();
    } catch(e) {
        alert("Aapka browser voice search support nahi karta.");
    }
}
