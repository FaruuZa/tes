/** UTILS.JS - Global Helpers */
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

const Utils = {
    getDist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    
    // FUNGSI RESIZE PENTING
    resize: (game) => {
        const wrapper = document.getElementById('game-viewport');
        if (wrapper && wrapper.offsetParent !== null) {
            // Ambil ukuran asli wrapper
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;
            
            // Set ukuran canvas internal (resolusi)
            CANVAS.width = w;
            CANVAS.height = h * 0.75; // 75% dari tinggi wrapper
            
            // Hitung scale agar 400x700 muat di layar
            // Kita pakai Math.min agar game selalu FIT di layar (tidak terpotong)
            game.scale = Math.min(CANVAS.width / CONFIG.logicWidth, CANVAS.height / CONFIG.logicHeight);
        }
    },

    lerpAngle: (a, b, t) => {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    },

};