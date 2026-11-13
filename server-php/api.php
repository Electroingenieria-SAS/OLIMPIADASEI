<?php
/**
 * API para Olimpiadas EI Pixel, PHP 8+. Persistencia local con flock(), sin MySQL.
 * En producción: HTTPS, directorio storage protegido y revisión de reglas anti-trampa.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

const MODES = ['agility', 'memory', 'case', 'logic', 'knowledge'];
const AREAS = ['Administración', 'Almacén', 'Calidad', 'Comercial', 'Compras', 'Contabilidad', 'Despachos', 'Gestión Humana', 'Ingeniería', 'Logística', 'Mantenimiento', 'Operaciones', 'Sistemas / TIC', 'SST', 'Otra área'];
// Configuración del evento. Para habilitar un reto cada día, definir fecha y true.
const EVENT_START = '';                 // Ejemplo: '2026-11-16' (lunes)
const LOCK_BY_DAY = false;             // true = abrir un reto por día, desde EVENT_START
const MAX_SCORE = 1000;
const APP_DATA_FILE = __DIR__ . '/storage/players.db.php';

date_default_timezone_set('America/Bogota');
function send(array $data, int $status = 200): never { http_response_code($status); echo json_encode(['ok' => $status < 400] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function abortRequest(string $message, int $status = 400): never { send(['error' => $message], $status); }
function input(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') abortRequest('Esta operación requiere POST.', 405);
    $length=(int)($_SERVER['CONTENT_LENGTH']??0);
    if ($length > 15000) abortRequest('Solicitud demasiado grande.', 413);
    $v=json_decode(file_get_contents('php://input'),true);
    if (!is_array($v)) abortRequest('Datos JSON inválidos.');
    return $v;
}
function textVal(mixed $value, int $limit=80): string {
    if(!is_string($value)) return '';
    $s=trim(preg_replace('/\s+/u',' ',strip_tags($value))??'');
    return function_exists('mb_substr')?mb_substr($s,0,$limit):substr($s,0,$limit);
}
function db(callable $fn): mixed {
    if(!is_dir(__DIR__.'/storage') && !mkdir(__DIR__.'/storage', 0700, true)) abortRequest('No existe un directorio de datos escribible.',500);
    $fp=@fopen(APP_DATA_FILE,'c+');
    if(!$fp) abortRequest('El servidor no puede abrir el almacenamiento.',500);
    if(!flock($fp, LOCK_EX)){fclose($fp);abortRequest('Error al bloquear almacenamiento.',500);}
    rewind($fp);$raw=stream_get_contents($fp);
    $prefix='<?php exit; ?>' . "\n";
    $json=is_string($raw)&&str_starts_with($raw,$prefix)?substr($raw,strlen($prefix)):'{}';
    $database=json_decode($json,true);
    if(!is_array($database))$database=[];
    $database+=['players'=>[],'runs'=>[],'scores'=>[]];
    try{
        $result=$fn($database);
        $encoded=$prefix.json_encode($database,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        rewind($fp);ftruncate($fp,0);fwrite($fp,$encoded);fflush($fp);
    }catch(Throwable $err){flock($fp,LOCK_UN);fclose($fp);throw $err;}
    flock($fp,LOCK_UN);fclose($fp);return $result;
}
function publicPlayer(array $p): array {return ['id'=>$p['id'],'name'=>$p['name'],'alias'=>$p['alias'],'area'=>$p['area'],'avatar'=>$p['avatar']??[]];}
function requirePlayer(array $d, array $db): array {
    $id=textVal($d['id']??'',40);$access=textVal($d['access_key']??'',120);
    if(!isset($db['players'][$id])||strlen($access)<20||!hash_equals($db['players'][$id]['access_hash'],hash('sha256',$access))) abortRequest('Credenciales incorrectas; recupera tu personaje.',403);
    return $db['players'][$id];
}
function publicScores(array $db,string $id): array {return $db['scores'][$id]??[];}
function allowed(string $mode): bool {
    if(!LOCK_BY_DAY || EVENT_START==='')return true;
    $index=array_search($mode,MODES,true);
    $unlock=(new DateTimeImmutable(EVENT_START.' 00:00:00'))->modify('+'.$index.' days');
    return new DateTimeImmutable('now') >= $unlock;
}
function ranks(array $db): array {
    $res=[];
    foreach($db['players'] as $id=>$p){$scores=publicScores($db,$id);if(!$scores)continue;
        $res[]=['id'=>$id,'alias'=>$p['alias'],'area'=>$p['area'],'total'=>array_sum($scores),'completed'=>count($scores),'scores'=>$scores];
    }
    usort($res,fn($a,$b)=>($b['total']<=>$a['total'])?:($b['completed']<=>$a['completed'])?:strcmp($a['alias'],$b['alias']));
    return $res;
}
$action=(string)($_GET['action']??'status');
try {
    switch($action){
        case 'status':
            if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')abortRequest('Método no permitido.',405);
            send(['config'=>['lock_by_day'=>LOCK_BY_DAY,'start_date'=>EVENT_START,'modes'=>MODES,'date'=>date('Y-m-d')]]);
        case 'register':
            $d=input();$name=textVal($d['name']??'');$alias=textVal($d['alias']??'',24);$area=textVal($d['area']??'',60);
            if(strlen($name)<4||strlen($alias)<3||!in_array($area,AREAS,true))abortRequest('Verifica nombre, alias y área.');
            $avatar=$d['avatar']??[];if(!is_array($avatar))$avatar=[];
            $avatar=array_intersect_key($avatar,array_flip(['skin','hair','hairColor','shirt','accessory','style','preset','hat']));
            foreach($avatar as $k=>$v)if(!is_scalar($v))unset($avatar[$k]);
            $id=bin2hex(random_bytes(10));$secret=bin2hex(random_bytes(24));
            $p=['id'=>$id,'name'=>$name,'alias'=>$alias,'area'=>$area,'avatar'=>$avatar,'access_hash'=>hash('sha256',$secret),'registered_at'=>date(DATE_ATOM)];
            db(function(array &$db)use($p,$id){
               foreach($db['players'] as $old){if(strcasecmp($old['area'],$p['area'])===0&&strcasecmp($old['alias'],$p['alias'])===0)abortRequest('El alias ya está ocupado en esta área.');}
               $db['players'][$id]=$p;
            });
            send(['player'=>publicPlayer($p),'scores'=>[],'access_key'=>$secret],201);
        case 'avatar':
            $d=input();$a=$d['avatar']??[];if(!is_array($a))abortRequest('Avatar inválido.');
            $a=array_intersect_key($a,array_flip(['skin','hair','hairColor','shirt','accessory','style','preset','hat']));
            foreach($a as $k=>$v){if(!is_scalar($v))unset($a[$k]);else $a[$k]=textVal((string)$v,20);}
            $updated=db(function(array &$db)use($d,$a){$p=requirePlayer($d,$db);$db['players'][$p['id']]['avatar']=$a;return publicPlayer($db['players'][$p['id']]);});
            send(['player'=>$updated]);
        case 'resume':
            $d=input();$result=db(function(array &$db)use($d){$p=requirePlayer($d,$db);return ['player'=>publicPlayer($p),'scores'=>publicScores($db,$p['id'])];});send($result);
        case 'start':
            $d=input();$mode=textVal($d['mode']??'',20);
            if(!in_array($mode,MODES,true))abortRequest('Modo no válido.');
            if(!allowed($mode))abortRequest('El desafío aún no está disponible.',403);
            $token=bin2hex(random_bytes(24));
            db(function(array &$db)use($d,$mode,$token){$p=requirePlayer($d,$db);$id=$p['id'];
                if(isset($db['scores'][$id][$mode]))abortRequest('Este desafío ya tiene un resultado oficial.',409);
                // Empezar otra ronda sustituye la anterior, pero no la registra.
                $db['runs'][$id][$mode]=['token_hash'=>hash('sha256',$token),'started'=>time()];
            });
            send(['token'=>$token,'mode'=>$mode,'limit'=>MAX_SCORE]);
        case 'finish':
            $d=input();$mode=textVal($d['mode']??'',20);$token=textVal($d['token']??'',120);
            if(!in_array($mode,MODES,true)||strlen($token)<20)abortRequest('Sesión de desafío inválida.',403);
            $score=$d['score']??null;
            if(!is_int($score)||$score<0||$score>MAX_SCORE)abortRequest('El puntaje está fuera del rango permitido.');
            $result=db(function(array &$db)use($d,$mode,$token,$score){$p=requirePlayer($d,$db);$id=$p['id'];
                if(isset($db['scores'][$id][$mode]))abortRequest('El resultado ya fue registrado.',409);
                $run=$db['runs'][$id][$mode]??null;
                if(!$run||!hash_equals($run['token_hash'],hash('sha256',$token)))abortRequest('No existe una partida válida activa.',403);
                $elapsed=time()-$run['started'];
                $min=['agility'=>4,'memory'=>5,'case'=>8,'logic'=>5,'knowledge'=>8][$mode];
                $max=['agility'=>135,'memory'=>150,'case'=>210,'logic'=>185,'knowledge'=>315][$mode];
                if($elapsed<$min||$elapsed>$max)abortRequest('Tiempo de partida fuera del rango válido.',409);
                $db['scores'][$id][$mode]=$score;
                unset($db['runs'][$id][$mode]);
                return ['scores'=>publicScores($db,$id),'total'=>array_sum($db['scores'][$id])];
            });send($result);
        case 'rankings':
            if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')abortRequest('Método no permitido.',405);
            $r=db(fn(array &$database)=>ranks($database));send(['rankings'=>$r]);
        default:abortRequest('Ruta no reconocida.',404);
    }
} catch(Throwable $err) {
    error_log('EI Pixel API: '. $err->getMessage());
    abortRequest('Error interno del servidor. Consulta el registro de PHP.',500);
}
