function entrarAPuesto() {
        estacionActual = document.getElementById('select-puesto-op').value;
        if (!estacionActual) return alert("Seleccioná un puesto");
        document.getElementById('estacion-op').innerText = estacionActual;
        mostrar('pantalla-operario');
    }

function encenderCamara() {
    if (isProcessing) return;
    const readerDiv = document.getElementById("reader");
    readerDiv.style.display = "block"; 
    
    html5QrCode = new Html5Qrcode("reader");

    // Configuración refinada
    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 }, // Definir ancho y alto ayuda al enfoque
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
    });
}

    function registrarManual() {
        const id = document.getElementById('input-manual').value.trim();
        if (id) { procesarScan(id); document.getElementById('input-manual').value = ""; }
    }

    function procesarScan(id) {
    const input = document.getElementById('input-scan');
    const log = document.getElementById('log-scan');

    input.value = "⌛ REGISTRANDO...";

    let idFinal = id.trim();

    // 👉 Si el QR tiene más info (tipo OC=...|PIEZA=... o cosas así)
    // intentamos encontrar algo con formato 12345-01
    if (idFinal.includes("|") || idFinal.includes("=")) {
        const match = idFinal.match(/\d+-\d+/);
        if (match) {
            idFinal = match[0];
        }
    }

    callServer("registrar", { 
        id: idFinal, 
        estacion: estacionActual, 
        usuario: usuarioActual 
    }, res => {
        input.value = (res.status === "OK" ? "✅ " : "❌ ") + idFinal;
        log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj}</div>` + log.innerHTML;

        setTimeout(() => { 
            input.value = "LISTO PARA ESCANEAR"; 
            isProcessing = false; 
        }, 2000);
    });
}
    let idFinal = id;

    // 👉 SI ES QR, intentamos extraer ID
    if (tipoCodigo === "QR") {
        // formato esperado: ID=123-5|OC=123|...
        const partes = id.split("|");
        const idPart = partes.find(p => p.startsWith("ID="));

        if (idPart) {
            idFinal = idPart.replace("ID=", "").trim();
        }
    }

    callServer("registrar", { 
        id: idFinal, 
        estacion: estacionActual, 
        usuario: usuarioActual 
    }, res => {
        const input = document.getElementById('input-scan');
        const log = document.getElementById('log-scan');

        input.value = (res.status === "OK" ? "✅ " : "❌ ") + idFinal;
        log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj}</div>` + log.innerHTML;

        setTimeout(() => { 
            input.value = "LISTO PARA ESCANEAR"; 
            isProcessing = false; 
        }, 2000);
    });
});
            input.value = (res.status === "OK" ? "✅ " : "❌ ") + id;
            log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj}</div>` + log.innerHTML;
            setTimeout(() => { input.value = "LISTO PARA ESCANEAR"; isProcessing = false; }, 2000);
        });
    }
