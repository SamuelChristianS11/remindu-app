let daftarTugas = [];
let waktuDetik = 25 * 60; // 25 Menit (Teknik Pomodoro)
let intervalTimer;

window.onload = () => {
    fetchTasks();
    mulaiTimerIstirahat();
};

// --- LOGIKA MENTAL HEALTH & BREAK REMINDER ---
function mulaiTimerIstirahat() {
    clearInterval(intervalTimer);
    intervalTimer = setInterval(() => {
        waktuDetik--;
        let menit = Math.floor(waktuDetik / 60);
        let detik = waktuDetik % 60;
        let formatDetik = detik < 10 ? '0' + detik : detik;
        
        document.getElementById('timer-text').innerText = 
            `Istirahat berikutnya dalam ${menit}:${formatDetik} menit. Tetap jaga kesehatan mentalmu! 💚`;

        if (waktuDetik <= 0) {
            picuPengingatIstirahat();
        }
    }, 1000);
}

function picuPengingatIstirahat() {
    const pesanMotivasi = [
        "Kamu sudah bekerja keras! Tarik napas dalam-dalam, minum air putih, dan regangkan ototmu.",
        "Kesehatan mentalmu jauh lebih penting dari deadline. Istirahat 5 menit dulu yuk!",
        "Jangan lupa istirahatkan matamu dari layar sejenak. Tatap objek jauh selama 20 detik.",
        "Fokus itu bagus, tapi istirahat membuat pemikiranmu jauh lebih jernih. Rehat sejenak!"
    ];
    
    let pesanAcak = pesanMotivasi[Math.floor(Math.random() * pesanMotivasi.length)];
    document.getElementById('pijat-mental-text').innerText = pesanAcak;

    let breakModal = new bootstrap.Modal(document.getElementById('breakModal'));
    breakModal.show();
}

function resetTimerIstirahat() {
    waktuDetik = 25 * 60;
    mulaiTimerIstirahat();
}

// --- LOGIKA TASK MANAGER ---
async function fetchTasks() {
    const res = await fetch('/api/tasks');
    daftarTugas = await res.json();
    renderTabel();
}

async function tambahTugas(event) {
    event.preventDefault();
    const taskData = {
        mk: document.getElementById('mk').value.toUpperCase(),
        deadline: document.getElementById('dl').value,
        sks: parseFloat(document.getElementById('sks').value),
        kesulitan: parseFloat(document.getElementById('kesulitan').value)
    };

    await fetch('/api/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });

    document.getElementById('mk').value = '';
    document.getElementById('dl').value = '';
    fetchTasks();
}

function formatTanggal(isoString) {
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options).replace(/\./g, ':');
}

function renderTabel() {
    const tabelBody = document.getElementById('tabelBody');
    tabelBody.innerHTML = '';
    const waktuSekarang = new Date().getTime();

    let tugasDiproses = daftarTugas.map((t) => {
        let dlTime = new Date(t.deadline).getTime();
        let selisihJam = (dlTime - waktuSekarang) / (1000 * 3600);
        let pembagi = selisihJam <= 0 ? 0.1 : selisihJam;
        let skor = (t.sks * t.kesulitan) / pembagi;
        return { ...t, selisihJam, skor };
    });

    tugasDiproses.sort((a, b) => b.skor - a.skor);

    if (tugasDiproses.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Belum ada tugas. Nikmati waktu istirahatmu!</td></tr>`;
        return;
    }

    tugasDiproses.forEach((t, index) => {
        let textSisaWaktu = ""; let classWarna = "";
        if (t.selisihJam < 0) { textSisaWaktu = "TERLAMBAT"; classWarna = "status-danger"; } 
        else if (t.selisihJam < 24) { textSisaWaktu = Math.floor(t.selisihJam) + " Jam Lagi"; classWarna = "status-danger"; } 
        else if (t.selisihJam < 72) { textSisaWaktu = Math.floor(t.selisihJam / 24) + " Hari Lagi"; classWarna = "status-warning"; } 
        else { textSisaWaktu = Math.floor(t.selisihJam / 24) + " Hari Lagi"; classWarna = "status-safe"; }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td class="fw-bold">${t.mk}</td>
            <td class="text-muted small">${formatTanggal(t.deadline)}</td>
            <td class="${classWarna}">${textSisaWaktu}</td>
            <td class="text-center">
                <button onclick="tandaiSelesai(${t.id})" class="btn-selesai">
                    <i class="fa-solid fa-check"></i> Selesai
                </button>
            </td>
        `;
        tabelBody.appendChild(tr);
    });
}

async function tandaiSelesai(id_server) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(async () => {
        await fetch(`/api/delete_task/${id_server}`, { method: 'DELETE' });
        fetchTasks();
    }, 500);
}

async function hapusSemua() {
    if(confirm("Yakin ingin menghapus semua jadwal tugas?")) {
        await fetch('/api/clear_tasks', { method: 'DELETE' });
        fetchTasks();
    }
}

let isMusicPlaying = false;
function toggleMusic() {
    const audio = document.getElementById('sound-backsound');
    const btnText = document.getElementById('text-music');
    const btnIcon = document.querySelector('#btn-music i');

    if (isMusicPlaying) {
        audio.pause(); 
        btnText.innerText = "Musik: Off"; 
        btnIcon.className = "fa-solid fa-music"; 
        isMusicPlaying = false;
    } else {
        audio.volume = 0.3; 
        audio.play(); 
        btnText.innerText = "Musik: On 🎶"; 
        btnIcon.className = "fa-solid fa-compact-disc fa-spin"; 
        isMusicPlaying = true;
    }
}
