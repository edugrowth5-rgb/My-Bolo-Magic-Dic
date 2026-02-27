if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Bolo Magic PWA: Ready!"))
    .catch(err => console.log("PWA Error:", err));
}

async function findWord() {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value.trim().toLowerCase();
    if(!word) { alert("Pehle koi word toh likhiye! 🐼"); return; }

    document.getElementById('loader').style.display = "block";
    document.getElementById('result-card').style.display = "none";

    try {
        const dRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dData = await dRes.json();
        const tRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(word)}`);
        const tData = await tRes.json();
        let hMean = tData[0][0][0];

        const fixes = { "gravity": "गुरुत्वाकर्षण", "play": "खेलना / खेल", "father": "पिता" };
        if(fixes[word]) hMean = fixes[word];

        let engDefinition = "Definition not found, but translation is ready!";
        let syns = []; let ants = [];

        if (Array.isArray(dData)) {
            engDefinition = dData[0].meanings[0].definitions[0].definition;
            dData[0].meanings.forEach(m => {
                if(m.synonyms) syns.push(...m.synonyms);
                if(m.antonyms) ants.push(...m.antonyms);
            });
        }

        document.getElementById('disp-word').innerText = word;
        document.getElementById('eng-mean').innerText = engDefinition;
        document.getElementById('hin-mean').innerText = hMean;

        const extraBox = document.getElementById('extra-info');
        if(syns.length > 0 || ants.length > 0) {
            extraBox.style.display = "block";
            document.getElementById('synonyms-list').innerText = syns.length > 0 ? syns.slice(0, 5).join(", ") : "None";
            document.getElementById('antonyms-list').innerText = ants.length > 0 ? ants.slice(0, 5).join(", ") : "None";
        } else { extraBox.style.display = "none"; }

        document.getElementById('loader').style.display = "none";
        document.getElementById('result-card').style.display = "block";
        setTimeout(speakBoth, 500);
    } catch (e) {
        document.getElementById('loader').style.display = "none";
        alert("Magic book can't find this word!");
    }
}

function speakBoth() {
    window.speechSynthesis.cancel();
    const speed = parseFloat(document.getElementById('speedRange').value);
    const uE = new SpeechSynthesisUtterance(document.getElementById('disp-word').innerText);
    uE.lang = 'en-US'; uE.rate = speed;
    const uH = new SpeechSynthesisUtterance(document.getElementById('hin-mean').innerText);
    uH.lang = 'hi-IN'; uH.rate = speed;
    window.speechSynthesis.speak(uE);
    uE.onend = () => window.speechSynthesis.speak(uH);
}

function shareWord() {
    const text = `Word: ${document.getElementById('disp-word').innerText}\nHindi: ${document.getElementById('hin-mean').innerText}`;
    if(navigator.share) { navigator.share({ title: 'Magic Word', text: text }); }
    else { navigator.clipboard.writeText(text); alert("Copied!"); }
}

function startVoice() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.onresult = (e) => { document.getElementById('wordInput').value = e.results[0][0].transcript; findWord(); };
    rec.start();
}
