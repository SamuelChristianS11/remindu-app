// ================= STATE MANAGEMENT =================
let daftarTugas = [];
const taskTimers = {};
let isMusicPlaying = false;

// State Focus Guard
let focusInterval = null;
let focusTimeLeft = 0;
let isPomodoroRunning = false;
let activeTaskId = null;
let pomodoroState = 'work'; 
let pomodoroCycle = 1; 
let manualBreakDuration = 300; // Default 5 menit (300 detik)

const alarmAudio = new Audio('/static/media/alarm.mp3');
const currentCalendarDate = new Date();
const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const padZero = (num) => String(num).padStart(2, '0');

document.addEventListener("DOMContentLoaded", () => {
    fetchTasks();
    updateTimerStatusDisplay("Siap Belajar? Klik 'Mulai Kerjakan' pada tugas untuk memulai fokus!");
});

// ================= LOGIKA MENTAL HEALTH & FOCUS GUARD =================
function updateTimerStatusDisplay(pesan) {
    const timerElement = document.getElementById('timer-text');
    if (timerElement) timerElement.innerText = pesan;
}

function startTaskTimer(id) {
    activeTaskId = id;
    const modal = document.getElementById('timerModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        selectManualTimer(); 
    }
}

function closeTimerModal() {
    const modal = document.getElementById('timerModalOverlay');
    if (modal) modal.style.display = 'none';
}

// REVISI UI BARU: Mengatur Preset Cepat (15/3, 45/10, 60/15)
function setPresetManual(fokus, istirahat) {
    const elFokus = document.getElementById('manual-focus-input');
    const elIstirahat = document.getElementById('manual-break-input');
    if (elFokus) elFokus.value = fokus;
    if (elIstirahat) elIstirahat.value = istirahat;
}

// REVISI UI BARU: Fungsi Tombol + dan -
function ubahMenit(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let nilaiSekarang = parseInt(input.value) || 0;
    let nilaiBaru = nilaiSekarang + delta;
    if (nilaiBaru < 1) nilaiBaru = 1; // Minimal 1 menit
    input.value = nilaiBaru;
}

// REVISI UI BARU: Memulai Timer dari Form Modal Kustom
function startManualFromModal() {
    const inputFokus = document.getElementById('manual-focus-input')?.value;
    const inputIstirahat = document.getElementById('manual-break-input')?.value;

    const menitFokus = parseInt(inputFokus);
    const menitIstirahat = parseInt(inputIstirahat);

    if (isNaN(menitFokus) || menitFokus <= 0 || isNaN(menitIstirahat) || menitIstirahat <= 0) {
        alert("Mohon isi durasi waktu minimal 1 menit.");
        return;
    }

    closeTimerModal();

    manualBreakDuration = menitIstirahat * 60;
    pomodoroState = 'manual_work';
    
    mulaiFokus(menitFokus * 60, 'manual');
    if (activeTaskId) {
        startTaskStopwatch(activeTaskId);
    }
}

function selectPomodoroTimer() {
    closeTimerModal();
    pomodoroCycle = 1;
    pomodoroState = 'work';
    mulaiFokus(25 * 60, 'pomodoro');
    if (activeTaskId) {
        startTaskStopwatch(activeTaskId);
    }
}

function istirahatSekarang() {
    if (!isPomodoroRunning) {
        alert("Timer fokus belum dimulai. Silakan klik 'Mulai Kerjakan' pada salah satu tugas terlebih dahulu.");
        return;
    }
    
    clearInterval(focusInterval);
    
    if (pomodoroState === 'manual_work' || pomodoroState === 'manual_break') {
        pomodoroState = 'manual_break';
        alert(`Kerja bagus! Mari istirahat sejenak (${manualBreakDuration / 60} Menit).`);
        mulaiFokus(manualBreakDuration, 'manual');
    } else {
        pomodoroState = 'short_break';
        alert("Kerja bagus! Mari regangkan otot dan istirahat sejenak (5 Menit).");
        mulaiFokus(5 * 60, 'pomodoro');
    }
}

function mulaiFokus(seconds, mode) {
    clearInterval(focusInterval);
    focusTimeLeft = seconds;
    isPomodoroRunning = true;

    focusInterval = setInterval(() => {
        focusTimeLeft--;
        const fmt = `${padZero(Math.floor(focusTimeLeft / 60))}:${padZero(focusTimeLeft % 60)}`;

        if (mode === 'manual') {
            if (pomodoroState === 'manual_work') {
                updateTimerStatusDisplay(`Sesi Fokus Manual: Berakhir dalam ${fmt} menit. 🎯`);
            } else {
                updateTimerStatusDisplay(`Istirahat Manual: Tersisa ${fmt} menit. Santai sejenak! ☕`);
            }
        } else {
            const pesanPomodoro = pomodoroState === 'work' 
                ? `Pomodoro (Sesi ${pomodoroCycle}/4) - Kerja: ${fmt} menit. Tetap Fokus! 🔥`
                : pomodoroState === 'short_break'
                ? `Pomodoro - Istirahat Pendek: ${fmt} menit. Relax! ☕`
                : `Pomodoro - Istirahat Panjang: ${fmt} menit. Hebat! 🎉`;
            updateTimerStatusDisplay(pesanPomodoro);
        }

        if (focusTimeLeft <= 0) {
            alarmAudio.play().catch(console.error);
            
            if (mode === 'manual') {
                if (pomodoroState === 'manual_work') {
                    pomodoroState = 'manual_break';
                    alert(`Waktu fokus selesai! Mari istirahat selama ${manualBreakDuration / 60} menit.`);
                    mulaiFokus(manualBreakDuration, 'manual');
                } else {
                    clearInterval(focusInterval);
                    isPomodoroRunning = false;
                    alert("Waktu istirahat selesai! Siap untuk kembali fokus?");
                    updateTimerStatusDisplay("Siap Belajar? Klik 'Mulai Kerjakan' pada tugas untuk memulai fokus!");
                }
            } else {
                lanjutPomodoro();
            }
        }
    }, 1000);
}

function lanjutPomodoro() {
    if (pomodoroState === 'work') {
        if (pomodoroCycle % 4 === 0) {
            pomodoroState = 'long_break';
            alert("Kerja luar biasa! 4 sesi pomodoro selesai. Waktunya istirahat panjang (30 Menit).");
            focusTimeLeft = 30 * 60;
        } else {
            pomodoroState = 'short_break';
            alert(`Sesi ${pomodoroCycle} selesai! Istirahat pendek dulu (5 Menit).`);
            focusTimeLeft = 5 * 60;
        }
    } else {
        pomodoroCycle = pomodoroState === 'long_break' ? 1 : pomodoroCycle + 1;
        pomodoroState = 'work';
        alert("Waktu istirahat selesai! Mari kembali fokus bekerja (25 Menit).");
        focusTimeLeft = 25 * 60;
    }
}

// ================= LOGIKA STOPWATCH KARTU TUGAS =================
function startTaskStopwatch(id) {
    document.getElementById(`btn-start-${id}`)?.style.setProperty('display', 'none');
    document.getElementById(`btn-stop-${id}`)?.style.setProperty('display', 'inline-block');

    if (!taskTimers[id]) taskTimers[id] = { seconds: 0, interval: null };
    if (taskTimers[id].interval) clearInterval(taskTimers[id].interval);
    
    taskTimers[id].interval = setInterval(() => {
        taskTimers[id].seconds++;
        const s = taskTimers[id].seconds;
        const displayEl = document.getElementById(`display-${id}`);
        if (displayEl) {
            displayEl.innerText = `${padZero(Math.floor(s / 3600))}:${padZero(Math.floor((s % 3600) / 60))}:${padZero(s % 60)}`;
        }
    }, 1000);
}

function stopTaskTimer(id) {
    if (taskTimers[id]) {
        clearInterval(taskTimers[id].interval);
        taskTimers[id].interval = null;
    }
    
    const btnStart = document.getElementById(`btn-start-${id}`);
    if (btnStart) {
        btnStart.style.display = 'inline-block';
        btnStart.innerText = 'Lanjutkan';
    }
    document.getElementById(`btn-stop-${id}`)?.style.setProperty('display', 'none');
}

// ================= NAVIGASI TAB MENU LAYER =================
function switchTab(tabName) {
    const isDashboard = tabName === 'dashboard';
    
    document.getElementById('layer-dashboard')?.style.setProperty('display', isDashboard ? 'block' : 'none');
    document.getElementById('layer-calendar')?.style.setProperty('display', isDashboard ? 'none' : 'block');
    
    document.getElementById('btn-tab-dashboard')?.classList.toggle('active', isDashboard);
    document.getElementById('btn-tab-calendar')?.classList.toggle('active', !isDashboard);
    
    if (!isDashboard) renderRealtimeCalendar(); 
}

// ================= KALENDER REAL-TIME INTERAKTIF =================
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
    const today = new Date();

    grid.innerHTML += `<div class="calendar-cell empty"></div>`.repeat(firstDayIndex);

    for (let day = 1; day <= totalDays; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dateStr = `${year}-${padZero(month + 1)}-${padZero(day)}`;
        const eventsOnDate = daftarTugas.filter(t => t.deadline?.startsWith(dateStr));

        const eventChipsHTML = eventsOnDate.map(e => `<div class="event-chip ${e.kategori}" title="${e.mk}">${e.mk}</div>`).join('');
        const countTagHTML = eventsOnDate.length ? `<span class="event-count-tag">${eventsOnDate.length} Agenda</span>` : '';

        grid.innerHTML += `
            <div class="calendar-cell" onclick="showTasksForDate('${dateStr}', this)">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="date-number ${isToday ? 'today' : ''}">${day}</div>
                    ${countTagHTML}
                </div>
                ${eventChipsHTML}
            </div>`;
    }
}

function showTasksForDate(dateStr, cellElement) {
    document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('active-date'));
    cellElement?.classList.add('active-date');

    const container = document.getElementById('calendar-task-list');
    if (!container) return; 

    const events = daftarTugas.filter(t => t.deadline?.startsWith(dateStr));
    const displayDate = new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (!events.length) {
        container.innerHTML = `
            <div class="text-center p-4 rounded mt-3" style="background: #151923; border: 1px dashed #2a2f3a;">
                <h6 class="text-muted mb-0">✨ Tidak ada agenda pada ${displayDate}. Waktu bebas untuk Anda!</h6>
            </div>`;
        return;
    }

    container.innerHTML = `
        <h5 class="text-white mt-4 mb-3"><i class="fa-solid fa-list-check text-primary"></i> Agenda pada ${displayDate}</h5>
        ${events.map(t => `
            <div class="task-item" style="margin-bottom: 10px; background: #151923;">
                <div>
                    <h5 class="mb-1 text-white" style="font-size: 1rem;">${t.mk}</h5>
                    <span class="badge ${t.kategori}">${t.kategori === 'kuliah' ? 'Tugas Kuliah' : 'Jadwal Personal'}</span>
                    <span class="text-muted ms-2" style="font-size: 0.8rem;">
                        <i class="fa-regular fa-clock"></i> ${formatTanggal(t.deadline).split(' ')[1]}
                    </span>
                </div>
            </div>`).join('')}`;
}

// ================= MUSIK =================
function toggleMusic() {
    const audio = document.getElementById('sound-backsound');
    const btnText = document.getElementById('text-music');
    const btnIcon = document.querySelector('#btn-music i');

    if (!audio) return;

    if (isMusicPlaying) {
        audio.pause(); 
        if (btnText) btnText.innerText = "Musik: Off"; 
        if (btnIcon) btnIcon.className = "fa-solid fa-music"; 
    } else {
        audio.volume = 0.3; 
        audio.play(); 
        if (btnText) btnText.innerText = "Musik: On 🎶"; 
        if (btnIcon) btnIcon.className = "fa-solid fa-compact-disc fa-spin"; 
    }
    isMusicPlaying = !isMusicPlaying;
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
    event?.preventDefault();
    
    const inputTitle = document.getElementById('input-title')?.value.toUpperCase();
    const inputCategory = document.getElementById('input-category')?.value;
    const inputDate = document.getElementById('input-date')?.value;
    const inputKesulitan = parseFloat(document.getElementById('input-kesulitan')?.value || 1.0);
    
    const repeatMode = document.getElementById('input-repeat')?.value || 'none';
    const endDateStr = document.getElementById('input-end-repeat')?.value;

    if (!inputTitle || !inputDate) {
        return alert('Harap isi Nama Agenda dan Tanggal Deadline!');
    }

    const datesToPost = [inputDate];

    if (repeatMode !== 'none' && endDateStr) {
        const currentDateObj = new Date(inputDate);
        const endRepeatDateObj = new Date(endDateStr);
        endRepeatDateObj.setHours(23, 59, 59);

        while (true) {
            if (repeatMode === 'weekly') currentDateObj.setDate(currentDateObj.getDate() + 7);
            else if (repeatMode === 'daily') currentDateObj.setDate(currentDateObj.getDate() + 1);
            else break;

            if (currentDateObj > endRepeatDateObj) break;

            datesToPost.push(`${currentDateObj.getFullYear()}-${padZero(currentDateObj.getMonth() + 1)}-${padZero(currentDateObj.getDate())}T${padZero(currentDateObj.getHours())}:${padZero(currentDateObj.getMinutes())}`);
        }
    }

    const fetchPromises = datesToPost.map((date, i) => 
        fetch('/api/add_task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mk: datesToPost.length > 1 ? `${inputTitle} (Sesi ${i+1})` : inputTitle,
                kategori: inputCategory,
                deadline: date,
                kesulitan: inputKesulitan
            })
        })
    );

    await Promise.all(fetchPromises);

    ['input-title', 'input-date', 'input-end-repeat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const repeatSelect = document.getElementById('input-repeat');
    if (repeatSelect) repeatSelect.value = 'none';

    fetchTasks();
    if (datesToPost.length > 1) alert(`Berhasil menambahkan ${datesToPost.length} jadwal berulang!`);
}

function formatTanggal(isoString) {
    if (!isoString) return "-";
    try {
        return new Date(isoString).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }).replace(/\./g, ':');
    } catch {
        return isoString;
    }
}

function renderTabel() {
    const container = document.getElementById('task-container');
    if (!container) return;

    const waktuSekarang = Date.now();

    const tugasDiproses = daftarTugas.map((t) => {
        const selisihJam = (new Date(t.deadline).getTime() - waktuSekarang) / (1000 * 3600);
        const pembagi = selisihJam <= 0 ? 0.1 : selisihJam;
        const skor = ((t.kategori === 'kuliah' ? 2.0 : 1.0) * (t.kesulitan || 1)) / Math.abs(pembagi);
        return { ...t, selisihJam, skor };
    }).sort((a, b) => b.skor - a.skor);

    if (!tugasDiproses.length) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 10px;">Belum ada agenda tersimpan. Nikmati waktu istirahatmu!</p>`;
        return;
    }

    container.innerHTML = tugasDiproses.map((t, index) => {
        const textSisaWaktu = t.selisihJam < 0 ? "TERLAMBAT" 
            : t.selisihJam < 24 ? `${Math.floor(t.selisihJam)} Jam Lagi` 
            : `${Math.floor(t.selisihJam / 24)} Hari Lagi`;
        
        const classWarna = t.selisihJam < 24 ? "status-danger" : t.selisihJam < 72 ? "status-warning" : "status-safe";
        const namaKategori = t.kategori === 'kuliah' ? 'Tugas Kuliah' : 'Jadwal Personal';

        const s = taskTimers[t.id] ? taskTimers[t.id].seconds : 0;
        const formatWaktu = `${padZero(Math.floor(s / 3600))}:${padZero(Math.floor((s % 3600) / 60))}:${padZero(s % 60)}`;
        const isRunning = taskTimers[t.id] && taskTimers[t.id].interval !== null;

        return `
            <div class="task-item">
                <div class="task-info">
                    <h4 style="font-weight: 600; font-size:1.05rem;">#${index + 1} ${t.mk}</h4>
                    <span class="badge ${t.kategori}">${namaKategori}</span>
                    <span style="font-size: 0.8rem; margin-left: 10px;" class="${classWarna}">${textSisaWaktu} (${formatTanggal(t.deadline)})</span>
                </div>
                <div class="timer-controls">
                    <span class="timer-display" id="display-${t.id}">${formatWaktu}</span>
                    <button class="btn-start" id="btn-start-${t.id}" onclick="startTaskTimer(${t.id})" style="display:${isRunning ? 'none' : 'inline-block'};">${s > 0 ? 'Lanjutkan' : 'Mulai Kerjakan'}</button>
                    <button class="btn-stop" id="btn-stop-${t.id}" onclick="stopTaskTimer(${t.id})" style="display:${isRunning ? 'inline-block' : 'none'};">Jeda</button>
                    <button class="btn-selesai" onclick="tandaiSelesai(${t.id})">✓ Selesai</button>
                </div>
            </div>`;
    }).join('');
}

async function tandaiSelesai(id_server) {
    if (taskTimers[id_server]) {
        clearInterval(taskTimers[id_server].interval);
        delete taskTimers[id_server];
    }

    if (typeof confetti === "function") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(async () => {
        try {
            await fetch(`/api/delete_task/${id_server}`, { method: 'DELETE' });
            fetchTasks();
        } catch (err) {
            console.error("Gagal menghapus tugas:", err);
        }
    }, 500);
}

async function hapusSemua() {
    if (confirm("Yakin ingin menghapus semua jadwal tugas?")) {
        try {
            await fetch('/api/clear_tasks', { method: 'DELETE' });
            fetchTasks();
        } catch (err) {
            console.error("Gagal menghapus semua tugas:", err);
        }
    }
}

function updateStats() {
    const elTotal = document.getElementById('stat-total');
    const elKuliah = document.getElementById('stat-kuliah');
    const elPersonal = document.getElementById('stat-personal');
    const elUrgent = document.getElementById('stat-urgent');

    if (elTotal) elTotal.innerText = daftarTugas.length;
    if (elKuliah) elKuliah.innerText = daftarTugas.filter(t => t.kategori === 'kuliah').length;
    if (elPersonal) elPersonal.innerText = daftarTugas.filter(t => t.kategori === 'personal').length;
    
    if (elUrgent) {
        const now = Date.now();
        elUrgent.innerText = daftarTugas.filter(t => {
            const diffDays = (new Date(t.deadline).getTime() - now) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 3;
        }).length;
    }
}
