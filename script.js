
const firebaseConfig = {
    apiKey: "AIzaSyD01zcVYGHyVKCvJ1Yo196v03yMg1nJZ_k",
    authDomain: "final-projek-31c96.firebaseapp.com",
    databaseURL: "https://final-projek-31c96-default-rtdb.firebaseio.com",
    projectId: "final-projek-31c96",
    storageBucket: "final-projek-31c96.firebasestorage.app",
    messagingSenderId: "849386430505",
    appId: "1:849386430505:web:b49beee8a331d147443c38",
    measurementId: "G-EFKC882WNS"
};


firebase.initializeApp(firebaseConfig);
const database = firebase.database();


const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
        y: { 
            beginAtZero: false,
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        x: { grid: { display: false } }
    },
    elements: { 
        line: { tension: 0.4, borderWidth: 3 },
        point: { radius: 2 }
    }
};


const tempCtx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Suhu (°C)',
            data: [],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true
        }]
    },
    options: chartOptions
});


const humCtx = document.getElementById('humChart').getContext('2d');
const humChart = new Chart(humCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Kelembapan (%)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
        }]
    },
    options: chartOptions
});


let maxTemp = 0;
const alarmSound = document.getElementById('alarm-sound');
let isAlarmPlaying = false;

database.ref('/').on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        
        const s = parseFloat(data.suhu) || 0;
        const k = parseFloat(data.kelembapan) || 0;

        
        document.getElementById('temp-val').innerText = s.toFixed(1);
        document.getElementById('hum-val').innerText = k.toFixed(1);

        // Update Status Koneksi (Hijau = Online)
        document.getElementById('db-status').innerText = "Online";
        document.getElementById('db-status').className = "font-semibold text-green-500";
        document.getElementById('status-dot').className = "relative inline-flex rounded-full h-3 w-3 bg-green-500";
        document.getElementById('ping-animate').className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75";

        if (s > maxTemp) {
            maxTemp = s;
            document.getElementById('max-temp').innerText = maxTemp.toFixed(1);
        }

       
        const tempCard = document.getElementById('temp-card');
        const alertContainer = document.getElementById('alert-container');
        
        if (s > 35) {
            tempCard.classList.add('alert-flash');
            alertContainer.innerHTML = `<p class="text-red-600 font-bold animate-bounce text-sm">⚠️ BAHAYA: SUHU RUANG SERVER KRITIS!</p>`;
            
            // Putar Alarm (Hanya jika belum bunyi)
            if (!isAlarmPlaying) {
                alarmSound.play().catch(e => console.log("Browser memblokir audio otomatis. Klik di mana saja pada halaman untuk mengaktifkan."));
                isAlarmPlaying = true;
            }
        } else {
            tempCard.classList.remove('alert-flash');
            alertContainer.innerHTML = `<p class="text-green-500 font-semibold text-sm italic">✓ Suhu dalam batas aman</p>`;
            alarmSound.pause();
            alarmSound.currentTime = 0;
            isAlarmPlaying = false;
        }

       
        const now = new Date();
        const timeLabel = now.getHours() + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
        
        document.getElementById('last-update').innerText = now.getHours() + ":" + String(now.getMinutes()).padStart(2, '0');

        
        tempChart.data.labels.push(timeLabel);
        tempChart.data.datasets[0].data.push(s);
        
        
        humChart.data.labels.push(timeLabel);
        humChart.data.datasets[0].data.push(k);

        
        if (tempChart.data.labels.length > 10) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
            humChart.data.labels.shift();
            humChart.data.datasets[0].data.shift();
        }

        tempChart.update();
        humChart.update();
    }
}, (error) => {
  
    document.getElementById('db-status').innerText = "Offline/Terputus";
    document.getElementById('db-status').className = "font-semibold text-red-500";
    document.getElementById('status-dot').className = "relative inline-flex rounded-full h-3 w-3 bg-red-500";
});
