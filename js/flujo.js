console.log("js_flujo cargado OK");

function cargarFlujograma() { 
    callServer("obtenerEstacionesFlujo", {}, res => { 
        estacionesParaFlujo = res; 
        renderFlujo(); 
        mostrar('pantalla-flujo'); 
    }); 
}

function renderFlujo() {
    const cont = document.getElementById('lista-flujo-estaciones');
    cont.innerHTML = "";

    estacionesParaFlujo.forEach((est, i) => {
        const activa = est.estado === "ACTIVO";

        cont.innerHTML += `
            <div class="item-lista" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${est.nombre}</span>

<input 
    type="number" 
    value="${est.orden}" 
    style="width:60px;"
    onchange="estacionesParaFlujo[${i}].orden = Number(this.value)"
>

                    <button onclick="moverEstacionArriba(${i})" style="width:32px; background:#444;">↑</button>
                    <button onclick="moverEstacionAbajo(${i})" style="width:32px; background:#444;">↓</button>
                </div>

                <button onclick="estacionesParaFlujo[${i}].estado=(estacionesParaFlujo[${i}].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'); renderFlujo();" 
                        style="width:50px; background:${activa ? '#27ae60' : '#c0392b'};">
                    ${activa ? 'ON' : 'OFF'}
                </button>
            </div>`;
    });
}
function moverEstacionArriba(i) {
    if (i === 0) return;

    const ordenActual = estacionesParaFlujo[i].orden;
    estacionesParaFlujo[i].orden = estacionesParaFlujo[i - 1].orden;
    estacionesParaFlujo[i - 1].orden = ordenActual;

    estacionesParaFlujo.sort((a, b) => a.orden - b.orden);
    renderFlujo();
}

function moverEstacionAbajo(i) {
    if (i === estacionesParaFlujo.length - 1) return;

    const ordenActual = estacionesParaFlujo[i].orden;
    estacionesParaFlujo[i].orden = estacionesParaFlujo[i + 1].orden;
    estacionesParaFlujo[i + 1].orden = ordenActual;

    estacionesParaFlujo.sort((a, b) => a.orden - b.orden);
    renderFlujo();
}

function salvarFlujo() { 
    callServer("guardarConfiguracionFlujo", { config: JSON.stringify(estacionesParaFlujo) }, res => { 
        alert(res.msj); 
        mostrar('pantalla-menu'); 
    }); 
}
