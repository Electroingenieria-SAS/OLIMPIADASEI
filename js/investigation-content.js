'use strict';
window.EI_INVESTIGATION_CONTENT={
  title:'El expediente del pedido equivocado',
  subtitle:'Investigación EI-2048 · Simulación formativa',
  intro:'En Electroingeniería se generó una alerta antes del despacho del pedido EI-2048. Los documentos no coinciden. Tu misión es revisar las evidencias de la biblioteca, identificar el riesgo y decidir cómo resolverlo sin comprometer la trazabilidad ni la solicitud del cliente.',
  evidence:{
    'INT-01':{label:'Archivo histórico',title:'Registro de materiales',document:'CATÁLOGO DE LOTES · Registro consultado',body:'Lote L-241: cable THHN negro 12 AWG. Lote L-314: cable THHN negro 14 AWG.',key:'Aunque ambos rollos son negros, 12 AWG y 14 AWG son calibres diferentes.',icon:'📚'},
    'INT-02':{label:'Sala de lectura',title:'Pedido original',document:'ORDEN EI-2048 · Solicitud del cliente',body:'Cable THHN negro, calibre 12 AWG, cantidad 100 metros. El cliente no autorizó sustituciones.',key:'La referencia solicitada es 12 AWG, sin autorización de cambios.',icon:'📖'},
    'INT-03':{label:'Dirección',title:'Documento de alistamiento',document:'PREPARACIÓN DE MERCANCÍA · EI-2048',body:'Se registró el lote L-314 como material preparado. La lista de verificación quedó incompleta.',key:'Se preparó el lote L-314; no hay constancia de una verificación completa.',icon:'📋'},
    'INT-04':{label:'Restauración',title:'Evidencia fotográfica',document:'FOTOGRAFÍA DEL ROLLO PREPARADO',body:'En la etiqueta visible del rollo preparado se lee: THHN negro 14 AWG, lote L-314.',key:'La foto confirma el calibre 14 AWG en el producto preparado.',icon:'🔍'},
    'INT-05':{label:'Recepción',title:'Reporte del incidente',document:'REPORTE PREVIO AL DESPACHO',body:'Pedido EI-2048. Estado: pendiente de despacho. Se detectó una diferencia documental que requiere verificación antes de liberar la mercancía.',key:'Todavía no se ha liberado el despacho: es posible prevenir el error.',icon:'📨'}
  },
  questions:[
    {title:'01 · Detectar la discrepancia',prompt:'¿Qué diferencia demuestra el expediente?',options:[['La entrega estaba retrasada, pero el producto es correcto','delay'],['El pedido exige 12 AWG, pero se preparó 14 AWG','14awgv12'],['El color negro del cable es incompatible con la orden','color']],
      why:'El pedido exige 12 AWG sin sustituciones. El lote L-314, consignado en alistamiento y visible en la fotografía, es 14 AWG.'},
    {title:'02 · Tomar la decisión inmediata',prompt:'¿Qué debe suceder antes de la liberación del pedido?',options:[['Despachar porque ambos rollos son negros','ship'],['Modificar el documento y despachar el rollo existente','paper'],['Detener el despacho y verificar el alistamiento','hold']],
      why:'No basta cambiar un registro: el material preparado no coincide con lo solicitado y no hay autorización para sustituir.'},
    {title:'03 · Ordenar la solución',prompt:'Selecciona las cinco acciones en el orden seguro.',steps:[['Inmovilizar el rollo incorrecto','hold'],['Verificar el material 12 AWG y disponibilidad','verify'],['Corregir el alistamiento','repack'],['Verificar calibre, cantidad y lote; registrar evidencia','trace'],['Autorizar despacho solo cuando cumpla','release']],
      why:'Primero se controla el material equivocado, luego se prepara y verifica el correcto; la autorización es el último paso.'}
  ],
  hints:['Contrasta la orden original con los lotes disponibles y la fotografía: la coincidencia de color no equivale a coincidencia de calibre.',
    'Un documento corregido no arregla por sí solo un producto alistado erróneamente. Debe controlarse el despacho.',
    'La liberación solo ocurre después de verificar físicamente el material correcto y documentar la trazabilidad.'],
  lesson:'Caso resuelto: despacho prevenido. Se identificó un rollo 14 AWG preparado para una orden de 12 AWG, sin sustitución autorizada. La decisión fue detener la liberación, verificar la disponibilidad de 12 AWG, corregir el alistamiento y conservar evidencia objetiva antes del despacho.'
};
