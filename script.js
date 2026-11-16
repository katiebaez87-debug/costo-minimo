// GENERAR TABLA
function crearTabla() {

    const filas = parseInt(document.getElementById("cantidadOrigenes").value);
    const columnas = parseInt(document.getElementById("cantidadDestinos").value);

    if (!Number.isInteger(filas) || !Number.isInteger(columnas) || filas < 1 || columnas < 1) {
        alert("Ingresá una cantidad válida de orígenes y destinos.");
        return;
    }

    let html = `<table>
        <tr>
            <th>Origen / Destino</th>`;

    for (let j = 0; j < columnas; j++) {
        html += `<th>
            <input type="text" id="destino${j}" value="Destino ${j + 1}">
        </th>`;
    }

    html += `<th>Oferta</th></tr>`;

    for (let i = 0; i < filas; i++) {

        html += `<tr>
            <th>
                <input type="text" id="origen${i}" value="Origen ${i + 1}">
            </th>`;

        for (let j = 0; j < columnas; j++) {
            html += `<td>
                <input type="number" min="0" step="any"
                id="costo${i}_${j}" placeholder="Costo">
            </td>`;
        }

        html += `<td>
            <input type="number" min="0" step="any"
            id="oferta${i}" placeholder="Oferta">
        </td></tr>`;
    }

    html += `<tr><th>Demanda</th>`;

    for (let j = 0; j < columnas; j++) {
        html += `<td>
            <input type="number" min="0" step="any"
            id="demanda${j}" placeholder="Demanda">
        </td>`;
    }

    html += `<td>-</td></tr></table>`;

    document.getElementById("contenedorTabla").innerHTML = html;
    document.getElementById("resultado").innerHTML =
        "<p>Los resultados aparecerán aquí.</p>";
}


// LEER NÚMEROS
function leerNumero(id) {

    const valor = document.getElementById(id).value;

    if (valor.trim() === "") {
        throw new Error("Completá todos los campos numéricos.");
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero < 0) {
        throw new Error("Ingresá solamente números positivos o cero.");
    }

    return numero;
}


// PROTEGER LOS NOMBRES
function escaparHTML(texto) {

    return String(texto).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}


// FORMATO DE NÚMEROS
function formato(numero) {
    return Number(numero.toFixed(2)).toString();
}


// RESOLVER MÉTODO DE COSTO MÍNIMO
function resolverCostoMinimo() {

    try {

        const filas = parseInt(document.getElementById("cantidadOrigenes").value);
        const columnas = parseInt(document.getElementById("cantidadDestinos").value);

        if (!Number.isInteger(filas) || !Number.isInteger(columnas) || filas < 1 || columnas < 1) {
            throw new Error("Primero generá una tabla válida.");
        }

        let costos = [];
        let oferta = [];
        let demanda = [];
        let nombresOrigen = [];
        let nombresDestino = [];

        // OBTENER NOMBRES DE ORÍGENES
        for (let i = 0; i < filas; i++) {
            nombresOrigen.push(
                document.getElementById(`origen${i}`).value || `Origen ${i + 1}`
            );
        }

        // OBTENER NOMBRES DE DESTINOS
        for (let j = 0; j < columnas; j++) {
            nombresDestino.push(
                document.getElementById(`destino${j}`).value || `Destino ${j + 1}`
            );
        }

        // OBTENER COSTOS Y OFERTAS
        for (let i = 0; i < filas; i++) {

            costos[i] = [];

            for (let j = 0; j < columnas; j++) {
                costos[i][j] = leerNumero(`costo${i}_${j}`);
            }

            oferta[i] = leerNumero(`oferta${i}`);
        }

        // OBTENER DEMANDAS
        for (let j = 0; j < columnas; j++) {
            demanda[j] = leerNumero(`demanda${j}`);
        }

        let totalOferta = oferta.reduce((a, b) => a + b, 0);
        let totalDemanda = demanda.reduce((a, b) => a + b, 0);

        let pasos = "";

        // AGREGAR DESTINO FICTICIO
        if (totalOferta > totalDemanda) {

            let diferencia = totalOferta - totalDemanda;

            nombresDestino.push("Destino ficticio");
            demanda.push(diferencia);

            for (let i = 0; i < filas; i++) {
                costos[i].push(0);
            }

            pasos += `<p>Se agregó un destino ficticio con una demanda de ${formato(diferencia)}.</p>`;
        }

        // AGREGAR ORIGEN FICTICIO
        else if (totalDemanda > totalOferta) {

            let diferencia = totalDemanda - totalOferta;

            nombresOrigen.push("Origen ficticio");
            oferta.push(diferencia);

            costos.push(Array(demanda.length).fill(0));

            pasos += `<p>Se agregó un origen ficticio con una oferta de ${formato(diferencia)}.</p>`;
        }

        else {
            pasos += `<p>La oferta y la demanda están equilibradas.</p>`;
        }

        const m = oferta.length;
        const n = demanda.length;

        let ofertaRestante = [...oferta];
        let demandaRestante = [...demanda];

        let asignaciones = Array.from(
            { length: m },
            () => Array(n).fill(0)
        );

        let filasActivas = Array(m).fill(true);
        let columnasActivas = Array(n).fill(true);

        let totalCosto = 0;
        let detalle = "";

        // BUSCAR EL MENOR COSTO
        while (
            filasActivas.some(Boolean) &&
            columnasActivas.some(Boolean)
        ) {

            let menorCosto = Infinity;
            let filaElegida = -1;
            let columnaElegida = -1;

            for (let i = 0; i < m; i++) {

                for (let j = 0; j < n; j++) {

                    if (
                        filasActivas[i] &&
                        columnasActivas[j] &&
                        costos[i][j] < menorCosto
                    ) {
                        menorCosto = costos[i][j];
                        filaElegida = i;
                        columnaElegida = j;
                    }
                }
            }

            if (filaElegida === -1) break;

            // CALCULAR ASIGNACIÓN
            let cantidad = Math.min(
                ofertaRestante[filaElegida],
                demandaRestante[columnaElegida]
            );

            asignaciones[filaElegida][columnaElegida] = cantidad;

            ofertaRestante[filaElegida] -= cantidad;
            demandaRestante[columnaElegida] -= cantidad;

            let costoAsignacion = cantidad * menorCosto;

            totalCosto += costoAsignacion;

            detalle += `<p>
                Se asignan <strong>${formato(cantidad)}</strong> unidades de
                ${escaparHTML(nombresOrigen[filaElegida])} a
                ${escaparHTML(nombresDestino[columnaElegida])}.
                Costo: ${formato(menorCosto)} × ${formato(cantidad)}
                = ${formato(costoAsignacion)}.
            </p>`;

            // ACTUALIZAR OFERTA Y DEMANDA
            if (ofertaRestante[filaElegida] === 0) {
                filasActivas[filaElegida] = false;
            }

            if (demandaRestante[columnaElegida] === 0) {
                columnasActivas[columnaElegida] = false;
            }
        }

        // CREAR MATRIZ RESULTANTE
        let tablaResultado = `
            <h3>Matriz de asignaciones</h3>
            <table>
                <tr>
                    <th>Origen / Destino</th>`;

        for (let j = 0; j < n; j++) {
            tablaResultado += `<th>${escaparHTML(nombresDestino[j])}</th>`;
        }

        tablaResultado += `<th>Oferta</th></tr>`;

        for (let i = 0; i < m; i++) {

            tablaResultado += `
                <tr>
                    <th>${escaparHTML(nombresOrigen[i])}</th>`;

            for (let j = 0; j < n; j++) {
                tablaResultado += `<td>${formato(asignaciones[i][j])}</td>`;
            }

            tablaResultado += `<td>${formato(oferta[i])}</td></tr>`;
        }

        tablaResultado += `<tr><th>Demanda</th>`;

        for (let j = 0; j < n; j++) {
            tablaResultado += `<td>${formato(demanda[j])}</td>`;
        }

        tablaResultado += `<td>-</td></tr></table>`;

        // MOSTRAR RESULTADOS
        document.getElementById("resultado").innerHTML = `
            <h2>Resultado del Método de Costo Mínimo</h2>

            ${pasos}

            ${tablaResultado}

            <h3>Procedimiento</h3>

            ${detalle}

            <h2>Costo total: ${formato(totalCosto)}</h2>

            <p>
                Se obtuvo una solución inicial utilizando
                el método de Costo Mínimo.
            </p>
        `;

    } catch (error) {

        alert(error.message);

    }
}


// GENERAR TABLA AL ABRIR LA PÁGINA
document.addEventListener("DOMContentLoaded", crearTabla);