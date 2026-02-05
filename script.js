// 1. KONFIGURASI FIREBASE (PROYEK: suhu-dan-kelembapan-pkl)
const firebaseConfig = {
  apiKey: "AIzaSyC3dZ45fPaR8v8kyP8W_UpjmzG2q33Fzjc",
  authDomain: "suhu-dan-kelembapan-pkl.firebaseapp.com",
  databaseURL: "https://suhu-dan-kelembapan-pkl-default-rtdb.firebaseio.com/",
  projectId: "suhu-dan-kelembapan-pkl",
  storageBucket: "suhu-dan-kelembapan-pkl.appspot.com",
  messagingSenderId: "331872164478",
  appId: "1:331872164478:web:7587c6778f5a621160a005"
};

// 2. INISIALISASI
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const alarm = document.getElementById('alarm-sound');

// 3. INISIALISASI GRAFIK
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: false } },
    elements: { line: { tension: 0.4 }, point: { radius: 2 } }
};

const tempCtx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Suhu (°C)', data: [], borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true }] },
    options: chartOptions
});

const humCtx = document.getElementById('humChart').getContext('2d');
const humChart = new Chart(humCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Kelembapan (%)', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true }] },
    options: chartOptions
});

// 4. LOGIKA DATA REAL-TIME
let maxTempToday = 0;
const dbRef = database.ref('/monitoring');

dbRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const t = parseFloat(data.suhu).toFixed(1);
        const h = parseFloat(data.kelembapan).toFixed(1);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Update Angka di UI
        document.getElementById('temp-val').innerText = t;
        document.getElementById('hum-val').innerText = h;
        document.getElementById('last-update').innerText = timeNow;

        // Update Status & Animasi
        document.getElementById('db-status').innerText = "Online - Stabil";
        document.getElementById('status-dot').className = "relative inline-flex rounded-full h-3 w-3 bg-green-500";
        document.getElementById('ping-animate').className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75";

        // Update Puncak Suhu
        if (t > maxTempToday) {
            maxTempToday = t;
            document.getElementById('max-temp').innerText = maxTempToday;
        }

        // Logika Alarm (Bahaya jika suhu > 35°C)
        const tempCard = document.getElementById('temp-card');
        const alertBox = document.getElementById('alert-container');
        
        if (t > 35) {
            tempCard.classList.add('alert-flash');
            alertBox.innerHTML = `<p class="text-red-600 font-bold animate-bounce">⚠️ PERINGATAN: SUHU OVERHEAT!</p>`;
            alarm.play().catch(() => console.log("Interaksi user diperlukan untuk suara"));
        } else {
            tempCard.classList.remove('alert-flash');
            alertBox.innerHTML = "";
            alarm.pause();
            alarm.currentTime = 0;
        }

        // Update Grafik (Maksimal 15 data terakhir)
        [tempChart, humChart].forEach(chart => {
            if (chart.data.labels.length > 15) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
        });

        tempChart.data.labels.push(timeNow);
        tempChart.data.datasets[0].data.push(t);
        humChart.data.labels.push(timeNow);
        humChart.data.datasets[0].data.push(h);

        tempChart.update();
        humChart.update();
    }
}, (error) => {
    document.getElementById('db-status').innerText = "Terputus!";
    document.getElementById('status-dot').className = "relative inline-flex rounded-full h-3 w-3 bg-red-500";
    console.error(error);
});
