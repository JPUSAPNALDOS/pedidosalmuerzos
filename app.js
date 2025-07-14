// 1. Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCyOM53d_eMSOi4AOjbS2roW7ZTZCJFRoM",
  authDomain: "pedidos-maracuya-villa-gratia.firebaseapp.com",
  databaseURL: "https://pedidos-maracuya-villa-gratia-default-rtdb.firebaseio.com",
  projectId: "pedidos-maracuya-villa-gratia",
  storageBucket: "pedidos-maracuya-villa-gratia.appspot.com",
  messagingSenderId: "133347942396",
  appId: "1:133347942396:web:d28e071c2449b8544c1c79"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. Fecha actual y helpers
function pad(n){return n<10?'0'+n:n;}
const hoy = new Date();
const yyyy = hoy.getFullYear();
const mm = pad(hoy.getMonth()+1);
const dd = pad(hoy.getDate());
const fechaStr = `${yyyy}-${mm}-${dd}`;
document.getElementById('fechaActual').textContent = hoy.toLocaleDateString('es-PE', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
document.getElementById('fecha-pedido').value = fechaStr;
document.getElementById('metodo-pago').value = "Credito";

// --- ARRAYS PARA PLATOS DE DESAYUNOS Y VARIADOS ---
let listaJugos = [];
let listaFondos = [];
let listaPlatosVariados = [];

// --- CARGA LOS PLATOS FIJOS AL INICIAR ---
db.ref('Jugos').on('value', snap => {
  listaJugos = [];
  snap.forEach(child => {
    const val = child.val();
    if(val) listaJugos.push(val.Nombre || val.nombre || val);
  });
});
db.ref('Fondos').on('value', snap => {
  listaFondos = [];
  snap.forEach(child => {
    const val = child.val();
    if(val) listaFondos.push(val.Nombre || val.nombre || val);
  });
});
db.ref('Variados').on('value', snap => {
  listaPlatosVariados = [];
  snap.forEach(child => {
    const val = child.val();
    if(val) listaPlatosVariados.push(val.Nombre || val.nombre || val);
  });
});

// ------------------- SELECTS DEPENDIENTES DESAYUNO (BEBIDAS Y FONDO) -------------------
let categoriasBebidas = [];
let productosPorCategoriaBebidas = {};
let categoriasFondo = [];
let productosPorCategoriaFondo = {};

function cargarDesayunoFirebase() {
  db.ref('Desayunos').once('value').then(snap => {
    categoriasBebidas = [];
    productosPorCategoriaBebidas = {};
    categoriasFondo = [];
    productosPorCategoriaFondo = {};

    snap.forEach(child => {
      const val = child.val();

      // Bebidas
      if(val.tipo === "Bebidas") {
        if(!categoriasBebidas.includes(val.categoria)) {
          categoriasBebidas.push(val.categoria);
          productosPorCategoriaBebidas[val.categoria] = [];
        }
        productosPorCategoriaBebidas[val.categoria].push(val.producto);
      }

      // Fondo
      if(val.tipo === "Fondo") {
        if(!categoriasFondo.includes(val.categoria)) {
          categoriasFondo.push(val.categoria);
          productosPorCategoriaFondo[val.categoria] = [];
        }
        productosPorCategoriaFondo[val.categoria].push(val.producto);
      }
    });

    llenarSelectSimple('bebidas-categoria', categoriasBebidas);
    llenarSelectSimple('fondo-categoria', categoriasFondo);
    llenarSelectSimple('bebidas-producto', []);
    llenarSelectSimple('fondo-producto', []);
  });
}

function llenarSelectSimple(id, array) {
  const sel = document.getElementById(id);
  if(!sel) return;
  sel.innerHTML = `<option value="">Selecciona</option>`;
  array.forEach(val => {
    sel.innerHTML += `<option value="${val}">${val}</option>`;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  cargarDesayunoFirebase();

  document.getElementById('bebidas-categoria').addEventListener('change', function(){
    const cat = this.value;
    llenarSelectSimple('bebidas-producto', cat ? productosPorCategoriaBebidas[cat] : []);
  });
  document.getElementById('fondo-categoria').addEventListener('change', function(){
    const cat = this.value;
    llenarSelectSimple('fondo-producto', cat ? productosPorCategoriaFondo[cat] : []);
  });
});

document.getElementById('tipo-pedido').addEventListener('change', function(){
  if(this.value === "Desayunos") cargarDesayunoFirebase();
  mostrarOcultarPromoBtn();
  actualizarLabelsPorTipo();
  cargarMenuPorFechaYTipo();
});

// --- CAMBIAR LABELS Y OCULTAR/mostrar INPUTS SEGÚN TIPO ---
function actualizarLabelsPorTipo() {
  const tipo = document.getElementById('tipo-pedido').value;
  const bloqueDesayuno = document.getElementById('bloque-desayuno');
  const bloqueGeneral = document.getElementById('bloque-general');
  if(bloqueDesayuno && bloqueGeneral) {
    bloqueDesayuno.style.display = (tipo === "Desayunos") ? '' : 'none';
    bloqueGeneral.style.display = (tipo === "Desayunos") ? 'none' : '';
  }
  const grupoEntrada = document.getElementById('grupo-entrada');
  const grupoPostre = document.getElementById('grupo-postre');
  if (tipo === "Variado") {
    if (grupoEntrada) grupoEntrada.style.display = 'none';
    if (grupoPostre) grupoPostre.style.display = 'none';
    document.getElementById('entrada').value = "";
    document.getElementById('postre').value = "";
  } else if (tipo === "Desayunos") {
    if (grupoEntrada) grupoEntrada.style.display = '';
    if (grupoPostre) grupoPostre.style.display = 'none';
    document.getElementById('postre').value = "nullahi";
  } else {
    if (grupoEntrada) grupoEntrada.style.display = '';
    if (grupoPostre) grupoPostre.style.display = '';
  }
  document.getElementById('label-menu-dia').textContent = (tipo === "Desayunos") ? "Jugo" : "Plato";
  document.getElementById('label-entrada').textContent = (tipo === "Desayunos") ? "Fondo" : "Entrada";
  document.getElementById('label-postre').textContent = (tipo === "Desayunos") ? "" : "Postre";
  const menuInput = document.getElementById('menu-dia');
  const entradaInput = document.getElementById('entrada');
  if (menuInput && entradaInput) {
    if (tipo === "Almuerzo") {
      menuInput.setAttribute('readonly', true);
      menuInput.classList.add('input-disabled');
      entradaInput.setAttribute('readonly', true);
      entradaInput.classList.add('input-disabled');
    } else {
      menuInput.removeAttribute('readonly');
      menuInput.classList.remove('input-disabled');
      entradaInput.removeAttribute('readonly');
      entradaInput.classList.remove('input-disabled');
    }
  }
}
document.getElementById('tipo-pedido').addEventListener('change', actualizarLabelsPorTipo);
actualizarLabelsPorTipo();

function cargarMenuPorFechaYTipo() {
  const fecha = document.getElementById('fecha-pedido').value;
  const tipo = document.getElementById('tipo-pedido').value;
  if (tipo === "Almuerzo") {
    db.ref(`Almuerzos/${fecha}`).once('value').then(snap => {
      const menuDia = snap.val();
      document.getElementById('menu-dia').value = (menuDia && menuDia["Menú"]) ? menuDia["Menú"] : 'No hay menú';
      document.getElementById('entrada').value = (menuDia && menuDia["Entrada"]) ? menuDia["Entrada"] : 'No hay entrada';
      document.getElementById('postre').value = (menuDia && menuDia["Postre"]) ? menuDia["Postre"] : 'No hay postre';
    });
  } else {
    document.getElementById('menu-dia').value = "";
    document.getElementById('entrada').value = "";
    document.getElementById('postre').value = (tipo === "Desayunos") ? "nullahi" : "";
  }
  actualizarLabelsPorTipo();
}
document.getElementById('fecha-pedido').addEventListener('change', cargarMenuPorFechaYTipo);
document.getElementById('tipo-pedido').addEventListener('change', cargarMenuPorFechaYTipo);
cargarMenuPorFechaYTipo();
actualizarLabelsPorTipo();

function mostrarOcultarPromoBtn() {
  const tipo = document.getElementById('tipo-pedido').value;
  document.getElementById('bloque-promocion-btn').style.display = (tipo === "Almuerzo") ? '' : 'none';
  document.getElementById('promo-semanal-block').style.display = 'none';
  document.getElementById('msg-promocion').textContent = '';
}
mostrarOcultarPromoBtn();

function formato(fecha) {
  let yyyy = fecha.getFullYear();
  let mm = (fecha.getMonth()+1).toString().padStart(2, '0');
  let dd = fecha.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Calcula lunes y viernes para cualquier fecha (yyyy-mm-dd)
function getLunesViernesSemana(fechaInicio) {
  let fecha = new Date(fechaInicio);
  let day = fecha.getDay();
  if(day === 6) {
    fecha.setDate(fecha.getDate() + 2);
  } else if(day === 0) {
    fecha.setDate(fecha.getDate() + 1);
  }
  day = fecha.getDay();
  let diffToMonday = day === 0 ? -6 : 1 - day;
  let lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diffToMonday);
  let viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  return { lunes, viernes };
}

// --- BLOQUE DE PROMOCIÓN SEMANAL ---
document.getElementById('btn-promocion-semanal').addEventListener('click', function() {
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  const nombre = document.getElementById('nombre-nino').value.trim();
  const fechaSeleccionada = document.getElementById('fecha-pedido').value;
  const observaciones = document.getElementById('observaciones').value.trim();
  const pagado = document.getElementById('metodo-pago').value === "Pagado";
  if (!nombre || nombre.length < 2) {
    document.getElementById('msg-promocion').textContent = 'Debes elegir un nombre válido';
    return;
  }
  if (!fechaSeleccionada) {
    document.getElementById('msg-promocion').textContent = 'Debes elegir una fecha válida';
    return;
  }
  let {lunes} = getLunesViernesSemana(fechaSeleccionada);
  let fechasSemana = [];
  let tmp = new Date(lunes);
  for (let i=0; i<5; i++) {
    fechasSemana.push(formato(tmp));
    tmp.setDate(tmp.getDate()+1);
  }
  let promesas = fechasSemana.map(f =>
    db.ref('pedidos')
      .orderByChild('fecha')
      .equalTo(f)
      .once('value')
      .then(snap => {
        let yaHay = false;
        snap.forEach(child => {
          let val = child.val();
          if(val.nombre && val.nombre.toLowerCase() === nombre.toLowerCase() && val.tipo === "Almuerzo") yaHay = true;
        });
        return {fecha: f, yaHay};
      })
  );
  Promise.all(promesas).then(resultados => {
    let conflictivos = resultados.filter(r => r.yaHay);
    if (conflictivos.length > 0) {
      document.getElementById('msg-promocion').textContent =
        "El alumno ya tiene pedido registrado en: " +
        conflictivos.map(r => r.fecha).join(", ") +
        ". Elimina esos pedidos antes de registrar una nueva promoción semanal.";
      return;
    }
    let registros = fechasSemana.map(f => {
      return db.ref('Almuerzos/' + f).once('value').then(snapMenu => {
        let menuDia = snapMenu.val() || {};
        let menu = menuDia["Menú"] || '';
        let entrada = menuDia["Entrada"] || '';
        let postre = menuDia["Postre"] || '';
        const nuevoRef = db.ref('pedidos').push();
        const pedido = {
          id: nuevoRef.key,
          nombre,
          fecha: f,
          tipo: "Almuerzo",
          menu,
          entrada,
          postre,
          pagado,
          estado: "Pendiente",
          observaciones,
          grado: window._gradoSeleccionado || '',
          nivel: window._nivelSeleccionado || '',
          salon: window._salonSeleccionado || ''
        };
        return nuevoRef.set(pedido);
      });
    });
    Promise.all(registros).then(()=>{
      document.getElementById('msg-promocion').textContent = "¡Promoción semanal registrada correctamente!";
      document.getElementById('form-pedido').reset();
      document.getElementById('fecha-pedido').value = fechaStr;
      cargarMenuPorFechaYTipo();
      actualizarLabelsPorTipo();
      cargarPedidos(document.getElementById('fecha-mostrar').value || fechaStr);
      setTimeout(()=>document.getElementById('msg-promocion').textContent = '', 2800);
    });
  });
});

// --- AUTOCOMPLETADO DE VARIADOS ---
window.filtrarPlatos = function(mantenerAbierto = false) {
  const tipo = document.getElementById('tipo-pedido').value;
  if (tipo !== "Variado") return;
  const input = document.getElementById('menu-dia');
  const sugerencias = document.getElementById('sugerenciasPlatos');
  const val = input.value.trim().toLowerCase();
  sugerencias.innerHTML = "";
  if (val.length < 1) { sugerencias.classList.remove('active'); return; }
  const encontrados = listaPlatosVariados.filter(j => j.toLowerCase().includes(val));
  encontrados.forEach(j => {
    let div = document.createElement('div');
    div.textContent = j;
    div.onclick = function(e) {
      input.value = j;
      sugerencias.classList.remove('active');
      sugerencias.innerHTML = "";
    };
    sugerencias.appendChild(div);
  });
  sugerencias.classList.add('active');
};
document.getElementById('menu-dia').addEventListener('input', function(){
  const tipo = document.getElementById('tipo-pedido').value;
  if (tipo === "Variado") filtrarPlatos(true);
});
document.getElementById('menu-dia').addEventListener('focus', function(){
  const tipo = document.getElementById('tipo-pedido').value;
  if (tipo === "Variado") filtrarPlatos(true);
});

// --- AUTOCOMPLETADO DE NOMBRES ---
let listaAlumnos = [];
db.ref('Nombres').on('value', snap => {
  listaAlumnos = [];
  snap.forEach(child => {
    const val = child.val();
    val._id = child.key;
    listaAlumnos.push(val);
  });
});
window._gradoSeleccionado = '';
window._nivelSeleccionado = '';
window._salonSeleccionado = '';

let alumnoSeleccionadoKey = '';
const btnEditarEst = document.getElementById('btn-editar-estudiante');

document.getElementById('nombre-nino').addEventListener('input', function() {
  const valor = this.value.trim().toLowerCase();
  const encontrado = listaAlumnos.find(
    a => (a.Nombre || '').trim().toLowerCase() === valor
  );
  if (encontrado) {
    alumnoSeleccionadoKey = encontrado._id;
    btnEditarEst.style.display = '';
    document.getElementById('infoAlumno').innerHTML = `
      <p><strong>Nombre:</strong> ${encontrado.Nombre || ''}</p>
      <p><strong>Grado:</strong> ${encontrado.Grado || ''}</p>
      <p><strong>Nivel:</strong> ${encontrado.Nivel || ''}</p>
      <p><strong>Salón:</strong> ${encontrado.Salon || ''}</p>
    `;
    window._gradoSeleccionado = encontrado.Grado || '';
    window._nivelSeleccionado = encontrado.Nivel || '';
    window._salonSeleccionado = encontrado.Salon || '';
  } else {
    alumnoSeleccionadoKey = '';
    btnEditarEst.style.display = 'none';
    if (this.value.trim() === '') {
      document.getElementById('infoAlumno').innerHTML = '';
      window._gradoSeleccionado = '';
      window._nivelSeleccionado = '';
      window._salonSeleccionado = '';
    }
  }
  window.filtrarNombres && window.filtrarNombres();
});

window.filtrarNombres = function() {
  const input = document.getElementById('nombre-nino');
  const nombreInput = input.value.trim().toLowerCase();
  const sugerencias = document.getElementById('sugerenciasNombres');
  sugerencias.innerHTML = "";
  if (nombreInput.length < 2) {
    sugerencias.classList.remove('active');
    return;
  }
  if (!listaAlumnos.length) {
    sugerencias.classList.remove('active');
    document.getElementById('infoAlumno').innerHTML =
      '<span style="color: #999; font-size: 0.9em;">Cargando estudiantes...</span>';
    return;
  }
  const encontrados = listaAlumnos.filter(alum =>
    alum.Nombre && alum.Nombre.toLowerCase().includes(nombreInput)
  );
  if (!encontrados.length) {
    sugerencias.classList.remove('active');
    document.getElementById('infoAlumno').innerHTML =
      '<span style="color: #999; font-size: 0.9em;">Sin coincidencias.</span>';
    return;
  }
  encontrados.forEach(alum => {
    let div = document.createElement('div');
    div.textContent = alum.Nombre + " (" + (alum.Grado || '-') + ", " + (alum.Salon || '-') + ")";
    div.onclick = function() {
      input.value = alum.Nombre;
      document.getElementById('infoAlumno').innerHTML = `
        <p><strong>Nombre:</strong> ${alum.Nombre || ''}</p>
        <p><strong>Grado:</strong> ${alum.Grado || ''}</p>
        <p><strong>Nivel:</strong> ${alum.Nivel || ''}</p>
        <p><strong>Salón:</strong> ${alum.Salon || ''}</p>
      `;
      sugerencias.classList.remove('active');
      window._gradoSeleccionado = alum.Grado || '';
      window._nivelSeleccionado = alum.Nivel || '';
      window._salonSeleccionado = alum.Salon || '';
      alumnoSeleccionadoKey = alum._id;
      btnEditarEst.style.display = '';
    };
    sugerencias.appendChild(div);
  });
  sugerencias.classList.add('active');
};

document.getElementById('nombre-nino').addEventListener('focus', window.filtrarNombres);

document.addEventListener('click', function(e){
  if(!e.target.closest('.form-group')) {
    document.getElementById('sugerenciasNombres').classList.remove('active');
  }
});
document.getElementById('nombre-nino').addEventListener('keydown', function(e){
  if (e.key === 'Enter') e.preventDefault();
});

// BOTÓN EDITAR - Modal edición
const modalBg = document.getElementById('modal-estudiante-bg');
const modal = document.getElementById('modal-estudiante');
const formEst = document.getElementById('form-estudiante');
const inputNombre = document.getElementById('modal-nombre');
const selectNivel = document.getElementById('modal-nivel');
const selectGrado = document.getElementById('modal-grado');
const inputSalon = document.getElementById('modal-salon');
const msgEst = document.getElementById('msg-estudiante-modal');
const btnCerrarModal = document.getElementById('btn-cerrar-modal-est');
const modalTitulo = document.getElementById('modal-estudiante-titulo');
const gradosPorNivel = {
  'Primaria': [
    '1er grado','2do grado','3er grado','4to grado','5to grado','6to grado'
  ],
  'Secundaria': [
    '1ro secundaria','2do secundaria','3ro secundaria','4to secundaria','5to secundaria'
  ]
};

btnEditarEst.onclick = function() {
  if(!alumnoSeleccionadoKey) return;
  const alum = listaAlumnos.find(a => a._id === alumnoSeleccionadoKey);
  if(!alum) return;
  formEst.reset();
  msgEst.textContent = '';
  modalTitulo.textContent = 'Editar estudiante';
  inputNombre.value = alum.Nombre || '';
  selectNivel.value = alum.Nivel || '';
  selectNivel.onchange();
  selectGrado.value = alum.Grado || '';
  inputSalon.value = alum.Salon || '';
  formEst.dataset.mode = 'editar';
  formEst.dataset.key = alum._id;
  modalBg.style.display = 'block';
  setTimeout(()=>inputNombre.focus(), 180);
};

selectNivel.onchange = function() {
  let nivel = this.value;
  selectGrado.innerHTML = '<option value="">Selecciona</option>';
  if (nivel && gradosPorNivel[nivel]) {
    gradosPorNivel[nivel].forEach(g => {
      selectGrado.innerHTML += `<option value="${g}">${g}</option>`;
    });
  }
};
btnCerrarModal.onclick = () => { modalBg.style.display = 'none'; };

formEst.onsubmit = e => {
  e.preventDefault();
  let nombre = inputNombre.value.trim();
  let nivel = selectNivel.value;
  let grado = selectGrado.value;
  let salon = inputSalon.value.trim();

  if(!nombre || !nivel || !grado) {
    msgEst.textContent = 'Completa todos los campos obligatorios.';
    return;
  }
  if(formEst.dataset.mode === 'editar') {
    let key = formEst.dataset.key;
    if(!key) { msgEst.textContent = 'Error al editar. Intenta otra vez.'; return; }
    db.ref('Nombres/'+key).update({
      Nombre: nombre,
      Nivel: nivel,
      Grado: grado,
      Salon: salon
    }).then(()=>{
      msgEst.textContent = '¡Estudiante actualizado!';
      modalBg.style.display = 'none';
      db.ref('Nombres').once('value', snap => {
        listaAlumnos = [];
        snap.forEach(child => {
          const val = child.val(); val._id = child.key; listaAlumnos.push(val);
        });
      });
    });
  } else {
    const yaExiste = listaAlumnos.some(a =>
      a.Nombre && a.Nombre.trim().toLowerCase() === nombre.toLowerCase()
    );
    if(yaExiste) {
      msgEst.textContent = 'Ya existe un estudiante con ese nombre.';
      return;
    }
    const nuevoRef = db.ref('Nombres').push();
    nuevoRef.set({
      Nombre: nombre,
      Nivel: nivel,
      Grado: grado,
      Salon: salon
    }).then(()=>{
      msgEst.textContent = '¡Estudiante agregado!';
      modalBg.style.display = 'none';
      db.ref('Nombres').once('value', snap => {
        listaAlumnos = [];
        snap.forEach(child => {
          const val = child.val(); val._id = child.key; listaAlumnos.push(val);
        });
      });
    });
  }
};
modalBg.onclick = function(e){
  if(e.target === modalBg) modalBg.style.display = 'none';
};

// -------------------- FILTRO FECHA MOSTRAR PEDIDOS ---------------------
document.getElementById('fecha-mostrar').addEventListener('change', function(){
  const fecha = this.value || fechaStr;
  cargarPedidos(fecha);
});

// -------------------- 5. Registrar pedido individual ---------------------
document.getElementById('form-pedido').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre-nino').value.trim();
  const fecha = document.getElementById('fecha-pedido').value;
  const tipo = document.getElementById('tipo-pedido').value;

  let menu = '', entrada = '', postre = '';
  if (tipo === "Desayunos") {
    menu = document.getElementById('bebidas-producto').value;
    entrada = document.getElementById('fondo-producto').value;
    postre = "";
  } else if (tipo === "Variado") {
    menu = document.getElementById('menu-dia').value;
    entrada = "";
    postre = "";
  } else {
    menu = document.getElementById('menu-dia').value;
    entrada = document.getElementById('entrada').value;
    postre = document.getElementById('postre').value;
  }

  const pagado = document.getElementById('metodo-pago').value === "Pagado";
  const observaciones = document.getElementById('observaciones').value.trim();

  if (!nombre || nombre.length < 2) {
    alert('Debes elegir un nombre válido');
    return;
  }

  if (tipo === "Almuerzo") {
    db.ref('pedidos')
      .orderByChild('fecha')
      .equalTo(fecha)
      .once('value').then(snap => {
        let yaHay = false;
        snap.forEach(child => {
          let val = child.val();
          if(val.nombre && val.nombre.toLowerCase() === nombre.toLowerCase() && val.tipo === "Almuerzo") yaHay = true;
        });
        if (yaHay) {
          alert('¡Este alumno ya tiene pedido de almuerzo para ese día!');
          return;
        }
        guardarPedido();
      });
  } else {
    guardarPedido();
  }

  function guardarPedido() {
    const nuevoRef = window._editandoPedidoID
      ? db.ref('pedidos/' + window._editandoPedidoID)
      : db.ref('pedidos').push();
    const pedido = {
      id: nuevoRef.key,
      nombre,
      fecha,
      tipo,
      menu,
      entrada,
      postre,
      pagado,
      estado: "Pendiente",
      observaciones,
      grado: window._gradoSeleccionado || '',
      nivel: window._nivelSeleccionado || '',
      salon: window._salonSeleccionado || ''
    };
    nuevoRef.set(pedido).then(()=>{
      document.getElementById('form-pedido').reset();
      document.getElementById('fecha-pedido').value = fechaStr;
      document.getElementById('infoAlumno').innerHTML = '';
      window._gradoSeleccionado = '';
      window._nivelSeleccionado = '';
      window._salonSeleccionado = '';
      window._editandoPedidoID = null;
      cargarMenuPorFechaYTipo();
      actualizarLabelsPorTipo();
      cargarPedidos(document.getElementById('fecha-mostrar').value || fechaStr);
      alert("Pedido registrado exitosamente!");
    });
  }
});

// 6. Cargar pedidos de una fecha
function cargarPedidos(fecha) {
  db.ref('pedidos').orderByChild('fecha').equalTo(fecha).on('value', snap => {
    const pedidos = snap.val() || {};
    renderizaPedidos(Object.values(pedidos));
    resumenPedidos(Object.values(pedidos));
  });
}

// 7. Renderizar tabla
function renderizaPedidos(lista) {
  const tbody = document.getElementById('tbody-pedidos');
  tbody.innerHTML = "";
  if(!lista.length){
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#aaa;">No hay pedidos hoy.</td></tr>`;
    return;
  }
  lista.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nombre || '-'}</td>
        <td>${p.tipo || '-'}</td>
        <td>${p.menu||'-'}<br><span class="small">${p.entrada||''} ${p.postre&&p.postre!=="nullahi" ? '· '+p.postre : ''}</span></td>
        <td><span class="badge badge-${p.pagado ? 'pagado' : 'pendiente'}">${p.pagado ? 'Pagado' : 'Pendiente'}</span></td>
        <td><span class="badge badge-${p.estado==='Pendiente'?'pendiente':(p.estado==='Entregado'?'pagado':'rechazado')}">${p.estado}</span></td>
        <td>${p.observaciones || "—"}</td>
        <td>
          ${p.estado === "Pendiente" ? `
            <button class="btn-tabla btn-mini btn-green" onclick="marcarEntregado('${p.id}')">Entregar</button>
            <button class="btn-tabla btn-mini btn-red" onclick="rechazarPedido('${p.id}')">Rechazar</button>
          ` : ""}
          <button class="btn-tabla btn-mini btn-azul" onclick="editarPedido('${p.id}')">Editar</button>
          <button class="btn-tabla btn-mini btn-grey" onclick="eliminarPedido('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// 8. Acciones
window.marcarEntregado = function(id){
  db.ref('pedidos/' + id).update({estado: "Entregado"});
}
window.rechazarPedido = function(id){
  db.ref('pedidos/' + id).update({estado: "Rechazado"});
}
window.eliminarPedido = function(id){
  if(confirm("¿Eliminar pedido?")) db.ref('pedidos/' + id).remove();
}
window.editarPedido = function(id) {
  db.ref('pedidos/' + id).once('value').then(snap => {
    const p = snap.val();
    if (!p) return alert('Pedido no encontrado');
    document.getElementById('nombre-nino').value = p.nombre;
    document.getElementById('fecha-pedido').value = p.fecha;
    document.getElementById('tipo-pedido').value = p.tipo;
    document.getElementById('observaciones').value = p.observaciones || "";
    actualizarLabelsPorTipo();
    cargarMenuPorFechaYTipo();

    if (p.tipo === "Desayunos") {
      setTimeout(() => {
        document.getElementById('bebidas-producto').value = p.menu || "";
        document.getElementById('fondo-producto').value = p.entrada || "";
      }, 350);
    } else if (p.tipo === "Variado") {
      document.getElementById('menu-dia').value = p.menu || "";
    } else {
      document.getElementById('menu-dia').value = p.menu || "";
      document.getElementById('entrada').value = p.entrada || "";
      document.getElementById('postre').value = p.postre || "";
    }
    document.getElementById('metodo-pago').value = p.pagado ? "Pagado" : "Credito";
    window._editandoPedidoID = id;
  });
};

// 9. Resumen de tarjetas
function resumenPedidos(lista) {
  const total = lista.length;
  const entregados = lista.filter(p=>p.estado==="Entregado").length;
  const pendientes = lista.filter(p=>p.estado==="Pendiente").length;
  const peque = lista.filter(p =>
    (p.nivel && p.nivel.toLowerCase().includes("primaria")) &&
    (p.grado && (
      p.grado.toLowerCase().includes("1er") ||
      p.grado.toLowerCase().includes("2do") ||
      p.grado.toLowerCase().includes("3er")
    ))
  ).length;

  const cards = document.querySelectorAll('.admin-card-num');
  if(cards[0]) cards[0].textContent = total;
  if(cards[1]) cards[1].textContent = entregados;
  if(cards[2]) cards[2].textContent = pendientes;
  if(cards[3]) cards[3].textContent = peque;
}

// 10. Funciones imprimir/exportar
window.imprimirPedidos = function() {
  let filas = document.querySelectorAll("#tbody-pedidos tr");
  if (filas.length == 0 || filas[0].children[0].textContent.includes("No hay pedidos")) {
    alert("No hay pedidos para imprimir.");
    return;
  }
  let html = `
    <html>
    <head>
      <title>Pedidos de Hoy</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .pedido-tarjeta {
          border: 2px solid #0066cc;
          border-radius: 18px;
          padding: 18px 30px 18px 30px;
          margin: 20px auto;
          max-width: 430px;
          background: #f6faff;
          box-shadow: 0 4px 18px #005cbb15;
        }
        .pedido-tarjeta h2 {
          margin: 0 0 6px 0;
          font-size: 2em;
          color: #094785;
        }
        .pedido-tarjeta .pedido-info {
          font-size: 1.1em;
          margin: 4px 0 10px 0;
        }
        .pedido-tarjeta .pedido-observacion {
          color: #D2691E;
          font-weight: bold;
          font-size: 1.08em;
          margin-top: 6px;
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center">Pedidos de Hoy</h1>
  `;

  filas.forEach(fila => {
    let celdas = fila.children;
    if (celdas.length < 7) return;
    let nombre = celdas[0].textContent.trim();
    let tipo = celdas[1].textContent.trim();
    let detalles = celdas[2].textContent.trim();
    let estado = celdas[4].textContent.trim();
    let observacion = celdas[5].textContent.trim();
    html += `
      <div class="pedido-tarjeta">
        <h2>${nombre}</h2>
        <div class="pedido-info"><b>Tipo:</b> ${tipo}</div>
        <div class="pedido-info"><b>Pedido:</b> <span style="font-weight:bold">${detalles.replace(/\n/g, "<br>")}</span></div>
        <div class="pedido-info"><b>Estado:</b> ${estado}</div>
        ${observacion && observacion !== "—" ? `<div class="pedido-observacion">Observación: ${observacion}</div>` : ""}
      </div>
    `;
  });

  html += `
    </body>
    </html>
  `;

  let printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  setTimeout(() => printWindow.close(), 800);
};

// === CORREGIDO: Exportar Excel DIARIO usando punto y coma ===
window.exportarExcel = function() {
  let tabla = document.querySelector("table");
  let csv = [];
  for (let row of tabla.rows) {
    let cols = [];
    for (let cell of row.cells) {
      cols.push('"' + cell.innerText.replace(/"/g, '""') + '"');
    }
    csv.push(cols.join(";")); // <-- punto y coma
  }
  let contenido = csv.join("\n");
  let blob = new Blob([contenido], { type: 'text/csv' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "pedidos.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// === OPCIONAL: Si usas exportación semanal por rango de fechas, aquí también con ; ===
window.getFechasRango = function(inicio, fin) {
  let fechas = [];
  let curr = new Date(inicio);
  let finD = new Date(fin);
  while (curr <= finD) {
    fechas.push(curr.toISOString().slice(0,10));
    curr.setDate(curr.getDate()+1);
  }
  return fechas;
}
window.cargarPedidosRango = async function(fechas) {
  let pedidos = [];
  for(let f of fechas) {
    let snap = await db.ref('pedidos').orderByChild('fecha').equalTo(f).once('value');
    let lista = snap.val() ? Object.values(snap.val()) : [];
    pedidos = pedidos.concat(lista);
  }
  return pedidos;
}
window.exportarExcelSemanal = async function(fi, ff) {
  let fechas = window.getFechasRango(fi, ff);
  let pedidos = await window.cargarPedidosRango(fechas);
  if (!pedidos.length) {
    alert('No hay pedidos en este rango.');
    return;
  }
  let encabezados = [
    'Fecha','Estudiante','Tipo','Menú','Entrada','Postre','Pago','Estado','Observaciones'
  ];
  let csv = [encabezados.join(";")];
  pedidos.forEach(p=>{
    let fila = [
      p.fecha||'',
      `"${(p.nombre||'').replace(/"/g,'""')}"`,
      `"${(p.tipo||'').replace(/"/g,'""')}"`,
      `"${(p.menu||'').replace(/"/g,'""')}"`,
      `"${(p.entrada||'').replace(/"/g,'""')}"`,
      `"${(p.postre && p.postre!=="nullahi"?p.postre:'')}"`,
      p.pagado?'Pagado':'Pendiente',
      `"${(p.estado||'').replace(/"/g,'""')}"`,
      `"${(p.observaciones||'').replace(/"/g,'""')}"`,
    ];
    csv.push(fila.join(";"));
  });
  let contenido = csv.join("\n");
  let blob = new Blob([contenido], { type: 'text/csv' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `reporte_semanal_${fi}_a_${ff}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Si tienes tu botón semanal, lo puedes conectar así:
if (document.getElementById('btn-excel-semanal')) {
  document.getElementById('btn-excel-semanal').onclick = function() {
    let fi = document.getElementById('fecha-inicio').value;
    let ff = document.getElementById('fecha-fin').value;
    if (!fi || !ff || ff < fi) {
      alert('Selecciona un rango de fechas válido.');
      return;
    }
    window.exportarExcelSemanal(fi, ff);
  };
}

document.getElementById('fecha-mostrar').value = fechaStr;
cargarPedidos(fechaStr);

const btnAgregarEst = document.getElementById('btn-agregar-estudiante');
btnAgregarEst.onclick = () => {
  formEst.reset();
  msgEst.textContent = '';
  modalTitulo.textContent = 'Agregar estudiante';
  selectGrado.innerHTML = '<option value="">Selecciona nivel primero</option>';
  modalBg.style.display = 'block';
  formEst.dataset.mode = 'agregar';
  formEst.dataset.key = '';
  setTimeout(()=>inputNombre.focus(), 180);
};
