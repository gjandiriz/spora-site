console.log("js_empresa cargado OK");

function abrirConfigEmpresa() {
    callServer("obtenerDatosEmpresa", {}, res => {
        document.getElementById('emp-nombre').value = res.RAZON_SOCIAL || "";
        document.getElementById('emp-cuit').value = res.CUIT || "";
        document.getElementById('emp-direccion').value = res.DIRECCION || "";
        document.getElementById('emp-logo').value = res.LOGO_URL || "";
        
        const dias = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
        const cont = document.getElementById('contenedor-horarios'); 
        cont.innerHTML = "";
        
        dias.forEach(d => {
            cont.innerHTML += `
                <div style="display:flex; gap:5px; font-size:10px; margin-bottom:2px;">
                    ${d} 
                    <input type="time" id="h-${d}-INI" value="${res[d+'_INI'] || '08:00'}"> 
                    a 
                    <input type="time" id="h-${d}-FIN" value="${res[d+'_FIN'] || '17:00'}">
                </div>`;
        });
        mostrar('pantalla-config-empresa');
    });
}

function salvarConfigEmpresa() {
    const conf = { 
        RAZON_SOCIAL: document.getElementById('emp-nombre').value, 
        CUIT: document.getElementById('emp-cuit').value, 
        DIRECCION: document.getElementById('emp-direccion').value, 
        LOGO_URL: document.getElementById('emp-logo').value 
    };
    
    const dias = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
    dias.forEach(d => { 
        conf[d+"_INI"] = document.getElementById(`h-${d}-INI`).value; 
        conf[d+"_FIN"] = document.getElementById(`h-${d}-FIN`).value; 
    });
    
    callServer("guardarDatosEmpresa", { config: JSON.stringify(conf) }, res => { 
        alert(res.msj); 
        mostrar('pantalla-menu'); 
    });
}
