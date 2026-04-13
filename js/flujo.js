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
            <div class="item-lista">
                <span>${est.nombre} (Ord: ${est.orden})</span>
                <button onclick="estacionesParaFlujo[${i}].estado=(estacionesParaFlujo[${i}].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'); renderFlujo();" 
                        style="width:50px; background:${activa ? '#27ae60' : '#c0392b'};">
                    ${activa ? 'ON' : 'OFF'}
                </button>
            </div>`;
    });
}

function salvarFlujo() { 
    callServer("guardarConfiguracionFlujo", { config: JSON.stringify(estacionesParaFlujo) }, res => { 
        alert(res.msj); 
        mostrar('pantalla-menu'); 
    }); 
}
