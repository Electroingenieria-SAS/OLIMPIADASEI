<?php
/** Panel de resultados. Definir EI_PIXEL_ADMIN_PASSWORD en el servidor. */
declare(strict_types=1);
session_name('ei_pixel_admin');
session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','samesite'=>'Strict']);
session_start();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
$adminPassword = getenv('EI_PIXEL_ADMIN_PASSWORD') ?: '';
function h(mixed $x):string{return htmlspecialchars((string)$x,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'&&isset($_POST['password'])){
    if(strlen($adminPassword)>=12&&hash_equals($adminPassword,(string)$_POST['password'])){session_regenerate_id(true);$_SESSION['authenticated']=true;header('Location: admin.php');exit;}
    $error='Contraseña incorrecta o acceso de administración sin configurar.';
}
if(isset($_POST['logout'])){$_SESSION=[];session_destroy();header('Location: admin.php');exit;}
$authorized=($_SESSION['authenticated']??false)===true&&strlen($adminPassword)>=12;
if(!$authorized):?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Administración · Olimpiadas EI Pixel</title><link rel="stylesheet" href="css/styles.css"></head><body><div class="page-shell" style="max-width:650px;padding-top:10vh"><div class="panel"><div class="section-kicker">ÁREA RESERVADA</div><h1>🔐 Administración</h1><p class="text-muted">Solo personas autorizadas por la organización pueden consultar el registro completo y descargar resultados.</p><?php if($error):?><p class="feedback error"><?=h($error)?></p><?php endif; ?>
<?php if(strlen($adminPassword)<12):?><p class="feedback error">Este panel está desactivado. Configure en el servidor <code>EI_PIXEL_ADMIN_PASSWORD</code> con una contraseña de 12 caracteres o más.</p><?php else:?><form method="post"><div class="field"><label for="password">Contraseña de administrador</label><input type="password" id="password" name="password" required autocomplete="current-password"></div><button class="btn btn-primary" type="submit">INGRESAR</button></form><?php endif;?>
<p style="margin-top:25px"><a href="index.html">← Volver al juego</a></p></div></div></body></html>
<?php exit;endif;
$path=__DIR__.'/storage/players.db.php';$db=['players'=>[],'scores'=>[]];
if(file_exists($path)&&($fp=@fopen($path,'rb'))!==false){flock($fp,LOCK_SH);$raw=stream_get_contents($fp);flock($fp,LOCK_UN);fclose($fp);$prefix='<?php exit; ?>'."\n";if(str_starts_with($raw,$prefix))$db=json_decode(substr($raw,strlen($prefix)),true)?:$db;}
$rows=[];foreach(($db['players']??[]) as $id=>$p){$score=$db['scores'][$id]??[];$rows[]=['name'=>$p['name'],'alias'=>$p['alias'],'area'=>$p['area'],'scores'=>$score,'total'=>array_sum($score),'completed'=>count($score),'registered_at'=>$p['registered_at']??''];}
usort($rows,fn($a,$b)=>($b['total']<=>$a['total'])?:($b['completed']<=>$a['completed']));
$winners=[];foreach($rows as $r){if(!isset($winners[$r['area']])&&$r['completed']>0)$winners[$r['area']]=$r;}
$modes=['agility'=>'Agilidad','memory'=>'Memoria','case'=>'Caso','logic'=>'Lógica','knowledge'=>'Conocimiento'];
if(($_GET['download']??'')==='csv'){
    header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="resultados_olimpiadas_ei.csv"');
    $out=fopen('php://output','wb');fwrite($out,"\xEF\xBB\xBF");fputcsv($out,array_merge(['Nombre','Alias','Área'],array_values($modes),['Total','Retos completados','Fecha registro']),';');
    foreach($rows as $r){$values=[$r['name'],$r['alias'],$r['area']];foreach($modes as $key=>$_)$values[]=$r['scores'][$key]??'';$values[]=$r['total'];$values[]=$r['completed'];$values[]=$r['registered_at'];fputcsv($out,$values,';');}fclose($out);exit;
}
?><!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel administrativo · Olimpiadas EI</title><link rel="stylesheet" href="css/styles.css"><style>.admin-table{width:100%;border-collapse:collapse}.admin-table th,.admin-table td{padding:12px;border-bottom:1px solid #365782;text-align:left;font-size:12px}.admin-table th{color:#acd3ff}.admin-table td:last-child{color:#ffdd70;font-weight:900}.admin-table-wrap{overflow:auto}</style></head><body><div class="page-shell"><header class="site-header"><a class="logo-button" href="index.html"><img class="brand-logo" src="assets/logo-ei.png" alt="Electroingeniería"></a><form method="post"><button type="submit" name="logout" value="1" class="btn btn-outline btn-sm">Cerrar sesión</button></form></header><div class="ranking-page"><div class="section-kicker">ADMINISTRACIÓN PRIVADA</div><h1>🏆 Resultados y ganadores</h1><p class="text-muted">Consulta y exporta datos. La organización debe verificar la legitimidad de los resultados antes de entregar premios.</p><div class="cta-row"><a class="btn btn-primary" href="?download=csv">↓ Exportar resultados (CSV)</a><a class="btn btn-outline" href="index.html">← Volver al juego</a></div><div class="ranking-grid" style="margin:26px 0"><section class="panel"><h3>Participantes</h3><p style="font-size:30px;color:#ffdf77;font-weight:900;margin:0"><?=count($rows)?></p><p class="text-muted">Registros totales del evento</p></section><section class="panel"><h3>Ganadores provisionales</h3><?php foreach($winners as $area=>$r):?><div class="rank-winner"><span>🏅 <strong><?=h($area)?></strong><br><small><?=h($r['alias'])?></small></span><b><?=number_format($r['total'],0,',','.')?> PT</b></div><?php endforeach;?><?php if(!$winners):?><p class="text-muted">Aún no hay resultados.</p><?php endif;?></section></div><section class="panel"><h3>Detalle de participantes</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Nombre</th><th>Alias</th><th>Área</th><?php foreach($modes as $label):?><th><?=h($label)?></th><?php endforeach;?><th>Total</th></tr></thead><tbody><?php foreach($rows as $r):?><tr><td><?=h($r['name'])?></td><td><?=h($r['alias'])?></td><td><?=h($r['area'])?></td><?php foreach($modes as $key=>$_):?><td><?=isset($r['scores'][$key])?h($r['scores'][$key]):'—'?></td><?php endforeach;?><td><?=number_format($r['total'],0,',','.')?></td></tr><?php endforeach;?></tbody></table></div></section></div></div></body></html>
