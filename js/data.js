'use strict';
window.EI_DATA = {
  areas: ['Administración','Almacén','Calidad','Comercial','Compras','Contabilidad','Despachos','Gestión Humana','Ingeniería','Logística','Mantenimiento','Operaciones','Sistemas / TIC','SST','Otra área'],
  modes: [
    {id:'agility',day:1,title:'Agilidad mental',subtitle:'Decide en segundos',icon:'⚡',color:'#66ddff',time:80,description:'Decisiones rápidas ante situaciones de trabajo.'},
    {id:'memory',day:2,title:'Memoria',subtitle:'Encuentra las parejas',icon:'🧠',color:'#c2a2ff',time:100,description:'Empareja conceptos clave y sus símbolos.'},
    {id:'case',day:3,title:'Caso explorable',subtitle:'Investiga la bodega',icon:'🔎',color:'#ffcd68',time:160,description:'Recorre el escenario, busca pistas y toma decisiones.'},
    {id:'logic',day:4,title:'Lógica',subtitle:'Resuelve el proceso',icon:'🧩',color:'#68e5b3',time:150,description:'Secuencias, cálculo y razonamiento aplicado.'},
    {id:'knowledge',day:5,title:'Conocimiento',subtitle:'El gran concurso EI',icon:'🏆',color:'#ff90c0',time:240,description:'Trivia con comodines de calidad, SST y más.'}
  ],
  agility: [
    {topic:'Calidad documental',q:'Encuentras un formato sin código ni versión. ¿Qué haces?',options:['Lo usas igual','Consultas la versión vigente','Le inventas un código','Lo borras sin avisar'],a:1,why:'Se debe utilizar la versión controlada y vigente.'},
    {topic:'SST',q:'Detectas una superficie resbalosa sin señalizar.',options:['Pasas rápido','Aíslas y reportas el riesgo','Tomas una foto y te vas','Esperas al siguiente turno'],a:1,why:'Se controla o señaliza el peligro y se reporta.'},
    {topic:'Ciberseguridad',q:'Un correo extraño te pide tu contraseña.',options:['La envías','Abres el adjunto','Reportas el intento','Reenvías el correo a todos'],a:2,why:'Nunca compartas credenciales y reporta el phishing.'},
    {topic:'Logística',q:'Llegan 25 cajas y la remisión indica 30.',options:['Recibes 30','Registras diferencia y verificas','Guardas todo sin registro','Cambias el número manualmente'],a:1,why:'Las diferencias requieren verificación y trazabilidad.'},
    {topic:'Auditoría',q:'En una auditoría te piden evidencia de una actividad.',options:['Improvisas un registro','Presentas evidencia verificable','Respondes de memoria','Ocultas documentos'],a:1,why:'La evidencia debe ser objetiva y comprobable.'},
    {topic:'Matemáticas',q:'Una caja tiene 12 unidades. ¿Cuántas hay en 5 cajas?',options:['50','60','72','48'],a:1,why:'12 × 5 = 60 unidades.'},
    {topic:'Calidad',q:'Identificas un producto no conforme.',options:['Lo mezclas con el resto','Lo identificas y segregas','Lo despachas rápido','Lo marcas como conforme'],a:1,why:'Debe evitarse su uso o entrega no intencionados.'},
    {topic:'General EI',q:'¿Qué conviene hacer ante un error detectado en el proceso?',options:['Ocultarlo','Reportarlo y facilitar la mejora','Buscar culpables','Esperar hasta fin de mes'],a:1,why:'La detección temprana permite gestionar mejoras.'},
    {topic:'SST',q:'Tu equipo de protección está deteriorado.',options:['Lo sigues usando','Solicitas sustitución','Se lo prestas a otro','Lo escondes'],a:1,why:'El EPP debe estar en condiciones adecuadas.'},
    {topic:'Ciberseguridad',q:'Te levantas de un equipo compartido.',options:['Dejas sesión abierta','Bloqueas la pantalla','Escribes la clave en un papel','Compartes tu usuario'],a:1,why:'Bloquear la sesión protege información.'},
    {topic:'Logística',q:'Un despacho tiene dirección incompleta.',options:['Adivinas la calle','Verificas antes de enviar','Lo entregas a otro cliente','Ignoras el dato'],a:1,why:'La confirmación evita reprocesos y entregas fallidas.'},
    {topic:'Matemáticas',q:'De 80 unidades, 20 están reservadas. ¿Cuántas quedan?',options:['100','40','60','20'],a:2,why:'Disponibles = 80 − 20 = 60.'},
    {topic:'Auditoría',q:'Una no conformidad ya tiene un plan de acción.',options:['La cierras de inmediato','Verificas su eficacia','Eliminas el hallazgo','La ignoras'],a:1,why:'Se debe verificar que las acciones sean eficaces.'},
    {topic:'Calidad documental',q:'Una instrucción cambió oficialmente.',options:['Conservas ambas como vigentes','Retiras la obsoleta de uso','Usas la que prefieras','No avisas a nadie'],a:1,why:'El control documental evita el uso no intencional de obsoletos.'},
    {topic:'SST',q:'Se presenta un casi accidente.',options:['No se reporta','Se reporta y analiza','Se comenta sin registrar','Se espera una lesión'],a:1,why:'Los incidentes y casi accidentes aportan prevención.'},
    {topic:'Ciberseguridad',q:'Una USB desconocida aparece en tu escritorio.',options:['La conectas','La entregas al área competente','La prestas','La formateas en el PC'],a:1,why:'Los dispositivos desconocidos pueden comprometer sistemas.'},
    {topic:'Matemáticas',q:'Una ruta tarda 45 minutos y sale a las 9:15. ¿Hora estimada?',options:['9:45','10:00','10:15','11:00'],a:1,why:'9:15 + 45 min = 10:00.'},
    {topic:'Calidad',q:'Tienes dos registros con cifras distintas.',options:['Escoges el mayor','Contrastas fuentes y corriges trazabilidad','Borras uno','Los sumas'],a:1,why:'La integridad y verificación son prioritarias.'}
  ],
  memory: [
    {id:'doc',icon:'📄',name:'Documento'}, {id:'helmet',icon:'⛑️',name:'SST'},
    {id:'check',icon:'✅',name:'Calidad'}, {id:'lock',icon:'🔐',name:'Seguridad'},
    {id:'box',icon:'📦',name:'Logística'}, {id:'audit',icon:'📋',name:'Auditoría'},
    {id:'math',icon:'➕',name:'Cálculo'}, {id:'alert',icon:'⚠️',name:'Riesgo'}
  ],
  caseClues: [
    {id:'document',x:3,y:3,icon:'📋',name:'Documento sin versión',desc:'Encuentras un procedimiento impreso sin código de control ni versión.',q:'¿Cuál es la mejor acción?',options:['Seguir usándolo','Confirmar el documento vigente y retirar el obsoleto','Firmarlo y archivarlo'],a:1},
    {id:'inventory',x:10,y:2,icon:'📦',name:'Lote sin identificar',desc:'Una caja está lista para despacho, pero no tiene número de lote.',q:'¿Qué se debe hacer antes del despacho?',options:['Retener y verificar la trazabilidad','Despachar porque tiene etiqueta','Escribir un lote inventado'],a:0},
    {id:'cyber',x:17,y:5,icon:'💻',name:'Terminal sin bloqueo',desc:'Un equipo del almacén muestra una sesión activa sin supervisión.',q:'¿Cómo respondes?',options:['Revisar archivos ajenos','Dejarlo abierto','Bloquear o reportar la sesión expuesta'],a:2},
    {id:'safety',x:12,y:9,icon:'⚠️',name:'Pasillo obstruido',desc:'Una estiba ocupa parcialmente un pasillo de circulación.',q:'¿Cuál es la medida adecuada?',options:['Señalizar y gestionar el retiro seguro','Pasar por encima','Esperar a que alguien la mueva'],a:0}
  ],
  caseFinal: {q:'Has encontrado cuatro situaciones. ¿Cuál es la mejor decisión global?', options:['Liberar el pedido para evitar retrasos','Registrar hallazgos, controlar riesgos y liberar solo tras verificar correcciones','Eliminar los registros de los hallazgos','Resolver solo el problema de SST'],a:1},
  logic: [
    {topic:'Orden de procesos',type:'order',q:'Ordena las etapas de una entrega controlada.',items:['Recibir pedido','Verificar disponibilidad','Alistar producto','Facturar','Despachar'],why:'El pedido se valida antes del alistamiento y la salida.'},
    {topic:'Cálculo rápido',type:'choice',q:'Hay 70 unidades en inventario, 12 reservadas y 15 bloqueadas. ¿Disponibles?',options:['58 unidades','43 unidades','55 unidades','70 unidades'],a:1,why:'70 − 12 − 15 = 43 unidades.'},
    {topic:'Auditoría',type:'order',q:'Ordena el ciclo básico de una auditoría.',items:['Planificar','Recopilar evidencia','Evaluar hallazgos','Presentar resultados','Verificar acciones'],why:'Primero se planifica, luego se obtiene evidencia y se hace seguimiento.'},
    {topic:'Patrones',type:'choice',q:'Identifica el siguiente número: 3, 6, 12, 24, ¿?',options:['30','36','42','48'],a:3,why:'La serie se multiplica por dos.'},
    {topic:'Logística y tiempos',type:'choice',q:'Tres pedidos toman 15 minutos cada uno. Si empiezas 8:10, ¿cuándo terminas?',options:['8:40','8:45','8:55','9:10'],a:2,why:'3 × 15 = 45 minutos; 8:10 + 45 = 8:55.'},
    {topic:'Mejora continua',type:'order',q:'Ordena un ciclo sencillo de mejora.',items:['Identificar problema','Analizar causas','Definir acciones','Implementar','Verificar resultados'],why:'La mejora requiere análisis antes de la acción y evaluación posterior.'}
  ],
  knowledge: [
    {topic:'Calidad documental',q:'¿Qué permite identificar de forma única una versión de un documento?',options:['Su tamaño','Su código y revisión','El color del papel','La impresora'],a:1,why:'El código y la revisión facilitan la identificación y el control.'},
    {topic:'Auditoría',q:'¿Qué es una evidencia objetiva?',options:['Una opinión personal','Información verificable relacionada con un criterio','Un rumor','Una suposición'],a:1,why:'La evidencia debe poder verificarse.'},
    {topic:'SST',q:'¿Qué significa SST?',options:['Sistema de Soporte Técnico','Seguridad y Salud en el Trabajo','Servicio de Suministros y Transporte','Seguimiento Sectorial Total'],a:1,why:'SST corresponde a Seguridad y Salud en el Trabajo.'},
    {topic:'Ciberseguridad',q:'¿Cuál de estas contraseñas es preferible?',options:['12345678','MiNombre2026','Una frase larga, única y robusta','password'],a:2,why:'Las contraseñas únicas, largas y resistentes son recomendables.'},
    {topic:'Logística',q:'¿Qué es la trazabilidad de un producto?',options:['Su precio de venta','Poder seguir su identificación e historial','El color de la caja','La fecha de pago'],a:1,why:'Permite conocer el recorrido y antecedentes del producto.'},
    {topic:'Matemáticas',q:'Si compras a $80.000 y vendes a $100.000, ¿cuál es la utilidad bruta?',options:['$10.000','$15.000','$20.000','$25.000'],a:2,why:'Utilidad = venta − costo = $20.000.'},
    {topic:'Calidad',q:'¿Qué es una no conformidad?',options:['El incumplimiento de un requisito','Una queja sin revisar','Una sugerencia','Una felicitación'],a:0,why:'Es el incumplimiento de un requisito establecido.'},
    {topic:'General EI',q:'¿Qué favorece la mejora continua de la empresa?',options:['Ocultar fallas','Medir procesos y actuar sobre resultados','Evitar la capacitación','Ignorar sugerencias'],a:1,why:'Las decisiones basadas en resultados impulsan la mejora.'},
    {topic:'SST',q:'¿Cuál es un ejemplo de acción preventiva frente a un riesgo?',options:['Ignorar condiciones peligrosas','Inspeccionar y controlar riesgos','Esperar a que ocurra un accidente','Quitar toda señalización'],a:1,why:'Identificar y controlar riesgos evita incidentes.'},
    {topic:'Ciberseguridad',q:'¿Qué protege la autenticación multifactor?',options:['Solo archivos PDF','El acceso a una cuenta con un factor adicional','El color de la pantalla','La velocidad del internet'],a:1,why:'El segundo factor añade una barrera de seguridad.'},
    {topic:'Auditoría',q:'¿Cuál es la función principal de los criterios de auditoría?',options:['Decorar el informe','Ser la referencia para evaluar la evidencia','Sustituir entrevistas','Ocultar hallazgos'],a:1,why:'Los criterios establecen contra qué se evalúa.'},
    {topic:'Matemáticas',q:'¿Cuál es el 10 % de 250?',options:['2,5','20','25','50'],a:2,why:'250 × 0,10 = 25.'},
    {topic:'Logística',q:'¿Cuál documento suele acompañar un despacho para registrar lo entregado?',options:['Acta de vacaciones','Remisión','Hoja de vida','Formulario de vacaciones'],a:1,why:'La remisión soporta la entrega de mercancías.'},
    {topic:'Calidad documental',q:'¿Qué conviene hacer con documentos obsoletos?',options:['Dejarlos en uso','Controlar su retiro o identificarlos apropiadamente','Repartirlos sin informar','Cambiarles la fecha'],a:1,why:'Se previene su uso no intencional.'},
    {topic:'SST',q:'¿Qué debe ocurrir tras reportar un peligro?',options:['Olvidarlo','Evaluarlo y definir controles','Difundir rumores','Eliminar la evidencia'],a:1,why:'El reporte debe dar lugar a evaluación y tratamiento del riesgo.'},
    {topic:'Logística',q:'¿Qué significa una diferencia de inventario?',options:['Que todo coincide','Una discrepancia entre registro y existencia física','Un pedido nuevo','Una venta asegurada'],a:1,why:'La diferencia requiere análisis y conciliación.'},
    {topic:'Ciberseguridad',q:'¿Cuál es el principio de mínimo privilegio?',options:['Dar acceso a todo','Dar solo permisos necesarios para cada función','Compartir usuarios','Desactivar contraseñas'],a:1,why:'Se limita el acceso a lo estrictamente necesario.'},
    {topic:'Matemáticas',q:'¿Cuánto es 18 × 4?',options:['64','68','72','80'],a:2,why:'18 × 4 = 72.'},
    {topic:'Auditoría',q:'¿Qué hacer si se detecta un hallazgo?',options:['Documentar evidencia y gestionar tratamiento','Ocultarlo','Modificar registros sin trazabilidad','Culpar sin investigar'],a:0,why:'Los hallazgos deben sustentarse y gestionarse.'},
    {topic:'General EI',q:'¿Cuál comportamiento aporta más a la cultura de calidad?',options:['Evitar reportar mejoras','Colaborar, registrar y aprender de errores','Trabajar sin instrucciones','Ignorar controles'],a:1,why:'La calidad es una responsabilidad compartida.'},
    {topic:'Matemáticas',q:'Un pedido de 48 unidades se despacha en paquetes de 6. ¿Cuántos paquetes?',options:['6','8','12','9'],a:1,why:'48 ÷ 6 = 8 paquetes.'},
    {topic:'SST',q:'¿Qué significa EPP?',options:['Elemento de Protección Personal','Estadística de Producción Periódica','Entrega de Pedido Parcial','Equipo de Procesamiento Principal'],a:0,why:'EPP corresponde a Elemento de Protección Personal.'},
    {topic:'Calidad',q:'¿Qué indicador es útil para medir cumplimiento de entregas?',options:['Color de etiquetas','Porcentaje de entregas a tiempo','Número de ventanas','Edad de los computadores'],a:1,why:'La puntualidad es un indicador habitual del proceso.'},
    {topic:'Ciberseguridad',q:'¿Cuál práctica ayuda a detectar correos fraudulentos?',options:['Confiar en cualquier remitente','Verificar remitente, enlaces y solicitudes inusuales','Dar clic a todos los enlaces','Desactivar filtros'],a:1,why:'Revisar la autenticidad de mensajes es fundamental.'}
  ]
};
