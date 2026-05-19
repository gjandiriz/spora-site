console.log("js_estaciones cargado OK");

function guardarEstacion() {
    const nombre = document.getElementById("est-nombre").value.trim();
    const descripcion = document.getElementById("est-desc").value.trim();

    if (!nombre) {
        alert("Ingresá el nombre de la estación.");
        return;
    }

    callServer("crearEstacion", {
        nombre: nombre,
        desc: descripcion
    }, res => {
        console.log("Respuesta crear estación:", res);

        if (res.status === "ERROR") {
            alert("❌ " + res.msj);
            return;
        }

        alert(res.msj || "✅ Estación creada.");

        document.getElementById("est-nombre").value = "";
        document.getElementById("est-desc").value = "";

        mostrar("pantalla-menu");
    });
}
