// 1. Firebase Configuration
const firebaseConfig = {
    databaseURL: "https://project-pkl-a65b2-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let maxTemp = 0;
let notificationSent = false;

// 2. Meminta Izin Notifikasi
if ("Notification" in window) {
    Notification.requestPermission();
}

// 3. Konfigurasi Awal Grafik (Chart.js)
const chartConfig = (label, color) => ({
    type: 'line',
    data: { 
        labels: [], 
        datasets: [{ 
            label: label, 
            data: [], 
            borderColor: color, 
            borderWidth: 3,
            pointRadius: 2,
            backgroundColor: 'transparent',
            fill: false, 
            tension: 0.4 
        }] 
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    }
});

const tempChart = new Chart(document.getElementById('tempChart').getContext('2d'), chartConfig('Suhu', '#f97316'));
const humChart = new Chart(document.getElementById('humChart').getContext('2d'), chartConfig('Lembap', '#3b82f6'));

// 4. Pengolahan Data Real-time dari Firebase
database.ref('monitoring').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Update Status Indikator
        document.getElementById("db-status").innerText = "Sistem Aktif";
        document.getElementById("db-status").className = "font-bold text-green-600 uppercase text-xs tracking-widest";
        document.getElementById("status-dot").className = "relative inline-flex rounded-full h-3 w-3 bg-green-500";
        document.getElementById("ping-animate").className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75";

        // Konversi Data (Keamanan Tipe Data)
        const curTemp = parseFloat(data.suhu || 0);
        const curHum = parseFloat(data.kelembapan || 0);

        // Update Puncak Hari Ini
        if (curTemp > maxTemp) {
            maxTemp = curTemp;
            document.getElementById("max-temp").innerText = maxTemp.toFixed(1);
        }

        // Update Waktu Terakhir
        document.getElementById("last-update").innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update UI Utama
        updateUI(curTemp, curHum);
    }
});

// 5. Fungsi Logika Tampilan & Alarm
function updateUI(suhu, kelembapan) {
    document.getElementById("temp-val").innerText = suhu.toFixed(1);
    document.getElementById("hum-val").innerText = kelembapan.toFixed(1);

    const card = document.getElementById("temp-card");
    const alertBox = document.getElementById("alert-container");
    const alarm = document.getElementById("alarm-sound");

    if (suhu > 27) {
        card.classList.add("alert-flash");
        alertBox.innerHTML = `
            <div class="flex items-center gap-2 text-red-700 bg-red-100 p-3 rounded-xl animate-bounce border border-red-300">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                <div class="flex flex-col leading-tight text-left">
                    <span class="font-black text-sm uppercase">BAHAYA PANAS!</span>
                    <span class="text-[10px] font-bold italic">> 27°C Terdeteksi</span>
                </div>
            </div>`;
        
        // Putar Alarm (Butuh interaksi klik pertama kali oleh user)
        alarm.play().catch(() => {});

        // Notifikasi Push Desktop
        if (!notificationSent && Notification.permission === "granted") {
            new Notification("ALARM OVERHEAT!", {
                body: `Suhu Ruang Server kritis: ${suhu}°C`,
                icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png"
            });
            notificationSent = true;
        }
    } else {
        card.classList.remove("alert-flash");
        alertBox.innerHTML = "";
        alarm.pause();
        alarm.currentTime = 0;
        notificationSent = false;
    }

    // Update Grafik Secara Real-time
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    [ {chart: tempChart, val: suhu}, {chart: humChart, val: kelembapan} ].forEach(item => {
        item.chart.data.labels.push(time);
        item.chart.data.datasets[0].data.push(item.val);
        
        // Batasi grafik maksimal 12 titik data (sekitar 1 menit jika update per 5 detik)
        if (item.chart.data.labels.length > 12) {
            item.chart.data.labels.shift();
            item.chart.data.datasets[0].data.shift();
        }
        item.chart.update();
    });
}
