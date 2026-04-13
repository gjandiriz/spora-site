console.log("js_buscador cargado OK");

function abrirBuscadorReimpresion() {
    mostrar('pantalla-reimpresion');
    document.getElementById('lista-resultados-busqueda').innerHTML = "";
    document.getElementById('input-busqueda-universal').value = "";
}

function ejecutarBusquedaUniversal() {
    const q = document.getElementById('input-busqueda-universal').value;
    if (q.length < 2) return alert("Escribí algo más...");

    const cont = document.getElementById('lista-resultados-busqueda');
    cont.innerHTML = "⌛ Buscando...";

    callServer("buscarPiezasUniversal", { query: q }, res => {
        cont.innerHTML = "";

        if (!res.piezas || res.piezas.length === 0) {
            cont.innerHTML = "❌ No se encontró nada.";
            return;
        }

        res.piezas.forEach(p => {
            cont.innerHTML += `
                <div class="item-lista" style="flex-direction:column; align-items:flex-start;">
                    <div style="width:100%; display:flex; justify-content:space-between;">
                        <b>${p[2]} | ${p[4]}</b>
                        <small>${p[3] || ""}</small>
                    </div>
                    <div style="font-size:10px; color:#aaa;">
                        OC: ${p[2]} | Proyecto: ${p[0]}
                    </div>
                    <button onclick="reimprimirEtiquetaUnica('${p[0]}', '${p[4]}')" style="background:#27ae60; padding:5px; margin-top:5px; font-size:10px; width:auto;">
                        🖨️ REIMPRIMIR
                    </button>
                </div>
            `;
        });
    });
}

function reimprimirEtiquetaUnica(idProy, idPieza) {
    callServer("obtenerConfiguracionMaestra", {}, configJSON => {
        if (!configJSON) {
            return alert("⚠️ No hay plantilla maestra guardada. Configurá una en el menú de etiquetas.");
        }

        const configRaw = JSON.parse(configJSON);
        // Ajuste de compatibilidad por si la config es el objeto nuevo o el array viejo
        const config = Array.isArray(configRaw) ? configRaw : (configRaw.campos || []);

        callServer("listaGestion", { tipo: "PIEZAS_PROYECTO", id: idProy }, res => {
            const pieza = res.piezas.find(p => String(p[4]) === String(idPieza));

            if (!pieza) {
                return alert("No se encontró la pieza.");
            }

            const modal = document.getElementById('modal-reimpresion');
            const cont = document.getElementById('area-ticket-reimpresion');

            modal.classList.remove('hidden');
            cont.innerHTML = "";

            let htmlCampos = "";
            config.forEach(item => {
                const nombreCol = res.encabezados[item.colIndex];
                const valor = pieza[item.colIndex];
                htmlCampos += `<div style="color:black; font-family:Arial; font-size:14px; margin-bottom:2px;">${item.conTitulo ? nombreCol + ': ' : ''}<b>${valor}</b></div>`;
            });

            const div = document.createElement('div');
            div.style = "background:white; padding:10px; border:1px solid #000; width:280px; text-align:center;";
            div.innerHTML = `${htmlCampos}<svg id="bar-modal-reimp"></svg>`;
            cont.appendChild(div);

            JsBarcode("#bar-modal-reimp", idPieza, {
                format: "CODE128",
                height: 40,
                displayValue: true
            });
        });
    });
}

function lanzarImpresionUnica() {
    const ticket = document.getElementById('area-ticket-reimpresion').innerHTML;
    const ventanaPrent = window.open('', '_blank');

    ventanaPrent.document.write(
        '<html><head><title>Imprimir Etiqueta</title><style>body{margin:0; display:flex; justify-content:center;} @page{size: auto; margin: 0mm;}</style></head><body onload="window.print(); window.close();">' +
        ticket +
        '</body></html>'
    );

    ventanaPrent.document.close();
    document.getElementById('modal-reimpresion').classList.add('hidden');
}
