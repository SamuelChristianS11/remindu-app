let daftarTugas = [];
let taskTimers = {};
let pomodoroTimer = null;
let waktuPomodoroDetik = 30 * 60; // 30 Menit Focus Guard
let isPomodoroRunning = false;
let isMusicPlaying = false;

// Variable Kalender Real-Time (Default: November 2026)
let currentCalendarDate = new Date(2026, 10, 1);

const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

window.onload = () => {
    fetchTasks();
    updateTimerStatusDisplay("Siap Belajar? Klik 'Mulai Kerjakan' pada tugas untuk menghitung 30 menit fokus!");
};

// ================= LOGIKA MENTAL HEALTH (30 MENIT FOCUS) =================
function updateTimerStatusDisplay(pesan) {
    let timerElement = document.getElementById('timer-text');
    if (timerElement) timerElement.innerText = pesan;
}

function jalankanTimer30Menit() {
    if (isPomodoroRunning) return;

    waktuPomodoroDetik = 30 * 60; // Reset ke 30 Menit
    isPomodoroRunning = true;
    clearInterval(pomodoroTimer);

    pomodoroTimer = setInterval(() => {
        waktuPomodoroDetik--;
        let menit = Math.floor(waktuPomodoroDetik / 60);
        let detik = waktuPomodoroDetik % 60;
        let formatDetik = detik < 10 ? '0' + detik : detik;

        updateTimerStatusDisplay(`Sesi Fokus Berjalan: Istirahat berikutnya dalam ${menit}:${formatDetik} menit. Tetap jaga kesehatan mentalmu! 💚`);

        if (waktuPomodoroDetik <= 0) {
            clearInterval(pomodoroTimer);
            isPomodoroRunning = false;
            picuPengingatIstirahat();
        }
    }, 1000);
}

function picuPengingatIstirahat() {
    const pesanMotivasi = [
        "Sesi 30 menit selesai! Tarik napas dalam-dalam, minum air putih, dan regangkan ototmu.",
        "Kesehatan mentalmu jauh lebih penting dari deadline. Istirahat 5 menit dulu yuk!",
        "Jangan lupa istirahatkan matamu dari layar sejenak. Tatap objek jauh selama 20 detik."
    ];
    let pesanAcak = pesanMotivasi[Math.floor(Math.random() * pesanMotivasi.length)];
    let modalTextElement = document.getElementById('pijat-mental-text');
    
    if (modalTextElement) {
        modalTextElement.innerText = pesanAcak;
        let breakModal = new bootstrap.Modal(document.getElementById('breakModal'));
        breakModal.show();
    } else {
        alert("WAKTUNYA REHAT!\n\n" + pesanAcak);
        resetTimerIstirahat();
    }
}

function resetTimerIstirahat() {
    clearInterval(pomodoroTimer);
    isPomodoroRunning = false;
    updateTimerStatusDisplay("Siap Belajar? Klik 'Mulai Kerjakan' pada tugas untuk menghitung 30 menit fokus!");
}

// ================= LOGIKA TIMER TUGAS =================
function startTaskTimer(id) {
    // 1. Picu hitung mundur 30 menit di banner atas saat tombol diklik
    jalankanTimer30Menit();

    // 2. Kontrol tombol kartu tugas
    let btnStart = document.getElementById(`btn-start-${id}`);
    let btnStop = document.getElementById(`btn-stop-${id}`);
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-block';

    if (!taskTimers[id]) taskTimers[id] = { seconds: 0, interval: null };

    // 3. Jalankan stopwatch
    clearInterval(taskTimers[id].interval);
    taskTimers[id].interval = setInterval(() => {
        taskTimers[id].seconds++;
        let hrs = Math.floor(taskTimers[id].seconds / 3600);
        let mins = Math.floor((taskTimers[id].seconds % 3600) / 60);
        let secs = taskTimers[id].seconds % 60;

        let displayEl = document.getElementById(`display-${id}`);
        if (displayEl) {
            displayEl.innerText = 
                String(hrs).padStart(2, '0') + ':' + 
                String(mins).padStart(2, '0') + ':' + 
                String(secs).padStart(2, '0');
        }
    }, 1000);
}

function stopTaskTimer(id) {
    if (taskTimers[id]) clearInterval(taskTimers[id].interval);
    let btnStart = document.getElementById(`btn-start-${id}`);
    let btnStop = document.getElementById(`btn-stop-${id}`);
    if (btnStart) {
        btnStart.style.display = 'inline-block';
        btnStart.innerText = 'Lanjutkan';
    }
    if (btnStop) btnStop.style.display = 'none';
}

// ================= NAVIGASI TAB MENU LAYER =================
function switchTab(tabName) {
    const layerDashboard = document.getElementById('layer-dashboard');
    const layerCalendar = document.getElementById('layer-calendar');
    const btnDashboard = document.getElementById('btn-tab-dashboard');
    const btnCalendar = document.getElementById('btn-tab-calendar');

    if (tabName === 'dashboard') {
        if(layerDashboard) layerDashboard.style.display = 'block';
        if(layerCalendar) layerCalendar.style.display = 'none';
        if(btnDashboard) btnDashboard.classList.add('active');
        if(btnCalendar) btnCalendar.classList.remove('active');
    } else {
        if(layerDashboard) layerDashboard.style.display = 'none';
        if(layerCalendar) layerCalendar.style.display = 'block';
        if(btnCalendar) btnCalendar.classList.add('active');
        if(btnDashboard) btnDashboard.classList.remove('active');
        renderRealtimeCalendar(); // Merender ulang grid kalender saat tab dibuka
    }
}

// ================= KALENDER REAL-TIME =================
function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderRealtimeCalendar();
}

function renderRealtimeCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('calendar-month-year');
    if (!grid || !monthYearText) return;

    grid.innerHTML = '';

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    monthYearText.innerText = `${namaBulan[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < firstDayIndex; x++) {
        grid.innerHTML += `<div class="calendar-cell empty"></div>`;
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const eventsOnDate = daftarTugas.filter(t => t.deadline && t.deadline.startsWith(dateStr));

        let eventChipsHTML = eventsOnDate.map(e => `
            <div class="event-chip ${e.kategori}" title="${e.mk}">${e.mk}</div>
        `).join('');

        let countTagHTML = eventsOnDate.length > 0 ? `<span class="event-count-tag">${eventsOnDate.length} Agenda</span>` : '';

        grid.innerHTML += `
            <div class="calendar-cell">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="date-number ${isToday ? 'today' : ''}">${day}</div>
                    ${countTagHTML}
                </div>
                ${eventChipsHTML}
            </div>
        `;
    }
}

// ================= MUSIK =================
function toggleMusic() {
    const audio = document.getElementById('sound-backsound');
    const btnText = document.getElementById('text-music');
    const btnIcon = document.querySelector('#btn-music i');

    if (!audio) return;

    if (isMusicPlaying) {
        audio.pause(); 
        if(btnText) btnText.innerText = "Musik: Off"; 
        if(btnIcon) btnIcon.className = "fa-solid fa-music"; 
        isMusicPlaying = false;
    } else {
        audio.volume = 0.3; 
        audio.play(); 
        if(btnText) btnText.innerText = "Musik: On 🎶"; 
        if(btnIcon) btnIcon.className = "fa-solid fa-compact-disc fa-spin"; 
        isMusicPlaying = true;
    }
}

// ================= FETCH & RENDER TASK =================
async function fetchTasks() {
    try {
        const res = await fetch('/api/tasks');
        daftarTugas = await res.json();
        renderTabel();
        updateStats();
        renderRealtimeCalendar();
    } catch (err) {
        console.error("Gagal mengambil data tugas:", err);
    }
}

async function tambahTugas(event) {
    if(event) event.preventDefault();
    
    const inputTitle = document.getElementById('input-title').value.toUpperCase();
    const inputCategory = document.getElementById('input-category').value;
    const inputDate = document.getElementById('input-date').value;
    const inputKesulitan = document.getElementById('input-kesulitan') ? parseFloat(document.getElementById('input-kesulitan').value) : 1.0;

    if (!inputTitle || !inputDate) {
        alert('Harap isi Nama Agenda dan Tanggal Deadline!');
        return;
    }

    const taskData = {
        mk: inputTitle,
        kategori: inputCategory,
        deadline: inputDate,
        kesulitan: inputKesulitan
    };

    await fetch('/api/add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });

    document.getElementById('input-title').value = '';
    document.getElementById('input-date').value = '';
    fetchTasks();
}

function formatTanggal(isoString) {
    if (!isoString) return "-";
    try {
        const date = new Date(isoString);
        const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options).replace(/\./g, ':');
    } catch {
        return isoString;
    }
}

function renderTabel() {
    const container = document.getElementById('task-container');
    const waktuSekarang = new Date().getTime();

    let tugasDiproses = daftarTugas.map((t) => {
        let dlTime = new Date(t.deadline).getTime();
        let selisihJam = (dlTime - waktuSekarang) / (1000 * 3600);
        let pembagi = selisihJam <= 0 ? 0.1 : selisihJam;
        let bobotKategori = t.kategori === 'kuliah' ? 2.0 : 1.0; 
        let skor = (bobotKategori * (t.kesulitan || 1)) / Math.abs(pembagi);
        return { ...t, selisihJam, skor };
    });

    tugasDiproses.sort((a, b) => b.skor - a.skor);

    if (tugasDiproses.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 10px;">Belum ada agenda tersimpan. Nikmati waktu istirahatmu!</p>`;
        return;
    }

    container.innerHTML = tugasDiproses.map((t, index) => {
        let textSisaWaktu = ""; let classWarna = "";
        if (t.selisihJam < 0) { textSisaWaktu = "TERLAMBAT"; classWarna = "status-danger"; } 
        else if (t.selisihJam < 24) { textSisaWaktu = Math.floor(t.selisihJam) + " Jam Lagi"; classWarna = "status-danger"; } 
        else if (t.selisihJam < 72) { textSisaWaktu = Math.floor(t.selisihJam / 24) + " Hari Lagi"; classWarna = "status-warning"; } 
        else { textSisaWaktu = Math.floor(t.selisihJam / 24) + " Hari Lagi"; classWarna = "status-safe"; }

        let namaKategori = t.kategori === 'kuliah' ? 'Tugas Kuliah' : 'Jadwal Personal';

        return `
            <div class="task-item">
                <div class="task-info">
                    <h4 style="font-weight: 600; font-size:1.05rem;">#${index + 1} - ${t.mk}</h4>
                    <span class="badge ${t.kategori}">${namaKategori}</span>
                    <span style="font-size: 0.8rem; margin-left: 10px;" class="${classWarna}">${textSisaWaktu} (${formatTanggal(t.deadline)})</span>
                </div>
                <div class="timer-controls">
                    <span class="timer-display" id="display-${t.id}">00:00:00</span>
                    <button class="btn-start" id="btn-start-${t.id}" onclick="startTaskTimer(${t.id})">Mulai Kerjakan</button>
                    <button class="btn-stop" id="btn-stop-${t.id}" onclick="stopTaskTimer(${t.id})" style="display:none;">Jeda</button>
                    <button class="btn-selesai" onclick="tandaiSelesai(${t.id})">✓ Selesai</button>
                </div>
            </div>
        `;
    }).join('');
}

async function tandaiSelesai(id_server) {
    if (typeof confetti === "function") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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

function updateStats() {
    let elTotal = document.getElementById('stat-total');
    let elKuliah = document.getElementById('stat-kuliah');
    let elPersonal = document.getElementById('stat-personal');
    let elUrgent = document.getElementById('stat-urgent');

    if(elTotal) elTotal.innerText = daftarTugas.length;
    if(elKuliah) elKuliah.innerText = daftarTugas.filter(t => t.kategori === 'kuliah').length;
    if(elPersonal) elPersonal.innerText = daftarTugas.filter(t => t.kategori === 'personal').length;
    
    if(elUrgent) {
        const now = new Date();
        const urgentCount = daftarTugas.filter(t => {
            const taskDate = new Date(t.deadline);
            const diffDays = (taskDate - now) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 3;
        }).length;
        elUrgent.innerText = urgentCount;
    }
}
