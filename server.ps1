# Simple HTTP Server in PowerShell using .NET
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started on http://localhost:$port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $filePath = Join-Path $rootPath $request.RawUrl.TrimStart('/')
    
    # Handle default file
    if ((Test-Path $filePath -PathType Container) -or $request.RawUrl -eq "/") {
        $filePath = Join-Path $rootPath "index.html"
    }
    
    if (Test-Path $filePath -PathType Leaf) {
        $file = Get-Item $filePath
        $content = [System.IO.File]::ReadAllBytes($filePath)
        
        # Set content type
        $ext = $file.Extension.ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html" }
            ".js" { "application/javascript" }
            ".css" { "text/css" }
            ".json" { "application/json" }
            ".csv" { "text/csv" }
            ".png" { "image/png" }
            ".jpg" { "image/jpeg" }
            ".gif" { "image/gif" }
            ".svg" { "image/svg+xml" }
            default { "application/octet-stream" }
        }
        
        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $notFound.Length
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }
    
    $response.OutputStream.Close()
}

$listener.Stop()
