// js/escaneo.js
// Estas variables ya están declaradas en main.js, así que no hace falta poner 'let' de nuevo
// Pero las usamos aquí para la lógica del lector.

function encenderCamara() {
    if (isProcessing) return;
    const readerDiv = document.getElementById("reader");
    readerDiv.style.display = "block"; 
    
    html5QrCode = new Html5Qrcode("reader");

    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        // EL PARCHE CLAVE: Buscamos ambos formatos para que no falle en planta
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.QR_CODE, 
            Html5QrcodeSupportedFormats.CODE_128 
        ] 
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (txt) => {
            isProcessing = true;
            html5QrCode.stop().then(() => { 
                readerDiv.style.display = "none"; 
                procesarScan(txt); 
            });
        }
    ).catch(err => {
        console.error("Error al iniciar cámara: ", err);
        alert("No se pudo abrir la cámara. Revisá los permisos del navegador.");
    });
}

function registrarManual() {
    const id = document.getElementById('input-manual').value.trim();
    if (id) { 
        procesarScan(id); 
        document.getElementById('input-manual').value = ""; 
    }
}

function procesarScan(id) {
    const input = document.getElementById('input-scan');
    const log = document.getElementById('log-scan');
    input.value = "⌛ REGISTRANDO..."; 
    
    // Usamos la función callServer que está en main.js
    callServer("registrar", {id: id, estacion: estacionActual, usuario: usuarioActual}, res => {
        input.value = (res.status === "OK" ? "✅ " : "❌ ") + id;
        log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj}</div>` + log.innerHTML;
        setTimeout(() => { 
            input.value = "LISTO PARA ESCANEAR"; 
            isProcessing = false; 
        }, 2000);
    });
}
