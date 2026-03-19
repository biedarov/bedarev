$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host 'Server on http://localhost:8080'
while($true){
  $ctx = $listener.GetContext()
  $url = $ctx.Request.Url.LocalPath
  if($url -eq '/') { $url = '/index.html' }
  $file = Join-Path 'c:\Users\mybie\bedarev' $url.TrimStart('/')
  $resp = $ctx.Response
  if(Test-Path $file){
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file)
    $types = @{'.html'='text/html;charset=utf-8';'.css'='text/css;charset=utf-8';'.js'='application/javascript;charset=utf-8';'.png'='image/png';'.svg'='image/svg+xml';'.ico'='image/x-icon'}
    if($types.ContainsKey($ext)){$resp.ContentType=$types[$ext]}
    $resp.ContentLength64=$bytes.Length
    $resp.OutputStream.Write($bytes,0,$bytes.Length)
  } else {
    $resp.StatusCode=404
    $bytes=[System.Text.Encoding]::UTF8.GetBytes('Not found')
    $resp.OutputStream.Write($bytes,0,$bytes.Length)
  }
  $resp.OutputStream.Close()
}
