$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:4000/')
$listener.Start()
Write-Host 'Server on http://localhost:3000'
while($listener.IsListening){
    $ctx = $listener.GetContext()
    $url = $ctx.Request.Url.LocalPath
    if($url -eq '/'){$url='/index.html'}
    $file = Join-Path 'c:\Users\mybie\bedarev' ($url.TrimStart('/').Replace('/','\'))
    if((Test-Path $file) -and (Get-Item $file).PSIsContainer){$file = Join-Path $file 'index.html'}
    $resp = $ctx.Response
    if(Test-Path $file -PathType Leaf){
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file)
        $ct = switch($ext){'.html'{'text/html;charset=utf-8'}'.css'{'text/css;charset=utf-8'}'.js'{'application/javascript;charset=utf-8'}'.png'{'image/png'}'.svg'{'image/svg+xml'}'.ico'{'image/x-icon'}default{'application/octet-stream'}}
        $resp.ContentType=$ct
        $resp.ContentLength64=$bytes.Length
        $resp.OutputStream.Write($bytes,0,$bytes.Length)
    }else{
        $resp.StatusCode=404
        $b=[Text.Encoding]::UTF8.GetBytes('404')
        $resp.OutputStream.Write($b,0,$b.Length)
    }
    $resp.OutputStream.Close()
}
