console.log("js_estaciones cargado OK");

function guardarEstacion() {
    const nombre = document.getElementById("est-nombre").value.trim();
    const descripcion = document.getElementById("est-desc").value.trim();

    if (!nombre) {
        alert("Ingresá el nombre de la estación.");
        return;
    }

    callServer("crearNueva_estacion", {
        nombre: nombre,
        descripcion: descripcion
    }, res => {
        alert(res);

        document.getElementById("est-nombre").value = "";
        document.getElementById("est-desc").value = "";

        mostrar("pantalla-menu");
    });
}
