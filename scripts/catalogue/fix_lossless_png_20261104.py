from pathlib import Path
import re
p=Path(__file__).resolve().parents[2]/"server/cpanel/idea-accounts-api/platform-ai.php"
s=p.read_text(encoding="utf8")
for before,after in [
    ("ob_start();imagejpeg($a,null,94);","ob_start();imagepng($a,null,6);"),
    ("file_put_contents($dir.'/result.jpg',$result,LOCK_EX)","file_put_contents($dir.'/result.png',$result,LOCK_EX)"),
    ("@chmod($dir.'/result.jpg',0600)","@chmod($dir.'/result.png',0600)"),
    ("ob_start();imagejpeg($base,null,96);","ob_start();imagepng($base,null,6);"),
]:
    assert before in s,before
    s=s.replace(before,after)
old="$source=platformAiDir($parent['id']).'/result.jpg';if($parent['state']!=='completed'||!is_file($source))"
new="$source=platformAiDir($parent['id']).'/result.png';if(!is_file($source))$source=platformAiDir($parent['id']).'/result.jpg';if($parent['state']!=='completed'||!is_file($source))"
assert s.count(old)==1
s=s.replace(old,new)
pattern=r"function platformAiDownload\(array \$u,string \$id\): never\{[^\r\n]*\}"
replacement="""function platformAiDownload(array $u,string $id): never{
 $job=platformAiJob($u,$id);
 $dir=platformAiDir($id);
 $png=$dir.'/result.png';
 $path=is_file($png)?$png:$dir.'/result.jpg';
 if($job['state']!=='completed'||!is_file($path))accountError(404,'IMAGE_NOT_READY');
 $isPng=$path===$png;
 header('Content-Type: '.($isPng?'image/png':'image/jpeg'));
 header('Content-Disposition: inline; filename="IDEA-design-'.$id.($isPng?'.png':'.jpg').'"');
 header('Content-Length: '.filesize($path));
 session_write_close();
 readfile($path);exit;
}"""
s,n=re.subn(pattern,lambda _:replacement,s)
assert n==1,n
assert "result.png" in s
p.write_text(s,encoding="utf8")
print("LOSSLESS_PNG_RESULT_AND_OLD_JPEG_COMPAT",p)
