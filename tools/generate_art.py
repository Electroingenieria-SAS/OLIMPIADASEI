"""Arte pixel original de Olimpiadas EI. No incluye el paquete SuperRetroRanch."""
from PIL import Image, ImageDraw
from pathlib import Path
import random
random.seed(28)
OUT=Path(__file__).resolve().parents[1]/'assets'/'pixel'; OUT.mkdir(parents=True,exist_ok=True)
P={'ink':'#091b36','dark':'#10264b','blue':'#163e78','blue2':'#225ca0','electric':'#4faff7','light':'#a2dafa','yellow':'#ffd75d','yellow2':'#f4b73b','gray':'#8aa7bd','white':'#e9f4ff','red':'#e36a72','green':'#45d1aa','teal':'#2b91b3','violet':'#987de5','wood':'#b17846','wood2':'#e1af6a'}

def rect(d,box,c):d.rectangle(box,fill=c)
def line(d,xy,c,w=1):d.line(xy,fill=c,width=w)
def outrect(d,box,fill,edge='ink',w=1):
 x0,y0,x1,y1=box;rect(d,(x0,y0,x1,y1),P[edge] if edge in P else edge);rect(d,(x0+w,y0+w,x1-w,y1-w),P.get(fill,fill))
def shadow(d,x,y,w):rect(d,(x,y,x+w,y+2),'#071527')
def box(d,x,y,s=20):
 shadow(d,x,y+s,s);outrect(d,(x,y,x+s,y+s),P['wood'],w=2);line(d,[(x+3,y+5),(x+s-2,y+5)],P['wood2'],2);rect(d,(x+s//2-2,y+2,x+s//2+1,y+s-4),P['wood2']);rect(d,(x+3,y+s-5,x+s-4,y+s-3),'#7d4d35')
def rack(d,x,y,w=50,h=45):
 rect(d,(x,y,x+w,y+h),'#12233e');rect(d,(x+3,y+2,x+w-3,y+h-2),'#244568')
 for yy in range(y+12,y+h-1,14):
  rect(d,(x+2,yy,x+w-2,yy+2),P['gray']);
  for xx in range(x+6,x+w-3,15):box(d,xx,yy-11,11)
 rect(d,(x,y,x+3,y+h),P['blue2']);rect(d,(x+w-3,y,x+w,y+h),P['blue2'])
def helmet(d,x,y,s=1,visor='white'):
 c=P.get(visor,visor);rect(d,(x+2*s,y+1*s,x+11*s,y+6*s),c);rect(d,(x,y+5*s,x+13*s,y+7*s),'#557a98');rect(d,(x+3*s,y+2*s,x+10*s,y+2*s),P['white'])
def worker(d,x,y,s=1,coat='blue',cap=True):
 # 16x25 pixel original worker (no derived sprite)
 c=P.get(coat,coat);shadow(d,x+1*s,y+24*s,16*s)
 rect(d,(x+4*s,y+18*s,x+8*s,y+23*s),'#26344e');rect(d,(x+10*s,y+18*s,x+14*s,y+23*s),'#26344e')
 rect(d,(x+3*s,y+12*s,x+14*s,y+19*s),c);rect(d,(x+2*s,y+13*s,x+4*s,y+20*s),'#d9a477');rect(d,(x+13*s,y+13*s,x+16*s,y+20*s),'#d9a477')
 rect(d,(x+4*s,y+5*s,x+13*s,y+13*s),'#e9b88b');rect(d,(x+3*s,y+4*s,x+14*s,y+6*s),'#493e45')
 rect(d,(x+6*s,y+9*s,x+7*s,y+10*s),P['ink']);rect(d,(x+11*s,y+9*s,x+12*s,y+10*s),P['ink'])
 rect(d,(x+8*s,y+16*s,x+10*s,y+18*s),P['yellow']);
 if cap:helmet(d,x+3*s,y,s,'white')
def shield(d,x,y):
 outrect(d,(x,y,x+17,y+22),P['electric'],w=2);rect(d,(x+5,y+7,x+12,y+15),P['ink']);rect(d,(x+7,y+8,x+10,y+15),P['yellow'])
def cloud(d,x,y):
 for a,b,c,e in [(0,8,25,12),(7,4,32,14),(16,1,34,12),(26,8,45,13)]:rect(d,(x+a,y+b,x+c,y+e),'#b8ddfd')
 rect(d,(x+2,y+12,x+43,y+13),'#4c91ce')
def sparkle(d,x,y,c):line(d,[(x-3,y),(x+3,y)],c);line(d,[(x,y-3),(x,y+3)],c)
def SAVE(im,name):im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST).save(OUT/name,optimize=True)

# Campus de electroingeniería, vectorialmente original en baja resolución.
im=Image.new('RGB',(256,144),P['dark']);d=ImageDraw.Draw(im)
for y in range(0,85):
  k=y//5;rect(d,(0,y,255,y),('#0e2a57' if k<4 else '#173c76' if k<9 else '#244b85' if k<13 else '#386ba0'))
for x,y in [(15,20),(171,11),(218,29)]:cloud(d,x,y)
for x,y in [(11,8),(68,15),(118,11),(207,8),(229,22)]:sparkle(d,x,y,'#91d6fc')
# sunlight bands
rect(d,(0,80,255,98),'#284a70');rect(d,(0,95,255,110),'#254869')
# building left office
rect(d,(6,49,109,99),'#07172f');rect(d,(9,43,108,93),'#8caac2');rect(d,(13,47,106,95),'#163e6b')
for yy in (54,73):
 for xx in (19,38,57,76):
  outrect(d,(xx,yy,xx+13,yy+15),'#62b6e1',w=2);rect(d,(xx+3,yy+3,xx+7,yy+12),'#255688');rect(d,(xx+7,yy+3,xx+10,yy+5),'#d3edf3')
rect(d,(12,42,110,47),'#daecf8');rect(d,(32,45,80,49),'#184889')
rect(d,(85,70,102,96),'#112744');rect(d,(91,74,98,91),'#3673ad')
# Logistics warehouse right
rect(d,(143,50,253,102),'#0d223b');rect(d,(146,40,253,93),'#7995ad');rect(d,(148,47,254,99),'#244a71')
for x in (151,189,227):
 outrect(d,(x,59,x+30,98),'#10213b',w=2)
 if x==189:rack(d,x+4,65,25,27)
 else:
  for j in range(3):box(d,x+5+j*8,83-j*3,9)
rect(d,(144,38,255,43),'#e2eefd');rect(d,(149,42,180,47),'#2d5ea1')
# Central competition arch
rect(d,(109,47,146,99),'#091e3a');rect(d,(108,38,148,91),'#d5e3f2');rect(d,(112,42,144,89),'#215ca5')
rect(d,(114,47,142,83),'#0e3058');rect(d,(120,51,137,77),'#63c5f1');rect(d,(120,65,137,77),'#1b4b78')
rect(d,(116,36,140,39),P['yellow']);rect(d,(120,31,138,37),P['yellow2']);rect(d,(125,28,132,34),P['yellow']);rect(d,(124,39,134,41),'#d08e3d')
# concrete / asphalt foreground
rect(d,(0,100,255,144),'#122b50');rect(d,(0,102,255,105),'#3f6485')
for y in range(107,145,9):
 for x in range(-8+(y//9)%2*9,256,19):rect(d,(x,y,x+17,y+7),'#1b3b61' if y%3 else '#244669')
rect(d,(0,121,255,124),'#91a6af')
for i in range(5):rect(d,(5+i*52,125,30+i*52,128),'#f6c859')
# Shrubs and pots
for x in (2,95,149,244):
 rect(d,(x,92,x+12,99),'#283b4a')
 for dx,dy,c in [(0,-9,'#2f9a7c'),(4,-14,'#3db998'),(11,-9,'#1d7771'),(3,-7,'#46c99c')]:rect(d,(x+dx,92+dy,x+dx+7,92+dy+7),c)
for x in (26,199):worker(d,x,101,1,'blue')
worker(d,111,100,1,'violet');box(d,162,107,18);box(d,179,113,13)
SAVE(im,'campus-ei.png')

# Individual card mini-scenes.
def base_scene(c1,c2):
 im=Image.new('RGB',(160,104),c1);d=ImageDraw.Draw(im)
 for y in range(104):
  if y%13==0:rect(d,(0,y,159,y),c2)
 for x in range(0,160,16):rect(d,(x,79,x+14,103),'#10264b')
 rect(d,(0,87,159,91),'#44688a');return im,d

# agility
im,d=base_scene('#12375f','#164477');rect(d,(0,68,160,87),'#152b4c')
rect(d,(12,28,65,71),'#12203b');outrect(d,(15,29,62,61),'#4aa6d6',w=3)
for yy in [37,44,51]:rect(d,(23,yy,48,yy+2),P['white'])
rect(d,(33,62,44,68),'#aec9e5');rect(d,(25,69,54,71),'#8ba9ca')
rect(d,(10,74,92,78),'#be835a');rect(d,(12,79,17,86),'#784b35');rect(d,(85,79,90,86),'#784b35')
worker(d,106,48,1,'yellow');box(d,96,68,15)
for x,y in ((75,22),(126,25),(93,14)):
 rect(d,(x,y,x+10,y+12),P['white']);rect(d,(x+2,y+3,x+8,y+4),P['blue2']);rect(d,(x+2,y+7,x+7,y+8),P['gray'])
outrect(d,(123,9,153,24),'#123658',w=2);rect(d,(129,16,134,18),P['yellow']);rect(d,(139,16,144,18),P['yellow'])
SAVE(im,'mode-agility.png')
# memory
im,d=base_scene('#252954','#39316a');rect(d,(13,17,147,78),'#122644')
for j in range(2):
 for i in range(4):
  x,y=24+i*30,23+j*25;c=[P['yellow'],P['electric'],P['red'],P['green']][i]
  outrect(d,(x,y,x+22,y+20),'#e7e8f5' if (i+j)%3==0 else P['blue2'],w=3)
  if (i+j)%3==0:rect(d,(x+8,y+8,x+13,y+10),c)
  else:rect(d,(x+8,y+6,x+13,y+13),'#c2eaff')
worker(d,67,72,1,'violet');sparkle(d,125,9,P['yellow']);SAVE(im,'mode-memory.png')
# case
im,d=base_scene('#153f50','#16576d');rack(d,5,25,46,59);rack(d,97,19,56,65);box(d,51,68,19);box(d,71,72,17)
rect(d,(52,9,95,44),'#f7e3b3');rect(d,(56,14,65,24),P['red']);rect(d,(68,16,85,19),P['blue2']);rect(d,(68,23,90,25),P['blue2']);rect(d,(57,30,88,32),'#8b6482')
worker(d,73,48,1,'blue');sparkle(d,92,38,P['yellow']);rect(d,(107,7,110,14),P['yellow']);SAVE(im,'mode-case.png')
# logic
im,d=base_scene('#0f3a46','#165e64');
for xx in (9,34,59,84,109,134):
 outrect(d,(xx,28,xx+18,47),P['blue2'],w=2);rect(d,(xx+5,34,xx+12,40),P['yellow'] if xx in (9,84) else P['electric'])
 if xx<134:rect(d,(xx+18,35,xx+24,39),P['yellow'])
for x in (26,80,128):
 for k in range(8):
  import math
  a=k*math.pi/4;cx=x+int(12*math.cos(a));cy=67+int(12*math.sin(a));rect(d,(cx-2,cy-2,cx+2,cy+2),P['yellow2'])
 rect(d,(x-8,59,x+8,75),'#536ca4');rect(d,(x-3,64,x+3,70),P['ink'])
SAVE(im,'mode-logic.png')
# knowledge
im,d=base_scene('#3b2c59','#574078');rect(d,(15,18,118,64),'#132e5b');outrect(d,(19,21,112,56),'#234e91',w=3)
for x in (29,58,87):outrect(d,(x,44,x+17,51),'#d3e9f8',w=2)
rect(d,(32,29,100,31),P['white']);rect(d,(32,35,76,37),P['white']);rect(d,(12,69,123,73),'#b08d63');worker(d,129,55,1,'blue')
rect(d,(123,10,151,31),P['yellow']);rect(d,(128,13,147,27),P['ink']);rect(d,(137,15,139,21),P['yellow']);rect(d,(137,24,139,26),P['yellow']);SAVE(im,'mode-knowledge.png')

# Warehouse tile atlas, 8 columns x 2 rows, each 32 pixels.
at=Image.new('RGBA',(256,64),(0,0,0,0));d=ImageDraw.Draw(at)
for ty in range(2):
 for tx in range(8):
  x,y=tx*32,ty*32
  rect(d,(x,y,x+31,y+31),'#24485e' if ty==0 else '#1b384e')
  for px in (0,16):
   rect(d,(x+px,y,x+px,y+31),'#284e64');rect(d,(x+px+1,y+15,x+px+14,y+15),'#2f5870')
  if tx==0 and ty==0:pass
  if tx==1 and ty==0:
   for z in range(4):line(d,[(x+z*7,y+31),(x+z*7+4,y+29)],'#a6b1b3')
  if tx==2 and ty==0:
   rect(d,(x,y,x+31,y+31),'#102746');rect(d,(x+2,y+2,x+29,y+7),'#4b769e');rect(d,(x+3,y+25,x+27,y+27),'#3b6089')
  if tx==3 and ty==0:
   rect(d,(x,y+1,x+31,y+31),'#11233b');box(d,x+2,y+4,27)
  if tx==4 and ty==0:
   rect(d,(x,y,x+31,y+31),'#10233b');rect(d,(x+2,y+2,x+29,y+29),'#365675');
   for yy in (5,19):
    rect(d,(x+2,y+yy+10,x+29,y+yy+12),P['gray']);box(d,x+5,y+yy,10);box(d,x+18,y+yy,10)
  if tx==5 and ty==0:
   rect(d,(x+4,y+2,x+27,y+28),P['wood']);rect(d,(x+10,y+6,x+22,y+21),P['white']);rect(d,(x+12,y+10,x+19,y+12),P['blue2'])
  if tx==6 and ty==0:
   rect(d,(x+2,y+3,x+28,y+28),'#1d5265');rect(d,(x+6,y+8,x+23,y+17),'#80ddfb');rect(d,(x+8,y+19,x+22,y+21),P['ink'])
  if tx==7 and ty==0:
   rect(d,(x+3,y+4,x+28,y+26),'#192a43');rect(d,(x+7,y+9,x+23,y+22),P['yellow']);rect(d,(x+15,y+11,x+17,y+18),P['ink']);rect(d,(x+15,y+20,x+17,y+22),P['ink'])
at.save(OUT/'case-tiles.png',optimize=True)
print('Generados',*[p.name for p in OUT.glob('*.png')],sep='\n - ')
